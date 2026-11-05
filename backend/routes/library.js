const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * Get all unlocked posts for current user
 */
router.get('/unlocked', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Posts unlocked via pay-per-post purchase OR creator's active subscription
    const posts = db.prepare(`
      SELECT * FROM (
        SELECT DISTINCT p.id, p.title, p.description, p.media_type, p.media_url, p.preview_url,
                        p.price, p.category, p.views_count, p.likes_count, p.created_at,
                        u.id as creator_id, u.display_name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar,
                        'purchased' as unlock_type
        FROM purchases pur
        JOIN posts p ON pur.post_id = p.id
        JOIN users u ON p.creator_id = u.id
        WHERE pur.user_id = ? AND p.is_hidden = 0

        UNION

        SELECT DISTINCT p.id, p.title, p.description, p.media_type, p.media_url, p.preview_url,
                        p.price, p.category, p.views_count, p.likes_count, p.created_at,
                        u.id as creator_id, u.display_name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar,
                        'subscription' as unlock_type
        FROM subscriptions s
        JOIN posts p ON s.creator_id = p.creator_id
        JOIN users u ON p.creator_id = u.id
        WHERE s.user_id = ? AND s.status = 'active' AND p.is_hidden = 0
      )
      ORDER BY id DESC
    `).all(userId, userId);

    res.json({ posts: posts.map(p => ({ ...p, isUnlocked: true })) });
  } catch (err) {
    console.error('Error fetching unlocked library:', err);
    res.status(500).json({ error: 'Failed to load unlocked library.' });
  }
});

/**
 * Get active subscriptions
 */
router.get('/subscriptions', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptions = db.prepare(`
      SELECT s.id, s.amount, s.status, s.started_at, s.renew_at, s.cancelled_at,
             u.id as creator_id, u.display_name as creator_name, u.username as creator_username,
             u.avatar_url as creator_avatar, u.category as creator_category, u.bio as creator_bio
      FROM subscriptions s
      JOIN users u ON s.creator_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.id DESC
    `).all(userId);

    res.json({ subscriptions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
});

/**
 * Get saved bookmarks
 */
router.get('/saved', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const posts = db.prepare(`
      SELECT p.id, p.title, p.description, p.media_type, p.preview_url, p.price, p.is_locked,
             p.category, p.views_count, p.likes_count, p.created_at,
             u.id as creator_id, u.display_name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar
      FROM saved_posts sp
      JOIN posts p ON sp.post_id = p.id
      JOIN users u ON p.creator_id = u.id
      WHERE sp.user_id = ? AND p.is_hidden = 0
      ORDER BY sp.id DESC
    `).all(userId);

    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load saved posts.' });
  }
});

module.exports = router;
