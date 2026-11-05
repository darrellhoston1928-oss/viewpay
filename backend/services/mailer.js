const db = require('../db');

/**
 * Creates an in-app notification and dispatches a simulated transactional email
 */
function sendNotification({ userId, title, message, type = 'system', link = '' }) {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).run(userId, title, message, type, link, now);

    return result.lastInsertRowid;
  } catch (err) {
    console.error('Failed to create in-app notification:', err.message);
  }
}

/**
 * Records a transactional email log and returns its ID
 */
function sendEmail({ toEmail, subject, template, bodyPreview }) {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO email_logs (to_email, subject, template, body_preview, status, sent_at)
      VALUES (?, ?, ?, ?, 'sent', ?)
    `).run(toEmail, subject, template, bodyPreview, now);

    console.log(`✉️ [Outbound Email Dispatched] To: ${toEmail} | Subject: "${subject}" | Template: ${template}`);
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Failed to send email log:', err.message);
  }
}

module.exports = {
  sendNotification,
  sendEmail
};
