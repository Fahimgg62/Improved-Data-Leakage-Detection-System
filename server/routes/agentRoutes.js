const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, requireAdmin, agentController.listAgents);
router.post('/', verifyToken, requireAdmin, agentController.createAgent);
router.patch('/:id/toggle-status', verifyToken, requireAdmin, agentController.toggleAgentStatus);

module.exports = router;

