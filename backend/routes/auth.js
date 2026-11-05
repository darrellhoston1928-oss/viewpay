const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');
const { sendEmail, sendNotification } = require('../services/mailer');

/**
 * Register manual account
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, displayName, role, isAgeConfirmed } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Please provide email, password, and display name.' });
    }

    if (!isAgeConfirmed) {
      return res.status(400).json({ error: 'You must confirm that you are at least 18 years of age to access Viewpay.' });
    }

    const assignedRole = role === 'creator' ? 'creator' : 'viewer';
    const emailNorm = email.trim().toLowerCase();

    // Check duplicate email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailNorm);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const username = `${baseUsername}_${randomSuffix}`;

    const passwordHash = bcrypt.hashSync(password, 10);
    const verifyToken = crypto.randomBytes(24).toString('hex');
    const now = new Date().toISOString();

    const insertResult = db.prepare(`
      INSERT INTO users (
        email, password_hash, role, display_name, username, 
        is_age_verified, is_email_verified, email_verification_token, 
        wallet_balance, creator_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, 0, ?, 0.00, ?, ?, ?)
    `).run(
      emailNorm, passwordHash, assignedRole, displayName.trim(), username,
      verifyToken, assignedRole === 'creator' ? 'pending' : 'none', now, now
    );

    const userId = insertResult.lastInsertRowid;

    // Send welcome email & verification token
    sendEmail({
      toEmail: emailNorm,
      subject: 'Welcome to Viewpay - Please Verify Your Email',
      template: 'welcome_verification',
      bodyPreview: `Welcome to Viewpay! Confirm your registration by using verification token: ${verifyToken} or clicking verify in your profile settings.`
    });

    sendNotification({
      userId,
      title: 'Welcome to Viewpay!',
      message: `Your account as a ${assignedRole.toUpperCase()} has been created. Explore top creators or deposit funds to unlock exclusive content.`,
      type: 'system'
    });

    const token = jwt.sign({ id: userId, role: assignedRole }, JWT_SECRET, { expiresIn: '7d' });

    const newUser = db.prepare(`
      SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
             category, is_age_verified, is_email_verified, wallet_balance, creator_status, subscription_price, created_at
      FROM users WHERE id = ?
    `).get(userId);

    res.status(201).json({
      token,
      user: newUser,
      message: 'Account registered successfully. Please verify your email.'
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

/**
 * Login
 */
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: `Account suspended: ${user.ban_reason || 'Terms violation.'}` });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = db.prepare(`
      SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
             category, is_age_verified, is_email_verified, wallet_balance, creator_status, subscription_price, allow_subscriptions, created_at
      FROM users WHERE id = ?
    `).get(user.id);

    res.json({
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

/**
 * Google OAuth Mock / One-Click Sign-in
 */
router.post('/google', (req, res) => {
  try {
    const { email, displayName, photoUrl, role = 'viewer' } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google authentication did not provide an email.' });
    }

    const emailNorm = email.trim().toLowerCase();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(emailNorm);
    const now = new Date().toISOString();

    if (!user) {
      // Create user via Google
      const baseUsername = (displayName || 'google_user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      const username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = bcrypt.hashSync(randomPassword, 10);

      const insertResult = db.prepare(`
        INSERT INTO users (
          email, password_hash, role, display_name, username, avatar_url,
          is_age_verified, is_email_verified, wallet_balance, creator_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0.00, ?, ?, ?)
      `).run(
        emailNorm, passwordHash, role === 'creator' ? 'creator' : 'viewer',
        displayName || 'Google Member', username, photoUrl || '',
        role === 'creator' ? 'pending' : 'none', now, now
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(insertResult.lastInsertRowid);

      sendNotification({
        userId: user.id,
        title: 'Google Sign-In Connected',
        message: 'Your Google Account was linked successfully to Viewpay.',
        type: 'system'
      });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: `Account suspended: ${user.ban_reason || 'Terms violation.'}` });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userProfile = db.prepare(`
      SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
             category, is_age_verified, is_email_verified, wallet_balance, creator_status, subscription_price, allow_subscriptions, created_at
      FROM users WHERE id = ?
    `).get(user.id);

    res.json({ token, user: userProfile });
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.status(500).json({ error: 'Server error during Google authentication.' });
  }
});

/**
 * Get current user profile (/me)
 */
router.get('/me', requireAuth, (req, res) => {
  try {
    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id).count;
    const pendingDepositsCount = db.prepare("SELECT COUNT(*) as count FROM deposits WHERE user_id = ? AND status = 'pending'").get(req.user.id).count;

    res.json({
      user: req.user,
      unreadCount,
      pendingDepositsCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * Update user settings
 */
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { displayName, bio, avatarUrl, coverUrl, category, subscriptionPrice, allowSubscriptions } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET 
        display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        cover_url = COALESCE(?, cover_url),
        category = COALESCE(?, category),
        subscription_price = COALESCE(?, subscription_price),
        allow_subscriptions = COALESCE(?, allow_subscriptions),
        updated_at = ?
      WHERE id = ?
    `).run(
      displayName ? displayName.trim() : null,
      bio !== undefined ? bio : null,
      avatarUrl !== undefined ? avatarUrl : null,
      coverUrl !== undefined ? coverUrl : null,
      category || null,
      subscriptionPrice !== undefined ? parseFloat(subscriptionPrice) : null,
      allowSubscriptions !== undefined ? (allowSubscriptions ? 1 : 0) : null,
      now,
      req.user.id
    );

    const updated = db.prepare(`
      SELECT id, email, role, admin_role, display_name, username, bio, avatar_url, cover_url, 
             category, is_age_verified, is_email_verified, wallet_balance, creator_status, subscription_price, allow_subscriptions, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({ user: updated, message: 'Profile updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * Change password
 */
router.put('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password does not match our records.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, now, req.user.id);

    sendNotification({
      userId: req.user.id,
      title: 'Security Alert: Password Changed',
      message: 'Your Viewpay password was recently updated. If this was not you, please contact support immediately.',
      type: 'system'
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

/**
 * Verify Email token
 */
router.post('/verify-email', (req, res) => {
  try {
    const { token, email } = req.body;
    const user = db.prepare('SELECT id, email_verification_token FROM users WHERE email = ?').get(email?.toLowerCase());

    if (!user || user.email_verification_token !== token) {
      return res.status(400).json({ error: 'Invalid or expired email verification token.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET is_email_verified = 1, email_verification_token = NULL, updated_at = ? WHERE id = ?').run(now, user.id);

    res.json({ message: 'Email address verified successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

/**
 * Forgot password request
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Please enter your email address.' });

    const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      const expires = Date.now() + 3600000; // 1 hour
      db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?').run(resetToken, expires, user.id);

      sendEmail({
        toEmail: user.email,
        subject: 'Reset your Viewpay Password',
        template: 'password_reset',
        bodyPreview: `You requested a password reset. Use token: ${resetToken} within 60 minutes to choose a new password.`
      });
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account matches that email, a password reset instruction has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Error processing password reset.' });
  }
});

/**
 * Reset password with token
 */
router.post('/reset-password', (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }

    const user = db.prepare('SELECT id, password_reset_token, password_reset_expires FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || user.password_reset_token !== token || Date.now() > user.password_reset_expires) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = ? WHERE id = ?').run(hash, now, user.id);

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/**
 * Delete account
 */
router.delete('/account', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    // Anonymize user to preserve ledger integrity
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE users SET 
        email = ?,
        display_name = 'Deleted User',
        username = ?,
        is_banned = 1,
        ban_reason = 'Account deleted by user request',
        avatar_url = '',
        bio = '',
        wallet_balance = 0.00,
        updated_at = ?
      WHERE id = ?
    `).run(`deleted_${userId}@viewpay.internal`, `deleted_${userId}`, now, userId);

    res.json({ message: 'Your account has been deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account.' });
  }
});

module.exports = router;
