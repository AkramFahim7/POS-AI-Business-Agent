const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

// All AI routes should be protected and generally restricted to admin users
router.post('/chat', protect, adminOnly, aiController.processChatRequest);

module.exports = router;
