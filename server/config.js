const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'leaktrace-forensic-secret-key-2026',
  JWT_EXPIRES_IN: '24h',
  
  // File Upload Constraints [FR-1 / NFR-3]
  ALLOWED_EXTENSIONS: ['.txt', '.jpg', '.jpeg', '.bmp'],
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB = 52,428,800 Bytes
  MIN_FILE_SIZE_BYTES: 1, // Empty files (0 Bytes) rejected
  
  // Target Agent Allocation Constraints [FR-2 / NFR-1]
  MIN_AGENTS_PER_BATCH: 1,
  MAX_AGENTS_PER_BATCH: 20,
  MIN_EXPIRY_DAYS: 1,
  MAX_EXPIRY_DAYS: 30,
  
  // Steganographic Engine Constraints [FR-3 / NFR-8]
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  MIN_IMAGE_WIDTH: 256,
  MIN_IMAGE_HEIGHT: 256,
  MIN_TEXT_WORDS: 50,
  
  // Forensic Analysis Constraints [FR-5]
  MAX_BER_TOLERANCE: 0.05, // 5.0% Bit Error Rate threshold
  MATCH_CONFIDENCE_THRESHOLD: 0.80, // 80.0% attribution threshold
  
  // Notification Service Constraints [NFR-3]
  EMAIL_BATCH_LIMIT: 10,
  
  // Storage Paths
  UPLOAD_DIR: path.join(__dirname, '..', 'uploads'),
  WATERMARKED_DIR: path.join(__dirname, '..', 'watermarked'),
  DATA_DIR: path.join(__dirname, '..', 'data')
};

