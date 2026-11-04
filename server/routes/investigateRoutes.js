const express = require('express');
const router = express.Router();
const investigateController = require('../controllers/investigateController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { handleUpload } = require('../middleware/upload');

router.post('/analyze', verifyToken, requireAdmin, handleUpload('file'), investigateController.analyzeLeak);
router.get('/history', verifyToken, requireAdmin, investigateController.getInvestigationHistory);

module.exports = router;

