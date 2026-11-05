const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { encryptCode, hashCode, maskCode } = require('./crypto');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'viewpay.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'viewer',
      admin_role TEXT DEFAULT NULL,
      display_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      bio TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      cover_url TEXT DEFAULT '',
      category TEXT DEFAULT 'Lifestyle',
      is_age_verified INTEGER DEFAULT 1,
      is_email_verified INTEGER DEFAULT 1,
      email_verification_token TEXT DEFAULT NULL,
      password_reset_token TEXT DEFAULT NULL,
      password_reset_expires INTEGER DEFAULT NULL,
      is_banned INTEGER DEFAULT 0,
      ban_reason TEXT DEFAULT '',
      deposit_lock_until INTEGER DEFAULT 0,
      wallet_balance REAL DEFAULT 0.00,
      creator_status TEXT DEFAULT 'none',
      creator_id_doc_url TEXT DEFAULT '',
      creator_rejection_reason TEXT DEFAULT '',
      subscription_price REAL DEFAULT 9.99,
      allow_subscriptions INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_type TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      encrypted_code TEXT NOT NULL,
      masked_code TEXT NOT NULL,
      claimed_amount REAL NOT NULL,
      verified_amount REAL DEFAULT NULL,
      receipt_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      rejection_reason TEXT DEFAULT '',
      is_flagged_high_value INTEGER DEFAULT 0,
      is_flagged_first_time INTEGER DEFAULT 0,
      verified_by_admin_id INTEGER DEFAULT NULL,
      verified_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      media_type TEXT NOT NULL DEFAULT 'photo',
      media_url TEXT NOT NULL,
      preview_url TEXT NOT NULL,
      price REAL DEFAULT 0.00,
      is_locked INTEGER DEFAULT 1,
      category TEXT DEFAULT 'Lifestyle',
      views_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      platform_fee REAL NOT NULL,
      creator_earnings REAL NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      creator_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at TEXT NOT NULL,
      renew_at TEXT NOT NULL,
      cancelled_at TEXT DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS saved_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL NOT NULL,
      description TEXT NOT NULL,
      reference_id TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payout_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payout_method TEXT NOT NULL,
      payout_details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      admin_notes TEXT DEFAULT '',
      processed_by_admin_id INTEGER DEFAULT NULL,
      processed_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      link TEXT DEFAULT '',
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      template TEXT NOT NULL,
      body_preview TEXT NOT NULL,
      status TEXT DEFAULT 'sent',
      sent_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',
      reviewed_by_admin_id INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (post_id) REFERENCES posts(id)
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      platform_commission_percent REAL DEFAULT 20.0,
      min_payout_amount REAL DEFAULT 50.0,
      high_value_deposit_threshold REAL DEFAULT 100.0,
      max_deposits_per_hour INTEGER DEFAULT 5,
      maintenance_mode INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL
    );
  `);

  // Ensure default platform settings exist
  const existingSettings = db.prepare('SELECT id FROM platform_settings WHERE id = 1').get();
  if (!existingSettings) {
    db.prepare(`
      INSERT INTO platform_settings (id, platform_commission_percent, min_payout_amount, high_value_deposit_threshold, max_deposits_per_hour, maintenance_mode, updated_at)
      VALUES (1, 20.0, 50.0, 100.0, 5, 0, ?)
    `).run(new Date().toISOString());
  }

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return; // already seeded

  console.log('🌱 Seeding initial demo users and data...');
  const now = new Date().toISOString();
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  // 1. Owner Admin
  db.prepare(`
    INSERT INTO users (email, password_hash, role, admin_role, display_name, username, bio, avatar_url, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'admin', 'owner', 'Alexander Pierce', 'owner_alex', 'Founder & Chief Executive Officer of Viewpay.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80', 5000.00, ?, ?)
  `).run('admin@viewpay.com', defaultPasswordHash, now, now);

  // 2. Deposit Reviewer Admin
  db.prepare(`
    INSERT INTO users (email, password_hash, role, admin_role, display_name, username, bio, avatar_url, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'admin', 'deposit_reviewer', 'Sarah Lin', 'reviewer_sarah', 'Risk & Compliance Lead, Deposit Verification Specialist.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80', 0.00, ?, ?)
  `).run('reviewer@viewpay.com', defaultPasswordHash, now, now);

  // 3. Featured Creator: Elena Thorne (Cosplay & Fantasy Art)
  const creatorElena = db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, cover_url, category, creator_status, subscription_price, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'creator', 'Elena Thorne', 'elenacreates', 'Digital artist & cinematic cosplay designer. Bringing mythical worlds and high-fantasy characters to life.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', 'Art & Cosplay', 'approved', 14.99, 1240.00, ?, ?)
  `).run('elena@viewpay.com', defaultPasswordHash, now, now);
  const elenaId = creatorElena.lastInsertRowid;

  // 4. Featured Creator: Marcus Vance (Fitness & High Performance)
  const creatorMarcus = db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, cover_url, category, creator_status, subscription_price, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'creator', 'Marcus Vance', 'marcus_vance', 'Elite athletic conditioning, high-intensity workouts, and raw nutrition breakdown.', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80', 'Fitness', 'approved', 19.99, 880.00, ?, ?)
  `).run('marcus@viewpay.com', defaultPasswordHash, now, now);
  const marcusId = creatorMarcus.lastInsertRowid;

  // 5. Featured Creator: Chloe Rivera (Fashion & Visual Aesthetics)
  const creatorChloe = db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, cover_url, category, creator_status, subscription_price, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'creator', 'Chloe Rivera', 'chloerivera', 'Fashion editorial photography, backstage runway coverage, and cinematic lookbooks.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80', 'Fashion', 'approved', 9.99, 450.00, ?, ?)
  `).run('chloe@viewpay.com', defaultPasswordHash, now, now);
  const chloeId = creatorChloe.lastInsertRowid;

  // 6. Viewer with Balance
  const viewerJohn = db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'viewer', 'John Davis', 'johnd', 'Art collector and photography enthusiast.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80', 85.00, ?, ?)
  `).run('viewer@viewpay.com', defaultPasswordHash, now, now);
  const johnId = viewerJohn.lastInsertRowid;

  // 7. New Viewer with $0 balance
  db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, wallet_balance, created_at, updated_at)
    VALUES (?, ?, 'viewer', 'Maya Sterling', 'mayas', 'New member exploring exclusive content.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80', 0.00, ?, ?)
  `).run('newbie@viewpay.com', defaultPasswordHash, now, now);

  // 8. Pending Creator Applicant
  db.prepare(`
    INSERT INTO users (email, password_hash, role, display_name, username, bio, avatar_url, category, creator_status, creator_id_doc_url, created_at, updated_at)
    VALUES (?, ?, 'creator', 'David Kim', 'davidkim_lens', 'Architectural photographer looking to monetize fine art urban sets.', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80', 'Photography', 'pending', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', ?, ?)
  `).run('david@viewpay.com', defaultPasswordHash, now, now);

  // Seed sample posts for creators
  // Elena's Posts
  const p1 = db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Valkyrie of the Frozen Peak - High-Res 4K Set', 'Full 4K set including 18 costume variations, illuminated Nordic armor, and studio retouch passes.', 'photo', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1400&q=90', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=50', 12.00, 1, 'Art & Cosplay', 342, 128, ?, ?)
  `).run(elenaId, now, now);

  db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Cyber Samurai Concept Teaser (Public)', 'Quick work-in-progress lighting test for upcoming cyberpunk armor series. Enjoy the free teaser!', 'photo', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80', 0.00, 0, 'Art & Cosplay', 812, 340, ?, ?)
  `).run(elenaId, now, now);

  db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Behind the Armor: 60-Minute Fabrication Masterclass', 'Step-by-step masterclass video demonstrating thermoplastic molding, airbrush shading, and LED circuit embedding.', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=60', 18.00, 1, 'Art & Cosplay', 195, 87, ?, ?)
  `).run(elenaId, now, now);

  // Marcus's Posts
  db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Explosive Plyometrics & Calisthenics Routine', 'Full video routine engineered to maximize vertical leap and tendon resilience. Complete with rep/set guidelines.', 'video', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=60', 10.00, 1, 'Fitness', 420, 160, ?, ?)
  `).run(marcusId, now, now);

  db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Micro-Nutrient Blueprint for Peak Recovery', 'Comprehensive PDF & photo guide covering electrolyte balance, circadian hormone optimization, and recovery stacks.', 'photo', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=40', 8.00, 1, 'Fitness', 280, 94, ?, ?)
  `).run(marcusId, now, now);

  // Chloe's Posts
  db.prepare(`
    INSERT INTO posts (creator_id, title, description, media_type, media_url, preview_url, price, is_locked, category, views_count, likes_count, created_at, updated_at)
    VALUES (?, 'Nocturne Noir: Milan After Hours Lookbook', 'Moody monochrome editorial shot in the heart of Milan fashion week. Exclusive unseen selects.', 'photo', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=90', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=40', 15.00, 1, 'Fashion', 530, 210, ?, ?)
  `).run(chloeId, now, now);

  // Seed existing unlocked purchase for John (Viewer)
  const elenaPostId = p1.lastInsertRowid;
  db.prepare(`
    INSERT INTO purchases (user_id, post_id, amount, platform_fee, creator_earnings, created_at)
    VALUES (?, ?, 12.00, 2.40, 9.60, ?)
  `).run(johnId, elenaPostId, now);

  // Seed sample transactions for John
  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, balance_after, description, created_at)
    VALUES (?, 'deposit', 100.00, 100.00, 'Approved Razer Gold Deposit (Verified)', ?)
  `).run(johnId, now);

  db.prepare(`
    INSERT INTO transactions (user_id, type, amount, balance_after, description, reference_id, created_at)
    VALUES (?, 'post_purchase', -12.00, 88.00, 'Unlocked "Valkyrie of the Frozen Peak"', ?, ?)
  `).run(johnId, String(elenaPostId), now);

  // Seed pending deposits to test the Admin Deposit Review Queue right away!
  // Pending Deposit 1: Razer Gold $50.00 from John Davis
  const code1 = 'RG-9982-4412-K789';
  db.prepare(`
    INSERT INTO deposits (user_id, card_type, code_hash, encrypted_code, masked_code, claimed_amount, receipt_url, status, is_flagged_high_value, is_flagged_first_time, created_at)
    VALUES (?, 'razer_gold', ?, ?, ?, 50.00, 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80', 'pending', 0, 0, ?)
  `).run(johnId, hashCode(code1), encryptCode(code1), maskCode(code1), now);

  // Pending Deposit 2: Apple Gift Card $150.00 (Flagged High Value!) from Maya Sterling (First-Time User!)
  const code2 = 'APPL-8821-X992-0044';
  const newbieUser = db.prepare('SELECT id FROM users WHERE email = ?').get('newbie@viewpay.com');
  db.prepare(`
    INSERT INTO deposits (user_id, card_type, code_hash, encrypted_code, masked_code, claimed_amount, receipt_url, status, is_flagged_high_value, is_flagged_first_time, created_at)
    VALUES (?, 'apple', ?, ?, ?, 150.00, 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=800&q=80', 'pending', 1, 1, ?)
  `).run(newbieUser.id, hashCode(code2), encryptCode(code2), maskCode(code2), now);

  // Already Approved historical deposit
  const code3 = 'RG-1122-3344-5566';
  db.prepare(`
    INSERT INTO deposits (user_id, card_type, code_hash, encrypted_code, masked_code, claimed_amount, verified_amount, receipt_url, status, verified_by_admin_id, verified_at, created_at)
    VALUES (?, 'razer_gold', ?, ?, ?, 100.00, 100.00, 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80', 'approved', 1, ?, ?)
  `).run(johnId, hashCode(code3), encryptCode(code3), maskCode(code3), now, now);

  // Payout request pending from Elena
  db.prepare(`
    INSERT INTO payout_requests (creator_id, amount, payout_method, payout_details, status, created_at)
    VALUES (?, 450.00, 'paypal', 'elena.thorne.business@gmail.com', 'pending', ?)
  `).run(elenaId, now);

  // Sample report for content moderation
  db.prepare(`
    INSERT INTO reports (reporter_id, post_id, reason, details, status, created_at)
    VALUES (?, ?, 'inappropriate', 'Requesting age rating tag clarification on costume set.', 'pending', ?)
  `).run(johnId, elenaPostId, now);

  // Notifications for John
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, created_at)
    VALUES (?, 'Deposit Approved', 'Your Razer Gold deposit of $100.00 USD was successfully verified and credited to your wallet.', 'deposit_approved', ?)
  `).run(johnId, now);

  // Email log
  db.prepare(`
    INSERT INTO email_logs (to_email, subject, template, body_preview, sent_at)
    VALUES (?, 'Your Viewpay Wallet Deposit has been Approved ($100.00 USD)', 'deposit_approved', 'Great news! Your Razer Gold e-code deposit has been verified by our team and $100.00 USD has been added to your wallet.', ?)
  `).run('viewer@viewpay.com', now);

  console.log('✅ Database seeded successfully with demo accounts and data.');
}

// Initialize on require
initSchema();

module.exports = db;
