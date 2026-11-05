const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Subdirectories
const RECEIPTS_DIR = path.join(UPLOADS_DIR, 'receipts');
const CREATOR_DOCS_DIR = path.join(UPLOADS_DIR, 'docs');
const POSTS_DIR = path.join(UPLOADS_DIR, 'posts');

[RECEIPTS_DIR, CREATOR_DOCS_DIR, POSTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'receipt') {
      cb(null, RECEIPTS_DIR);
    } else if (file.fieldname === 'creator_id_doc') {
      cb(null, CREATOR_DOCS_DIR);
    } else {
      cb(null, POSTS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${ext}. Allowed: JPG, PNG, WebP, MP4, MOV, PDF`));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max for videos
  },
  fileFilter
});

module.exports = {
  upload,
  UPLOADS_DIR
};
