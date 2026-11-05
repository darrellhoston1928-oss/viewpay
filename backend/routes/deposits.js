const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { encryptCode, hashCode, maskCode } = require('../crypto');
const redemptionAdapter = require('../services/redemptionAdapter');
const { sendNotification, sendEmail } = require('../services/mailer');

/**
 * Get deposit config and instructions
 */
router.get('/config', requireAuth, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();
    
    // Check if user is currently locked
    const user = db.prepare('SELECT deposit_lock_until FROM users WHERE id = ?').get(req.user.id);
    const isLocked = user && user.deposit_lock_until > Date.now();
    const lockRemainingMinutes = isLocked ? Math.ceil((user.deposit_lock_until - Date.now()) / 60000) : 0;

    res.json({
      supportedCards: [
        {
          id: 'razer_gold',
          name: 'Razer Gold e-Code',
          currency: 'USD',
          minAmount: 5.00,
          maxAmount: 1000.00,
          description: 'Razer Gold PIN / e-code purchased from Razer or authorized digital retailers.',
          instructionsUrl: 'https://gold.razer.com'
        },
        {
          id: 'apple',
          name: 'Apple Gift Card e-Code',
          currency: 'USD',
          minAmount: 10.00,
          maxAmount: 1000.00,
          description: 'US Apple Gift Card 16-digit digital code redeemable in US Dollar (USD).',
          instructionsUrl: 'https://www.apple.com/shop/gift-cards'
        }
      ],
      estimatedApprovalTime: '5-15 minutes during standard verification hours',
      rules: [
        'E-codes MUST be unused and strictly in USD ($) currency.',
        'Ensure the entered face value exactly matches the denomination on your receipt or e-voucher.',
        'Submitting invalid, used, or fraudulent codes will result in temporary or permanent account suspension.',
        'Once submitted, deposit submissions are final and cannot be edited or cancelled.'
      ],
      isLocked,
      lockRemainingMinutes,
      maxDepositsPerHour: settings ? settings.max_deposits_per_hour : 5
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve deposit configuration.' });
  }
});

/**
 * Submit a new e-code deposit
 */
router.post('/', requireAuth, upload.single('receipt'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardType, code, claimedAmount } = req.body;

    // Check account temporary lock
    const currentUser = db.prepare('SELECT deposit_lock_until, is_banned, email, display_name FROM users WHERE id = ?').get(userId);
    if (currentUser.deposit_lock_until && currentUser.deposit_lock_until > Date.now()) {
      const remainingMins = Math.ceil((currentUser.deposit_lock_until - Date.now()) / 60000);
      return res.status(429).json({
        error: `Your deposit privileges are temporarily restricted due to repeated invalid submissions. Please try again in ${remainingMins} minutes or contact support.`
      });
    }

    // Rate limit check: max deposits per hour (default 5)
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();
    const maxPerHour = settings ? settings.max_deposits_per_hour : 5;
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    const recentCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM deposits 
      WHERE user_id = ? AND created_at > ?
    `).get(userId, oneHourAgo).count;

    if (recentCount >= maxPerHour) {
      return res.status(429).json({
        error: `Submission limit reached: you may only submit ${maxPerHour} deposit requests per hour. Please wait before submitting another.`
      });
    }

    // Input validation
    if (!cardType || !['razer_gold', 'apple'].includes(cardType)) {
      return res.status(400).json({ error: 'Please select a valid card type (Razer Gold or Apple Gift Card).' });
    }

    if (!code || typeof code !== 'string' || code.trim().length < 6) {
      return res.status(400).json({ error: 'Please enter a valid e-code.' });
    }

    const amountNum = parseFloat(claimedAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Please enter a valid positive face value in USD ($).' });
    }

    if (!redemptionAdapter.validateFormat(cardType, code)) {
      return res.status(400).json({
        error: `The e-code does not appear to match the expected format for ${cardType === 'razer_gold' ? 'Razer Gold' : 'Apple Gift Card'}. Please check your code.`
      });
    }

    // Duplicate detection: SHA-256 hash
    const codeHash = hashCode(code);
    const existingCode = db.prepare('SELECT id, status, created_at FROM deposits WHERE code_hash = ?').get(codeHash);
    if (existingCode) {
      return res.status(400).json({
        error: 'This e-code has already been submitted to our system. Duplicate codes cannot be resubmitted.'
      });
    }

    // Check first-time deposit
    const approvedPrior = db.prepare("SELECT COUNT(*) as count FROM deposits WHERE user_id = ? AND status = 'approved'").get(userId).count;
    const isFirstTime = approvedPrior === 0 ? 1 : 0;

    // Check high-value deposit flag
    const highValueThreshold = settings ? settings.high_value_deposit_threshold : 100.0;
    const isHighValue = amountNum >= highValueThreshold ? 1 : 0;

    // Encrypt e-code with AES-256-GCM
    const encryptedCode = encryptCode(code);
    const masked = maskCode(code);

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/receipts/${req.file.filename}`;
    }

    const now = new Date().toISOString();

    const insertResult = db.prepare(`
      INSERT INTO deposits (
        user_id, card_type, code_hash, encrypted_code, masked_code,
        claimed_amount, receipt_url, status, is_flagged_high_value,
        is_flagged_first_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).run(
      userId, cardType, codeHash, encryptedCode, masked,
      amountNum, receiptUrl, isHighValue, isFirstTime, now
    );

    const depositId = insertResult.lastInsertRowid;

    // Dispatch in-app notification
    sendNotification({
      userId,
      title: 'Deposit Submitted for Verification',
      message: `Your ${cardType === 'razer_gold' ? 'Razer Gold' : 'Apple'} deposit for $${amountNum.toFixed(2)} USD has been submitted. Our compliance team will review and verify your code.`,
      type: 'system',
      link: '/wallet'
    });

    // Send confirmation email
    sendEmail({
      toEmail: currentUser.email,
      subject: `Deposit Pending Verification ($${amountNum.toFixed(2)} USD)`,
      template: 'deposit_submitted',
      bodyPreview: `We have received your ${cardType === 'razer_gold' ? 'Razer Gold' : 'Apple'} deposit request (#${depositId}) for $${amountNum.toFixed(2)} USD. Your code is securely encrypted and pending manual verification.`
    });

    const newDeposit = db.prepare(`
      SELECT id, user_id, card_type, masked_code, claimed_amount, receipt_url, status, rejection_reason, created_at
      FROM deposits WHERE id = ?
    `).get(depositId);

    res.status(201).json({
      deposit: newDeposit,
      message: 'Your deposit is awaiting verification by our team.'
    });
  } catch (err) {
    console.error('Deposit submission error:', err);
    res.status(500).json({ error: 'Failed to process deposit submission.' });
  }
});

/**
 * Get user's deposit history
 */
router.get('/history', requireAuth, (req, res) => {
  try {
    const deposits = db.prepare(`
      SELECT id, card_type, masked_code, claimed_amount, verified_amount, receipt_url, 
             status, rejection_reason, created_at, verified_at
      FROM deposits 
      WHERE user_id = ? 
      ORDER BY id DESC
    `).all(req.user.id);

    res.json({ deposits });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve deposit history.' });
  }
});

module.exports = router;
