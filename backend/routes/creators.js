const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { sendNotification, sendEmail } = require('../services/mailer');

/**
 * Explore / Search creators
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search, sort = 'popular' } = req.query;

    let query = `
      SELECT u.id, u.display_name, u.username, u.avatar_url, u.cover_url, u.bio, u.category,
             u.subscription_price, u.allow_subscriptions, u.creator_status,
             (SELECT COUNT(*) FROM subscriptions WHERE creator_id = u.id AND status = 'active') as subscriber_count,
             (SELECT COUNT(*) FROM posts WHERE creator_id = u.id AND is_hidden = 0) as post_count,
             (SELECT COALESCE(SUM(views_count), 0) FROM posts WHERE creator_id = u.id) as total_views
      FROM users u
      WHERE u.role = 'creator' AND u.creator_status = 'approved' AND u.is_banned = 0
    `;
    const params = [];

    if (category && category !== 'All') {
      query += ` AND u.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (u.display_name LIKE ? OR u.username LIKE ? OR u.bio LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (sort === 'newest') {
      query += ` ORDER BY u.id DESC`;
    } else if (sort === 'name') {
      query += ` ORDER BY u.display_name ASC`;
    } else {
      // Default: popular
      query += ` ORDER BY (subscriber_count * 5 + total_views) DESC, u.id DESC`;
    }

    const creators = db.prepare(query).all(...params);

    // If viewer is logged in, attach subscription status
    const currentUserId = req.user ? req.user.id : null;
    const enriched = creators.map(c => {
      let isSubscribed = false;
      if (currentUserId) {
        const sub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(currentUserId, c.id);
        isSubscribed = !!sub;
      }
      return { ...c, isSubscribed };
    });

    res.json({ creators: enriched });
  } catch (err) {
    console.error('Error fetching creators:', err);
    res.status(500).json({ error: 'Failed to explore creators.' });
  }
});

/**
 * Get Creator Profile by Username
 */
router.get('/:username', optionalAuth, (req, res) => {
  try {
    const { username } = req.params;
    const creator = db.prepare(`
      SELECT id, display_name, username, avatar_url, cover_url, bio, category,
             subscription_price, allow_subscriptions, creator_status, created_at,
             (SELECT COUNT(*) FROM subscriptions WHERE creator_id = users.id AND status = 'active') as subscriber_count,
             (SELECT COUNT(*) FROM posts WHERE creator_id = users.id AND is_hidden = 0) as post_count
      FROM users
      WHERE username = ? AND is_banned = 0
    `).get(username);

    if (!creator) {
      return res.status(404).json({ error: 'Creator not found.' });
    }

    const currentUserId = req.user ? req.user.id : null;
    let isSubscribed = false;

    if (currentUserId) {
      const activeSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(currentUserId, creator.id);
      isSubscribed = !!activeSub;
    }

    // Fetch creator posts
    const posts = db.prepare(`
      SELECT id, title, description, media_type, preview_url, price, is_locked, 
             category, views_count, likes_count, created_at
      FROM posts 
      WHERE creator_id = ? AND is_hidden = 0
      ORDER BY id DESC
    `).all(creator.id);

    // Check which posts are unlocked for this viewer
    const enrichedPosts = posts.map(p => {
      let isUnlocked = !p.is_locked || isSubscribed || (currentUserId && currentUserId === creator.id);
      if (!isUnlocked && currentUserId) {
        const purchase = db.prepare('SELECT id FROM purchases WHERE user_id = ? AND post_id = ?').get(currentUserId, p.id);
        if (purchase) isUnlocked = true;
      }
      return {
        ...p,
        isUnlocked
      };
    });

    res.json({
      creator: {
        ...creator,
        isSubscribed
      },
      posts: enrichedPosts
    });
  } catch (err) {
    console.error('Error loading creator profile:', err);
    res.status(500).json({ error: 'Failed to load creator profile.' });
  }
});

/**
 * Subscribe to a creator (Monthly)
 */
router.post('/:creatorId/subscribe', requireAuth, (req, res) => {
  try {
    const creatorId = parseInt(req.params.creatorId, 10);
    const userId = req.user.id;

    if (creatorId === userId) {
      return res.status(400).json({ error: 'You cannot subscribe to your own account.' });
    }

    const creator = db.prepare('SELECT id, display_name, email, subscription_price, allow_subscriptions, wallet_balance FROM users WHERE id = ?').get(creatorId);
    if (!creator || !creator.allow_subscriptions) {
      return res.status(400).json({ error: 'This creator is not currently accepting subscriptions.' });
    }

    // Check if already actively subscribed
    const existingSub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(userId, creatorId);
    if (existingSub) {
      return res.status(400).json({ error: 'You are already actively subscribed to this creator.' });
    }

    const monthlyPrice = creator.subscription_price || 9.99;
    const viewer = db.prepare('SELECT wallet_balance, email, display_name FROM users WHERE id = ?').get(userId);

    // Insufficient balance check
    if (viewer.wallet_balance < monthlyPrice) {
      return res.status(402).json({
        error: 'Insufficient wallet balance.',
        insufficientBalance: true,
        requiredAmount: monthlyPrice,
        currentBalance: viewer.wallet_balance,
        deficit: (monthlyPrice - viewer.wallet_balance).toFixed(2)
      });
    }

    // Platform settings for commission
    const settings = db.prepare('SELECT platform_commission_percent FROM platform_settings WHERE id = 1').get();
    const commPercent = settings ? settings.platform_commission_percent : 20.0;
    const platformFee = parseFloat((monthlyPrice * (commPercent / 100)).toFixed(2));
    const creatorNet = parseFloat((monthlyPrice - platformFee).toFixed(2));

    const now = new Date();
    const nowIso = now.toISOString();
    const renewDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(); // +30 days

    const newViewerBalance = viewer.wallet_balance - monthlyPrice;
    const newCreatorBalance = creator.wallet_balance + creatorNet;

    // Execute atomic update
    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newViewerBalance, nowIso, userId);
    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newCreatorBalance, nowIso, creatorId);

    // Create subscription
    const subResult = db.prepare(`
      INSERT INTO subscriptions (user_id, creator_id, amount, status, started_at, renew_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `).run(userId, creatorId, monthlyPrice, nowIso, renewDate);

    // Record transactions
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'subscription', ?, ?, ?, ?, ?)
    `).run(
      userId,
      -monthlyPrice,
      newViewerBalance,
      `Monthly Subscription to @${creator.display_name}`,
      `SUB-${subResult.lastInsertRowid}`,
      nowIso
    );

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'creator_earning', ?, ?, ?, ?, ?)
    `).run(
      creatorId,
      creatorNet,
      newCreatorBalance,
      `New Subscriber: ${viewer.display_name} (Gross: $${monthlyPrice.toFixed(2)}, Net: $${creatorNet.toFixed(2)})`,
      `SUB-${subResult.lastInsertRowid}`,
      nowIso
    );

    // Notifications
    sendNotification({
      userId,
      title: `Subscribed to ${creator.display_name}! 🎉`,
      message: `You now have full access to all exclusive content by ${creator.display_name}. Subscription renews on ${new Date(renewDate).toLocaleDateString()}.`,
      type: 'system',
      link: `/creator/${creator.display_name}`
    });

    sendNotification({
      userId: creatorId,
      title: 'New Subscriber! 🚀',
      message: `${viewer.display_name} just subscribed to your profile! $${creatorNet.toFixed(2)} USD added to your creator earnings.`,
      type: 'new_subscriber',
      link: '/creator/dashboard'
    });

    sendEmail({
      toEmail: viewer.email,
      subject: `Subscription Confirmation: ${creator.display_name}`,
      template: 'subscription_started',
      bodyPreview: `Thank you for supporting ${creator.display_name}! Your monthly subscription of $${monthlyPrice.toFixed(2)} USD is active and unlocks all posts.`
    });

    res.json({
      message: `Successfully subscribed to ${creator.display_name}!`,
      newBalance: newViewerBalance,
      renewAt: renewDate
    });
  } catch (err) {
    console.error('Subscription error:', err);
    res.status(500).json({ error: 'Failed to process subscription.' });
  }
});

/**
 * Cancel monthly subscription
 */
router.post('/:creatorId/unsubscribe', requireAuth, (req, res) => {
  try {
    const creatorId = parseInt(req.params.creatorId, 10);
    const userId = req.user.id;
    const now = new Date().toISOString();

    const sub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(userId, creatorId);
    if (!sub) {
      return res.status(404).json({ error: 'No active subscription found.' });
    }

    db.prepare('UPDATE subscriptions SET status = "cancelled", cancelled_at = ? WHERE id = ?').run(now, sub.id);

    res.json({ message: 'Subscription cancelled. You will retain access until the end of the billing period.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel subscription.' });
  }
});

/**
 * Apply for Creator Verification
 */
router.post('/apply-verification', requireAuth, upload.single('creator_id_doc'), (req, res) => {
  try {
    const userId = req.user.id;
    const { category, bio } = req.body;

    let docUrl = '';
    if (req.file) {
      docUrl = `/uploads/docs/${req.file.filename}`;
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users SET 
        role = 'creator',
        creator_status = 'pending',
        creator_id_doc_url = COALESCE(?, creator_id_doc_url),
        category = COALESCE(?, category),
        bio = COALESCE(?, bio),
        updated_at = ?
      WHERE id = ?
    `).run(docUrl || null, category || null, bio || null, now, userId);

    sendNotification({
      userId,
      title: 'Creator Application Received 📋',
      message: 'Your identity and creator application has been submitted for review by our administrative team. We typically verify within 24 hours.',
      type: 'system'
    });

    res.json({ message: 'Creator verification application submitted successfully!' });
  } catch (err) {
    console.error('Creator application error:', err);
    res.status(500).json({ error: 'Failed to submit creator application.' });
  }
});

module.exports = router;
