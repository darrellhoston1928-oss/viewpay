const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { generateSignedMediaToken, verifySignedMediaToken } = require('../crypto');
const { sendNotification, sendEmail } = require('../services/mailer');

/**
 * Get single post details & check unlock status
 */
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.prepare(`
      SELECT p.*, 
             u.display_name as creator_name, u.username as creator_username, u.avatar_url as creator_avatar,
             u.subscription_price, u.allow_subscriptions
      FROM posts p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ? AND p.is_hidden = 0
    `).get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found or has been removed.' });
    }

    // Increment view count
    db.prepare('UPDATE posts SET views_count = views_count + 1 WHERE id = ?').run(postId);

    const currentUserId = req.user ? req.user.id : null;
    let isUnlocked = !post.is_locked || (currentUserId && (currentUserId === post.creator_id || req.user.role === 'admin'));
    let isSubscribed = false;
    let isSaved = false;

    if (currentUserId && !isUnlocked) {
      // Check active subscription to this creator
      const sub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(currentUserId, post.creator_id);
      if (sub) {
        isUnlocked = true;
        isSubscribed = true;
      } else {
        // Check pay-per-post purchase
        const purchase = db.prepare('SELECT id FROM purchases WHERE user_id = ? AND post_id = ?').get(currentUserId, postId);
        if (purchase) isUnlocked = true;
      }
    }

    if (currentUserId) {
      const saved = db.prepare('SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?').get(currentUserId, postId);
      isSaved = !!saved;
    }

    res.json({
      post: {
        id: post.id,
        title: post.title,
        description: post.description,
        media_type: post.media_type,
        // Only provide raw media_url if unlocked, else only preview_url
        media_url: isUnlocked ? post.media_url : null,
        preview_url: post.preview_url,
        price: post.price,
        is_locked: post.is_locked,
        category: post.category,
        views_count: post.views_count + 1,
        likes_count: post.likes_count,
        created_at: post.created_at,
        creator_id: post.creator_id,
        creator: {
          id: post.creator_id,
          name: post.creator_name,
          username: post.creator_username,
          avatar: post.creator_avatar,
          subscriptionPrice: post.subscription_price,
          allowSubscriptions: post.allow_subscriptions
        },
        isUnlocked,
        isSubscribed,
        isSaved
      }
    });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Failed to retrieve post details.' });
  }
});

/**
 * Create a new post (Creator only)
 */
router.post('/', requireAuth, upload.single('media'), (req, res) => {
  try {
    const user = req.user;

    // Check if creator is verified
    if (user.role !== 'creator' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only verified content creators can upload posts.' });
    }

    if (user.role === 'creator' && user.creator_status !== 'approved') {
      return res.status(403).json({
        error: 'Your creator account is awaiting identity verification. You will be able to publish once approved.'
      });
    }

    const { title, description, price, isLocked, category } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Please enter a title for your post.' });
    }

    let mediaUrl = '';
    let previewUrl = '';
    let mediaType = 'photo';

    if (req.file) {
      mediaUrl = `/uploads/posts/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      mediaType = ['.mp4', '.mov'].includes(ext) ? 'video' : 'photo';
      previewUrl = mediaUrl; // Preview or thumbnail
    } else if (req.body.mediaUrl) {
      mediaUrl = req.body.mediaUrl;
      previewUrl = req.body.previewUrl || mediaUrl;
      mediaType = req.body.mediaType || 'photo';
    } else {
      return res.status(400).json({ error: 'Please upload a photo or video.' });
    }

    const priceNum = parseFloat(price) || 0.00;
    const lockedVal = (isLocked === true || isLocked === 'true' || priceNum > 0) ? 1 : 0;
    const now = new Date().toISOString();

    const insertResult = db.prepare(`
      INSERT INTO posts (
        creator_id, title, description, media_type, media_url, preview_url,
        price, is_locked, category, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user.id, title.trim(), description ? description.trim() : '',
      mediaType, mediaUrl, previewUrl, priceNum, lockedVal,
      category || 'Lifestyle', now, now
    );

    const postId = insertResult.lastInsertRowid;

    // Notify all active subscribers about the new post
    const subscribers = db.prepare('SELECT user_id FROM subscriptions WHERE creator_id = ? AND status = "active"').all(user.id);
    subscribers.forEach(sub => {
      sendNotification({
        userId: sub.user_id,
        title: `New Post from ${user.display_name}! 📸`,
        message: `${user.display_name} just published: "${title.trim()}"`,
        type: 'new_post',
        link: `/post/${postId}`
      });
    });

    res.status(201).json({
      message: 'Post created successfully!',
      postId
    });
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

/**
 * Edit post
 */
router.put('/:id', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.prepare('SELECT creator_id FROM posts WHERE id = ?').get(postId);

    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to edit this post.' });
    }

    const { title, description, price, isLocked, category } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE posts SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        is_locked = COALESCE(?, is_locked),
        category = COALESCE(?, category),
        updated_at = ?
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      description !== undefined ? description.trim() : null,
      price !== undefined ? parseFloat(price) : null,
      isLocked !== undefined ? (isLocked ? 1 : 0) : null,
      category || null,
      now,
      postId
    );

    res.json({ message: 'Post updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post.' });
  }
});

/**
 * Delete post
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const post = db.prepare('SELECT creator_id FROM posts WHERE id = ?').get(postId);

    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (post.creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this post.' });
    }

    db.prepare('DELETE FROM posts WHERE id = ?').run(postId);
    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

/**
 * Unlock Post (Pay-per-post from Wallet)
 */
router.post('/:id/unlock', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = db.prepare(`
      SELECT p.*, u.display_name as creator_name, u.email as creator_email, u.wallet_balance as creator_balance
      FROM posts p
      JOIN users u ON p.creator_id = u.id
      WHERE p.id = ? AND p.is_hidden = 0
    `).get(postId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (!post.is_locked || post.price <= 0) {
      return res.json({ message: 'This post is already free and accessible.', isUnlocked: true });
    }

    if (post.creator_id === userId) {
      return res.json({ message: 'You own this post.', isUnlocked: true });
    }

    // Check if already purchased
    const existing = db.prepare('SELECT id FROM purchases WHERE user_id = ? AND post_id = ?').get(userId, postId);
    if (existing) {
      return res.json({ message: 'You have already unlocked this post.', isUnlocked: true });
    }

    // Check wallet balance
    const viewer = db.prepare('SELECT wallet_balance, email, display_name FROM users WHERE id = ?').get(userId);
    const postPrice = post.price;

    if (viewer.wallet_balance < postPrice) {
      return res.status(402).json({
        error: 'Insufficient wallet balance.',
        insufficientBalance: true,
        requiredAmount: postPrice,
        currentBalance: viewer.wallet_balance,
        deficit: (postPrice - viewer.wallet_balance).toFixed(2)
      });
    }

    // Platform commission cut (default 20%)
    const settings = db.prepare('SELECT platform_commission_percent FROM platform_settings WHERE id = 1').get();
    const commRate = settings ? settings.platform_commission_percent : 20.0;
    const platformFee = parseFloat((postPrice * (commRate / 100)).toFixed(2));
    const creatorNet = parseFloat((postPrice - platformFee).toFixed(2));

    const now = new Date().toISOString();
    const newViewerBalance = viewer.wallet_balance - postPrice;
    const newCreatorBalance = post.creator_balance + creatorNet;

    // Deduct viewer wallet, credit creator wallet
    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newViewerBalance, now, userId);
    db.prepare('UPDATE users SET wallet_balance = ?, updated_at = ? WHERE id = ?').run(newCreatorBalance, now, post.creator_id);

    // Record purchase
    db.prepare(`
      INSERT INTO purchases (user_id, post_id, amount, platform_fee, creator_earnings, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, postId, postPrice, platformFee, creatorNet, now);

    // Ledger transactions
    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'post_purchase', ?, ?, ?, ?, ?)
    `).run(
      userId,
      -postPrice,
      newViewerBalance,
      `Unlocked Post: "${post.title}"`,
      `POST-${postId}`,
      now
    );

    db.prepare(`
      INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
      VALUES (?, 'creator_earning', ?, ?, ?, ?, ?)
    `).run(
      post.creator_id,
      creatorNet,
      newCreatorBalance,
      `Content Sale: "${post.title}" unlocked by ${viewer.display_name} (Gross: $${postPrice.toFixed(2)}, Net: $${creatorNet.toFixed(2)})`,
      `POST-${postId}`,
      now
    );

    // Notifications
    sendNotification({
      userId,
      title: 'Content Unlocked! 🔓',
      message: `You successfully unlocked "${post.title}". It is now permanently available in your library.`,
      type: 'purchase_success',
      link: `/post/${postId}`
    });

    sendNotification({
      userId: post.creator_id,
      title: 'New Post Sale! 💸',
      message: `${viewer.display_name} purchased your post "${post.title}". $${creatorNet.toFixed(2)} USD added to your balance.`,
      type: 'creator_earning',
      link: `/post/${postId}`
    });

    sendEmail({
      toEmail: viewer.email,
      subject: `Order Confirmation: Unlocked "${post.title}"`,
      template: 'post_unlocked',
      bodyPreview: `Thank you for your purchase! You unlocked "${post.title}" for $${postPrice.toFixed(2)} USD. Access it anytime in your Viewpay Library.`
    });

    res.json({
      message: 'Post successfully unlocked!',
      isUnlocked: true,
      newBalance: newViewerBalance,
      mediaUrl: post.media_url
    });
  } catch (err) {
    console.error('Post unlock error:', err);
    res.status(500).json({ error: 'Failed to process post unlock.' });
  }
});

/**
 * Generate Signed Expiring Media URL for secure streaming
 */
router.get('/:id/signed-url', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = db.prepare('SELECT id, creator_id, is_locked FROM posts WHERE id = ?').get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found.' });

    let allowed = !post.is_locked || post.creator_id === userId || req.user.role === 'admin';

    if (!allowed) {
      // Check subscription
      const sub = db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND creator_id = ? AND status = "active"').get(userId, post.creator_id);
      if (sub) allowed = true;
    }

    if (!allowed) {
      // Check purchase
      const purchase = db.prepare('SELECT id FROM purchases WHERE user_id = ? AND post_id = ?').get(userId, postId);
      if (purchase) allowed = true;
    }

    if (!allowed) {
      return res.status(403).json({ error: 'You have not unlocked this media item.' });
    }

    // 2 hours expiring signed token
    const { token, expires } = generateSignedMediaToken(postId, userId, 7200);
    const streamUrl = `/api/posts/stream/${postId}?token=${token}&expires=${expires}&uid=${userId}`;

    res.json({ streamUrl, expires });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate signed streaming URL.' });
  }
});

/**
 * Stream protected media with signed token verification
 */
router.get('/stream/:id', (req, res) => {
  try {
    const postId = req.params.id;
    const { token, expires, uid } = req.query;

    if (!token || !expires || !uid) {
      return res.status(401).send('Access denied: missing media signature.');
    }

    const isValid = verifySignedMediaToken(postId, uid, token, expires);
    if (!isValid) {
      return res.status(403).send('Access denied: signature is invalid or expired.');
    }

    const post = db.prepare('SELECT media_url, media_type FROM posts WHERE id = ?').get(postId);
    if (!post) return res.status(404).send('Media not found.');

    // If external URL (Unsplash or Google sample video), redirect or pipe
    if (post.media_url.startsWith('http://') || post.media_url.startsWith('https://')) {
      return res.redirect(post.media_url);
    }

    // Local file path
    const localPath = path.join(__dirname, '..', post.media_url.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) {
      return res.status(404).send('File not found on storage server.');
    }

    const stat = fs.statSync(localPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range && post.media_type === 'video') {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(localPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': post.media_type === 'video' ? 'video/mp4' : 'image/jpeg',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
      };
      res.writeHead(200, head);
      fs.createReadStream(localPath).pipe(res);
    }
  } catch (err) {
    console.error('Media streaming error:', err);
    res.status(500).send('Streaming error.');
  }
});

/**
 * Save / Bookmark post
 */
router.post('/:id/save', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const existing = db.prepare('SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?').get(userId, postId);

    if (existing) {
      db.prepare('DELETE FROM saved_posts WHERE id = ?').run(existing.id);
      return res.json({ saved: false, message: 'Removed from bookmarks.' });
    } else {
      const now = new Date().toISOString();
      db.prepare('INSERT INTO saved_posts (user_id, post_id, created_at) VALUES (?, ?, ?)').run(userId, postId, now);
      return res.json({ saved: true, message: 'Saved to bookmarks.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to bookmark post.' });
  }
});

/**
 * Report Post (Content moderation & DMCA compliance)
 */
router.post('/:id/report', requireAuth, (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Please select a reason for reporting this content.' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reports (reporter_id, post_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(userId, postId, reason, details || '', now);

    sendNotification({
      userId,
      title: 'Report Received 🛡️',
      message: 'Thank you for keeping Viewpay safe. Our trust and safety team will review the flagged content promptly.',
      type: 'system'
    });

    res.json({ message: 'Content report submitted for review.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

module.exports = router;
