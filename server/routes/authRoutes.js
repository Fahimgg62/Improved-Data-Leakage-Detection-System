const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/mfa-verify', authController.verifyMfa);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;

