const multer = require('multer');
const path = require('path');
const config = require('../config');

// Storage configuration for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'vault-' + uniqueSuffix + ext);
  }
});

// File filter enforcing allowed extensions [FR-1 / TC-DLD-EP-01]
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error('Invalid file format. Only .txt, .jpg, and .bmp files are supported for steganographic tracking.');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_FORMAT';
    return cb(error, false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE_BYTES // 50 MB
  }
});

// Wrapper to intercept and format Multer errors nicely
function handleUpload(field = 'file') {
  const multerSingle = upload.single(field);

  return (req, res, next) => {
    multerSingle(req, res, err => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: 'Upload failed: File size exceeds the maximum limit of 50 MB.',
            statusCode: 413,
            maxSize: config.MAX_FILE_SIZE_BYTES
          });
        }
        if (err.code === 'INVALID_FILE_FORMAT' || err.statusCode === 400) {
          return res.status(400).json({
            error: err.message,
            statusCode: 400
          });
        }
        return res.status(400).json({ error: err.message });
      }

      // Check for empty file (0 Bytes) [FR-1 / BVA-01]
      if (req.file && req.file.size === 0) {
        return res.status(400).json({
          error: 'Upload failed: Empty file (0 Bytes) is not permitted.',
          statusCode: 400
        });
      }

      next();
    });
  };
}

module.exports = {
  handleUpload
};

