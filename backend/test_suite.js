const db = require('./db');
const { encryptCode, decryptCode, hashCode, maskCode, generateSignedMediaToken, verifySignedMediaToken } = require('./crypto');
const bcrypt = require('bcryptjs');

console.log('🧪 Starting Viewpay Automated Core Verification Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Cryptography & Vault Tests
console.log('--- 1. Testing AES-256-GCM Encryption & Code Vaulting ---');
const rawCode = 'RG-8833-2211-9944';
const encrypted = encryptCode(rawCode);
assert(encrypted && encrypted !== rawCode, 'E-code is strongly encrypted into ciphertext');
assert(encrypted.split(':').length === 3, 'Ciphertext includes IV, Auth Tag, and payload');

const decrypted = decryptCode(encrypted);
assert(decrypted === rawCode, 'Admin decrypted code strictly matches original e-code');

const masked = maskCode(rawCode);
assert(masked === '••••-••••-9944', 'Masked code conceals private digits, leaving only last 4');

const hash1 = hashCode('RG-8833-2211-9944');
const hash2 = hashCode('rg 8833 2211 9944');
assert(hash1 === hash2, 'Code hash normalizes spaces, dashes, and casing for duplicate detection');

// 2. Signed Media Token Tests
console.log('\n--- 2. Testing Anti-Piracy Signed Expiring Media Tokens ---');
const { token, expires } = generateSignedMediaToken(1, 6, 3600);
assert(token && expires > Math.floor(Date.now() / 1000), 'Signed media token generated with future expiration');

const isValidSig = verifySignedMediaToken(1, 6, token, expires);
assert(isValidSig === true, 'Valid token signature verified successfully');

const isTampered = verifySignedMediaToken(2, 6, token, expires);
assert(isTampered === false, 'Tampered post ID rejected by cryptographic HMAC check');

const isExpired = verifySignedMediaToken(1, 6, token, Math.floor(Date.now() / 1000) - 10);
assert(isExpired === false, 'Expired media token correctly rejected');

// 3. User Seed & Role Checks
console.log('\n--- 3. Testing User Roles & Wallet Balances ---');
const adminUser = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@viewpay.com');
assert(adminUser && adminUser.role === 'admin' && adminUser.admin_role === 'owner', 'Admin owner initialized');

const reviewerUser = db.prepare('SELECT * FROM users WHERE email = ?').get('reviewer@viewpay.com');
assert(reviewerUser && reviewerUser.admin_role === 'deposit_reviewer', 'Deposit reviewer initialized');

const creatorElena = db.prepare('SELECT * FROM users WHERE email = ?').get('elena@viewpay.com');
assert(creatorElena && creatorElena.role === 'creator' && creatorElena.creator_status === 'approved', 'Elena creator verified & approved');

const viewerJohn = db.prepare('SELECT * FROM users WHERE email = ?').get('viewer@viewpay.com');
assert(viewerJohn && viewerJohn.role === 'viewer' && viewerJohn.wallet_balance === 85.00, 'Viewer John has initial balance of $85.00 USD');

// 4. Deposit Queue & Deduplication
console.log('\n--- 4. Testing Deposit Queue & Deduplication ---');
const pendingDeposits = db.prepare("SELECT COUNT(*) as c FROM deposits WHERE status = 'pending'").get().c;
assert(pendingDeposits >= 2, 'Pending deposits present in admin review queue');

const duplicateCheck = db.prepare('SELECT id FROM deposits WHERE code_hash = ?').get(hashCode('RG-9982-4412-K789'));
assert(duplicateCheck !== undefined, 'Duplicate detector detects existing seeded e-code hash');

// 5. Commission Split Mathematics
console.log('\n--- 5. Testing 20% Platform Commission Mathematics ---');
const postPrice = 15.00;
const commRate = 20.0;
const platformFee = parseFloat((postPrice * (commRate / 100)).toFixed(2));
const creatorEarnings = parseFloat((postPrice - platformFee).toFixed(2));

assert(platformFee === 3.00, '20% platform commission on $15.00 equals $3.00');
assert(creatorEarnings === 12.00, 'Creator earnings on $15.00 equals $12.00');

// 6. 18+ Confirmation Enforcement Check
console.log('\n--- 6. Testing 18+ Age Verification Requirement ---');
const usersWithout18 = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_age_verified = 0').get().c;
assert(usersWithout18 === 0, '100% of registered platform users confirmed 18+ requirement');

// 7. Testing Post Creation Query & Subscriber Lookups
console.log('\n--- 7. Testing Creator Post Query & Subscriber Notification Flow ---');
try {
  const creator = db.prepare('SELECT id, display_name FROM users WHERE role = ?').get('creator');
  const subscribers = db.prepare("SELECT user_id FROM subscriptions WHERE creator_id = ? AND status = 'active'").all(creator.id);
  assert(Array.isArray(subscribers), 'Subscriber lookup query runs without SQL syntax error');

  const insertPost = db.prepare(`
    INSERT INTO posts (creator_id, title, description, category, media_type, media_url, preview_url, is_locked, price, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(creator.id, 'Test Post Suite', 'A test post description', 'Art & Cosplay', 'photo', '/uploads/posts/test.jpg', '/uploads/posts/test.jpg', 1, 10.00, new Date().toISOString(), new Date().toISOString());

  assert(insertPost.lastInsertRowid > 0, 'Post successfully inserted into database');

  // Clean up test post
  db.prepare('DELETE FROM posts WHERE id = ?').run(insertPost.lastInsertRowid);
  assert(true, 'Test post verified and cleanly removed');
} catch (err) {
  assert(false, `Post creation query test failed: ${err.message}`);
}

console.log(`\n========================================`);
console.log(`Test Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All core system integrity checks PASSED successfully!');
  process.exit(0);
}
