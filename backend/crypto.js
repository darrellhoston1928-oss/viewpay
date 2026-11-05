const crypto = require('crypto');

// 32-byte encryption key for AES-256-GCM
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET 
  ? crypto.createHash('sha256').update(process.env.ENCRYPTION_SECRET).digest()
  : crypto.createHash('sha256').update('viewpay-super-secret-secure-vault-key-2026').digest();

const MEDIA_SIGNING_SECRET = process.env.MEDIA_SECRET || 'viewpay-media-signature-secret-key-2026';

/**
 * Normalizes e-code: removes whitespace, dashes, uppercase
 */
function normalizeCode(code) {
  if (!code) return '';
  return code.toString().trim().replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Creates SHA-256 hash of normalized code for duplicate detection
 */
function hashCode(code) {
  const normalized = normalizeCode(code);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Encrypts an e-code using AES-256-GCM
 */
function encryptCode(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted e-code
 */
function decryptCode(encryptedPayload) {
  if (!encryptedPayload) return null;
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

/**
 * Masks an e-code for safe display: e.g. "••••-••••-8A2F"
 */
function maskCode(plainText) {
  if (!plainText) return '••••-••••';
  const clean = plainText.toString().trim().replace(/[-\s]/g, '');
  if (clean.length <= 4) return '••••-' + clean;
  const last4 = clean.slice(-4);
  return `••••-••••-${last4}`;
}

/**
 * Generates signed media token with expiration
 */
function generateSignedMediaToken(postId, userId, expiresInSeconds = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${postId}:${userId}:${expires}`;
  const signature = crypto.createHmac('sha256', MEDIA_SIGNING_SECRET).update(payload).digest('hex');
  return { token: signature, expires };
}

/**
 * Verifies signed media token
 */
function verifySignedMediaToken(postId, userId, token, expires) {
  const expNum = parseInt(expires, 10);
  if (isNaN(expNum) || Math.floor(Date.now() / 1000) > expNum) {
    return false;
  }
  const payload = `${postId}:${userId}:${expires}`;
  const expectedSig = crypto.createHmac('sha256', MEDIA_SIGNING_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedSig, 'hex'));
}

module.exports = {
  normalizeCode,
  hashCode,
  encryptCode,
  decryptCode,
  maskCode,
  generateSignedMediaToken,
  verifySignedMediaToken
};
