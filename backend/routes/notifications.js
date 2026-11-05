const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * Get user notifications
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY id DESC LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = 0
    `).get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

/**
 * Mark all as read
 */
router.post('/read-all', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

/**
 * Mark single as read
 */
router.post('/:id/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

/**
 * View Outbound Transactional Emails for this user
 */
router.get('/email-logs', requireAuth, (req, res) => {
  try {
    const emails = db.prepare(`
      SELECT * FROM email_logs 
      WHERE to_email = ? 
      ORDER BY id DESC LIMIT 20
    `).all(req.user.email);

    res.json({ emails });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load email logs.' });
  }
});

module.exports = router;
