const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

// Admin file upload & management
router.post('/upload', verifyToken, requireAdmin, handleUpload('file'), fileController.uploadFile);
router.get('/', verifyToken, requireAdmin, fileController.listFiles);
router.post('/distribute', verifyToken, requireAdmin, fileController.distributeFile);

// Agent file views & downloads
router.get('/agent-files', verifyToken, fileController.getAgentFiles);
router.get('/download/:allocationId', verifyToken, fileController.downloadFile);

module.exports = router;

