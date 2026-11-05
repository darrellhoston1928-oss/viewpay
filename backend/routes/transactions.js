const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

/**
 * Get current user transaction history
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY id DESC LIMIT 100
    `).all(req.user.id);

    res.json({ transactions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transactions.' });
  }
});

module.exports = router;
