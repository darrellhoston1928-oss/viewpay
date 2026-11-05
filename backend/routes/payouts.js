const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendNotification } = require('../services/mailer');

/**
 * Get Creator Payout Stats & Configuration
 */
router.get('/stats', requireAuth, requireRole(['creator', 'admin']), (req, res) => {
  try {
    const creatorId = req.user.id;
    const settings = db.prepare('SELECT min_payout_amount, platform_commission_percent FROM platform_settings WHERE id = 1').get();
    const minPayout = settings ? settings.min_payout_amount : 50.0;
    const commRate = settings ? settings.platform_commission_percent : 20.0;

    // Current balance
    const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(creatorId);

    // Lifetime creator earnings
    const lifetimeEarned = db.prepare(`
      SELECT COALESCE(SUM(creator_earnings), 0) as total FROM purchases 
      WHERE post_id IN (SELECT id FROM posts WHERE creator_id = ?)
    `).get(creatorId).total;

    // Active subscribers
    const activeSubscribers = db.prepare(`
      SELECT COUNT(*) as count FROM subscriptions WHERE creator_id = ? AND status = 'active'
    `).get(creatorId).count;

    // Monthly recurring estimate
    const subPrice = req.user.subscription_price || 9.99;
    const grossMRR = activeSubscribers * subPrice;
    const netMRR = grossMRR * (1 - commRate / 100);

    // Pending withdrawal amount
    const pendingWithdrawal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payout_requests WHERE creator_id = ? AND status = 'pending'
    `).get(creatorId).total;

    res.json({
      availableBalance: user.wallet_balance,
      lifetimeEarned,
      activeSubscribers,
      estimatedMRR: netMRR,
      pendingWithdrawal,
      minPayoutAmount: minPayout,
      platformCommissionPercent: commRate
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payout statistics.' });
  }
});

/**
 * Submit Payout Request
 */
router.post('/request', requireAuth, requireRole(['creator', 'admin']), (req, res) => {
  try {
    const creatorId = req.user.id;
    const { amount, payoutMethod, payoutDetails } = req.body;

    const amountNum = parseFloat(amount);
    const settings = db.prepare('SELECT min_payout_amount FROM platform_settings WHERE id = 1').get();
    const minPayout = settings ? settings.min_payout_amount : 50.0;

    if (isNaN(amountNum) || amountNum < minPayout) {
      return res.status(400).json({ error: `Minimum payout request is $${minPayout.toFixed(2)} USD.` });
    }

    if (!payoutMethod || !['paypal', 'bank_wire', 'usdt'].includes(payoutMethod)) {
      return res.status(400).json({ error: 'Please choose a valid payout method (PayPal, Bank Wire, or USDT).' });
    }

    if (!payoutDetails || !payoutDetails.trim()) {
      return res.status(400).json({ error: 'Please provide destination payout details (e.g., PayPal email, bank IBAN, or USDT address).' });
    }

    const user = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(creatorId);
    if (user.wallet_balance < amountNum) {
      return res.status(400).json({
        error: `Insufficient balance. Available: $${user.wallet_balance.toFixed(2)} USD, Requested: $${amountNum.toFixed(2)} USD.`
      });
    }

    const now = new Date().toISOString();
    const newBalance = user.wallet_balance - amountNum;

    // Deduct available balance
    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newBalance, now, creatorId);

    // Create payout request
    const insertResult = db.prepare(`
      INSERT INTO payout_requests (creator_id, amount, payout_method, payout_details, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(creatorId, amountNum, payoutMethod, payoutDetails.trim(), now);

    // Ledger transaction
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'payout', ?, ?, ?, ?, ?)
    `).run(
      creatorId,
      -amountNum,
      newBalance,
      `Payout Request: $${amountNum.toFixed(2)} USD via ${payoutMethod.toUpperCase()}`,
      `PAY-${insertResult.lastInsertRowid}`,
      now
    );

    sendNotification({
      userId: creatorId,
      title: 'Payout Request Submitted 🏦',
      message: `Your withdrawal request for $${amountNum.toFixed(2)} USD has been queued for processing by platform administrators.`,
      type: 'system'
    });

    res.status(201).json({
      message: 'Payout request submitted successfully. Processing usually takes 24-48 business hours.',
      newBalance
    });
  } catch (err) {
    console.error('Payout request error:', err);
    res.status(500).json({ error: 'Failed to process payout request.' });
  }
});

/**
 * Payout History
 */
router.get('/history', requireAuth, requireRole(['creator', 'admin']), (req, res) => {
  try {
    const creatorId = req.user.id;
    const history = db.prepare(`
      SELECT * FROM payout_requests WHERE creator_id = ? ORDER BY id DESC
    `).all(creatorId);

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve payout history.' });
  }
});

module.exports = router;
