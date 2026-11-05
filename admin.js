const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireRole, requireAdminRole } = require('../middleware/auth');
const { decryptCode } = require('../crypto');
const { sendNotification, sendEmail } = require('../services/mailer');

// All routes here require admin role
router.use(requireAuth, requireRole('admin'));

/**
 * Record an entry into the audit log
 */
function recordAuditLog({ adminId, adminName, action, targetType, targetId, details, req }) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (admin_id, admin_name, action, target_type, target_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, adminName, action, targetType, String(targetId), details, ip, now);
  } catch (err) {
    console.error('Audit log write error:', err.message);
  }
}

/**
 * Get Admin Dashboard Overview / Stats
 */
router.get('/stats', (req, res) => {
  try {
    const pendingDeposits = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(claimed_amount), 0) as total FROM deposits WHERE status = 'pending'").get();
    const approvedDeposits = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(verified_amount), 0) as total FROM deposits WHERE status = 'approved'").get();
    const pendingCreators = db.prepare("SELECT COUNT(*) as count FROM users WHERE creator_status = 'pending'").get().count;
    const pendingPayouts = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payout_requests WHERE status = 'pending'").get();
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;

    // Platform revenue calculations
    const purchaseFees = db.prepare("SELECT COALESCE(SUM(platform_fee), 0) as total FROM purchases").get().total;
    const totalVolume = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM purchases").get().total;

    res.json({
      pendingDepositsCount: pendingDeposits.count,
      pendingDepositsVolume: pendingDeposits.total,
      approvedDepositsVolume: approvedDeposits.total,
      pendingCreatorsCount: pendingCreators,
      pendingPayoutsCount: pendingPayouts.count,
      pendingPayoutsVolume: pendingPayouts.total,
      pendingReportsCount: pendingReports,
      totalUsers,
      totalPurchaseVolume: totalVolume,
      platformNetCommission: purchaseFees
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate platform statistics.' });
  }
});

/**
 * Deposit Review Queue (with filters & user context)
 */
router.get('/deposits', (req, res) => {
  try {
    const { status, cardType, search } = req.query;

    let query = `
      SELECT d.id, d.user_id, d.card_type, d.masked_code, d.claimed_amount, d.verified_amount, 
             d.receipt_url, d.status, d.rejection_reason, d.is_flagged_high_value, d.is_flagged_first_time,
             d.created_at, d.verified_at,
             u.display_name, u.email, u.username, u.avatar_url, u.wallet_balance, u.created_at as user_created_at,
             (SELECT COUNT(*) FROM deposits WHERE user_id = d.user_id AND status = 'approved') as user_approved_count,
             (SELECT COUNT(*) FROM deposits WHERE user_id = d.user_id AND status = 'rejected') as user_rejected_count
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND d.status = ?`;
      params.push(status);
    }

    if (cardType && cardType !== 'all') {
      query += ` AND d.card_type = ?`;
      params.push(cardType);
    }

    if (search) {
      query += ` AND (u.email LIKE ? OR u.display_name LIKE ? OR u.username LIKE ?)`;
      const searchWild = `%${search}%`;
      params.push(searchWild, searchWild, searchWild);
    }

    query += ` ORDER BY CASE WHEN d.status = 'pending' THEN 0 ELSE 1 END, d.id DESC`;

    const deposits = db.prepare(query).all(...params);
    res.json({ deposits });
  } catch (err) {
    console.error('Error fetching admin deposits:', err);
    res.status(500).json({ error: 'Failed to load deposit review queue.' });
  }
});

/**
 * Reveal plaintext e-code (Strictly Audit Logged)
 */
router.post('/deposits/:id/reveal', (req, res) => {
  try {
    const depositId = req.params.id;
    const deposit = db.prepare('SELECT id, user_id, card_type, encrypted_code, claimed_amount FROM deposits WHERE id = ?').get(depositId);

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found.' });
    }

    // Decrypt code
    const plainCode = decryptCode(deposit.encrypted_code);
    if (!plainCode) {
      return res.status(500).json({ error: 'Could not decrypt the security payload.' });
    }

    // Record audit log
    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'reveal_code',
      targetType: 'deposit',
      targetId: deposit.id,
      details: `Revealed plaintext e-code for ${deposit.card_type} (Claimed: $${deposit.claimed_amount.toFixed(2)})`,
      req
    });

    res.json({
      code: plainCode,
      message: 'Code revealed securely. This action has been written to the permanent audit log.'
    });
  } catch (err) {
    console.error('Error revealing code:', err);
    res.status(500).json({ error: 'Failed to reveal e-code.' });
  }
});

/**
 * Approve deposit
 */
router.post('/deposits/:id/approve', (req, res) => {
  try {
    const depositId = req.params.id;
    const { verifiedAmount } = req.body;

    const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(depositId);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit record not found.' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve deposit. Current status is already "${deposit.status}".` });
    }

    const finalAmount = verifiedAmount !== undefined ? parseFloat(verifiedAmount) : deposit.claimed_amount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid approved amount in USD ($).' });
    }

    const targetUser = db.prepare('SELECT id, email, display_name, wallet_balance FROM users WHERE id = ?').get(deposit.user_id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user no longer exists.' });
    }

    const now = new Date().toISOString();
    const newBalance = targetUser.wallet_balance + finalAmount;

    // Execute atomic update
    db.prepare(`
      UPDATE deposits SET 
        status = 'approved',
        verified_amount = ?,
        verified_by_admin_id = ?,
        verified_at = ?
      WHERE id = ?
    `).run(finalAmount, req.user.id, now, depositId);

    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newBalance, now, targetUser.id);

    // Record in transaction ledger
    const cardName = deposit.card_type === 'razer_gold' ? 'Razer Gold' : 'Apple Gift Card';
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'deposit', ?, ?, ?, ?, ?)
    `).run(
      targetUser.id,
      finalAmount,
      newBalance,
      `Deposit Approved: ${cardName} (${deposit.masked_code})`,
      `DEP-${depositId}`,
      now
    );

    // Audit log
    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'approve_deposit',
      targetType: 'deposit',
      targetId: depositId,
      details: `Approved ${cardName} deposit for $${finalAmount.toFixed(2)} USD (Claimed: $${deposit.claimed_amount.toFixed(2)}) for ${targetUser.email}`,
      req
    });

    // Notify user
    sendNotification({
      userId: targetUser.id,
      title: 'Deposit Approved & Credited! 💰',
      message: `Your ${cardName} deposit of $${finalAmount.toFixed(2)} USD has been verified and added to your wallet. Current Balance: $${newBalance.toFixed(2)} USD.`,
      type: 'deposit_approved',
      link: '/wallet'
    });

    sendEmail({
      toEmail: targetUser.email,
      subject: `Deposit Verified & Credited: $${finalAmount.toFixed(2)} USD Added to Your Wallet`,
      template: 'deposit_approved',
      bodyPreview: `Great news! Your ${cardName} e-code (#${depositId}) was approved by our team. $${finalAmount.toFixed(2)} USD is now available in your Viewpay balance.`
    });

    res.json({
      message: `Deposit #${depositId} approved and $${finalAmount.toFixed(2)} USD credited to user.`,
      newBalance
    });
  } catch (err) {
    console.error('Error approving deposit:', err);
    res.status(500).json({ error: 'Failed to approve deposit.' });
  }
});

/**
 * Reject deposit
 */
router.post('/deposits/:id/reject', (req, res) => {
  try {
    const depositId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A specific rejection reason must be provided.' });
    }

    const deposit = db.prepare('SELECT * FROM deposits WHERE id = ?').get(depositId);
    if (!deposit) {
      return res.status(404).json({ error: 'Deposit record not found.' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject deposit. Current status is already "${deposit.status}".` });
    }

    const targetUser = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(deposit.user_id);
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE deposits SET 
        status = 'rejected',
        rejection_reason = ?,
        verified_by_admin_id = ?,
        verified_at = ?
      WHERE id = ?
    `).run(reason.trim(), req.user.id, now, depositId);

    // Audit log
    const cardName = deposit.card_type === 'razer_gold' ? 'Razer Gold' : 'Apple Gift Card';
    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'reject_deposit',
      targetType: 'deposit',
      targetId: depositId,
      details: `Rejected ${cardName} deposit ($${deposit.claimed_amount.toFixed(2)}). Reason: "${reason.trim()}" for user ${targetUser ? targetUser.email : 'Unknown'}`,
      req
    });

    // Check rejection frequency: if user has >= 3 rejected deposits in the last 24h, temporarily lock account
    const pastDay = new Date(Date.now() - 86400000).toISOString();
    const rejectionCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM deposits 
      WHERE user_id = ? AND status = 'rejected' AND verified_at > ?
    `).get(deposit.user_id, pastDay).count;

    if (rejectionCount >= 3) {
      const lockUntil = Date.now() + 2 * 3600000; // 2 hour lock
      db.prepare('UPDATE users SET deposit_lock_until = ? WHERE id = ?').run(lockUntil, deposit.user_id);

      sendNotification({
        userId: deposit.user_id,
        title: 'Account Deposit Notice: Temporary Cooldown',
        message: 'Your account has encountered 3 or more rejected deposit submissions. To maintain platform integrity, deposit submissions are paused for 2 hours.',
        type: 'system'
      });
    }

    // Send notifications
    if (targetUser) {
      sendNotification({
        userId: targetUser.id,
        title: 'Deposit Verification Notice: Rejected',
        message: `Your ${cardName} deposit for $${deposit.claimed_amount.toFixed(2)} USD could not be approved. Reason: ${reason.trim()}`,
        type: 'deposit_rejected',
        link: '/wallet'
      });

      sendEmail({
        toEmail: targetUser.email,
        subject: `Deposit Rejected (#${depositId}) - Action Required`,
        template: 'deposit_rejected',
        bodyPreview: `Your ${cardName} deposit could not be verified by our team. Stated reason: ${reason.trim()}. Please ensure your code is unused, valid, and in USD currency.`
      });
    }

    res.json({ message: `Deposit #${depositId} has been rejected.` });
  } catch (err) {
    console.error('Error rejecting deposit:', err);
    res.status(500).json({ error: 'Failed to reject deposit.' });
  }
});

/**
 * Creator Verification Queue
 */
router.get('/creators', (req, res) => {
  try {
    const creators = db.prepare(`
      SELECT id, display_name, username, email, avatar_url, category, 
             creator_status, creator_id_doc_url, creator_rejection_reason, created_at
      FROM users
      WHERE role = 'creator' OR creator_status != 'none'
      ORDER BY CASE WHEN creator_status = 'pending' THEN 0 ELSE 1 END, id DESC
    `).all();

    res.json({ creators });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch creator applications.' });
  }
});

/**
 * Approve Creator
 */
router.post('/creators/:id/approve', (req, res) => {
  try {
    const creatorId = req.params.id;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET 
        role = 'creator',
        creator_status = 'approved',
        updated_at = ?
      WHERE id = ?
    `).run(now, creatorId);

    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'approve_creator',
      targetType: 'user',
      targetId: creatorId,
      details: 'Approved creator identity verification',
      req
    });

    sendNotification({
      userId: creatorId,
      title: 'Creator Verification Approved! 🌟',
      message: 'Congratulations! Your creator profile is approved. You can now publish locked posts, configure subscription tiers, and earn revenue.',
      type: 'system',
      link: '/creator/dashboard'
    });

    res.json({ message: 'Creator approved successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve creator.' });
  }
});

/**
 * Reject Creator
 */
router.post('/creators/:id/reject', (req, res) => {
  try {
    const creatorId = req.params.id;
    const { reason } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET 
        creator_status = 'rejected',
        creator_rejection_reason = ?,
        updated_at = ?
      WHERE id = ?
    `).run(reason || 'ID document unverified', now, creatorId);

    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'reject_creator',
      targetType: 'user',
      targetId: creatorId,
      details: `Rejected creator verification: ${reason}`,
      req
    });

    sendNotification({
      userId: creatorId,
      title: 'Creator Verification Notice',
      message: `Your creator application was not approved. Reason: ${reason || 'ID verification requirements not met.'}`,
      type: 'system',
      link: '/settings'
    });

    res.json({ message: 'Creator application rejected.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject creator.' });
  }
});

/**
 * Payout Requests Queue
 */
router.get('/payouts', (req, res) => {
  try {
    const payouts = db.prepare(`
      SELECT p.id, p.creator_id, p.amount, p.payout_method, p.payout_details, 
             p.status, p.admin_notes, p.created_at, p.processed_at,
             u.display_name, u.email, u.username, u.wallet_balance
      FROM payout_requests p
      JOIN users u ON p.creator_id = u.id
      ORDER BY CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END, p.id DESC
    `).all();

    res.json({ payouts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payout requests.' });
  }
});

/**
 * Mark Payout as Paid
 */
router.post('/payouts/:id/mark-paid', (req, res) => {
  try {
    const payoutId = req.params.id;
    const { notes } = req.body;
    const now = new Date().toISOString();

    const payout = db.prepare('SELECT * FROM payout_requests WHERE id = ?').get(payoutId);
    if (!payout || payout.status !== 'pending') {
      return res.status(400).json({ error: 'Payout request not pending.' });
    }

    db.prepare(`
      UPDATE payout_requests SET 
        status = 'paid',
        admin_notes = ?,
        processed_by_admin_id = ?,
        processed_at = ?
      WHERE id = ?
    `).run(notes || 'Dispatched via provider', req.user.id, now, payoutId);

    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'approve_payout',
      targetType: 'payout',
      targetId: payoutId,
      details: `Processed payout of $${payout.amount.toFixed(2)} USD via ${payout.payout_method}`,
      req
    });

    sendNotification({
      userId: payout.creator_id,
      title: 'Payout Processed! 💵',
      message: `Your withdrawal of $${payout.amount.toFixed(2)} USD has been sent via ${payout.payout_method.toUpperCase()}.`,
      type: 'payout_processed'
    });

    res.json({ message: 'Payout marked as successfully paid.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout.' });
  }
});

/**
 * Content Moderation Queue
 */
router.get('/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT r.id, r.reporter_id, r.post_id, r.reason, r.details, r.status, r.created_at,
             u.display_name as reporter_name,
             p.title as post_title, p.media_url, p.preview_url, p.creator_id, p.is_hidden,
             c.display_name as creator_name, c.email as creator_email
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      JOIN posts p ON r.post_id = p.id
      JOIN users c ON p.creator_id = c.id
      ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.id DESC
    `).all();

    res.json({ reports });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moderation reports.' });
  }
});

/**
 * Moderation Action on Post (Hide or Dismiss)
 */
router.post('/reports/:id/action', (req, res) => {
  try {
    const reportId = req.params.id;
    const { action } = req.body; // 'hide_post' or 'dismiss'
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);

    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (action === 'hide_post') {
      db.prepare('UPDATE posts SET is_hidden = 1 WHERE id = ?').run(report.post_id);
      db.prepare('UPDATE reports SET status = \'actioned\', reviewed_by_admin_id = ? WHERE id = ?').run(req.user.id, reportId);
      recordAuditLog({
        adminId: req.user.id,
        adminName: req.user.display_name,
        action: 'remove_post',
        targetType: 'post',
        targetId: report.post_id,
        details: `Removed post due to report #${reportId} (${report.reason})`,
        req
      });
    } else {
      db.prepare('UPDATE reports SET status = \'dismissed\', reviewed_by_admin_id = ? WHERE id = ?').run(req.user.id, reportId);
    }

    res.json({ message: 'Moderation action applied.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process report.' });
  }
});

/**
 * User Management List & Actions
 */
router.get('/users', (req, res) => {
  try {
    const { search, role } = req.query;
    let query = `
      SELECT id, email, role, admin_role, display_name, username, wallet_balance,
             is_banned, ban_reason, creator_status, created_at
      FROM users WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      query += ` AND (email LIKE ? OR display_name LIKE ? OR username LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    query += ` ORDER BY id DESC LIMIT 100`;
    const users = db.prepare(query).all(...params);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

/**
 * Ban or Unban user
 */
router.post('/users/:id/ban', (req, res) => {
  try {
    const targetId = req.params.id;
    const { isBanned, reason } = req.body;

    if (parseInt(targetId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot ban your own administrator account.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_banned = ?, ban_reason = ?, updated_at = ? WHERE id = ?').run(
      isBanned ? 1 : 0,
      reason || '',
      now,
      targetId
    );

    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: isBanned ? 'ban_user' : 'unban_user',
      targetType: 'user',
      targetId,
      details: isBanned ? `Banned user. Reason: ${reason}` : 'Unbanned user account',
      req
    });

    res.json({ message: `User account has been ${isBanned ? 'banned' : 'unbanned'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user ban status.' });
  }
});

/**
 * Get Audit Logs
 */
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200
    `).all();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit log records.' });
  }
});

/**
 * Get / Update Platform Settings (Owner only)
 */
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings.' });
  }
});

router.put('/settings', requireAdminRole('owner'), (req, res) => {
  try {
    const { platformCommissionPercent, minPayoutAmount, highValueDepositThreshold, maxDepositsPerHour, maintenanceMode } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE platform_settings SET
        platform_commission_percent = COALESCE(?, platform_commission_percent),
        min_payout_amount = COALESCE(?, min_payout_amount),
        high_value_deposit_threshold = COALESCE(?, high_value_deposit_threshold),
        max_deposits_per_hour = COALESCE(?, max_deposits_per_hour),
        maintenance_mode = COALESCE(?, maintenance_mode),
        updated_at = ?
      WHERE id = 1
    `).run(
      platformCommissionPercent !== undefined ? parseFloat(platformCommissionPercent) : null,
      minPayoutAmount !== undefined ? parseFloat(minPayoutAmount) : null,
      highValueDepositThreshold !== undefined ? parseFloat(highValueDepositThreshold) : null,
      maxDepositsPerHour !== undefined ? parseInt(maxDepositsPerHour, 10) : null,
      maintenanceMode !== undefined ? (maintenanceMode ? 1 : 0) : null,
      now
    );

    recordAuditLog({
      adminId: req.user.id,
      adminName: req.user.display_name,
      action: 'update_settings',
      targetType: 'settings',
      targetId: '1',
      details: `Updated platform configuration (Commission: ${platformCommissionPercent}%)`,
      req
    });

    const updated = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();
    res.json({ settings: updated, message: 'Settings updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update platform settings.' });
  }
});

module.exports = router;
