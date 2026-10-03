const express = require('express');
const router = express.Router();
const { getInventory, getStockMovements, addStock, adjustStock } = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getInventory);
router.get('/movements', getStockMovements);

// Admin only for modifying stock directly outside of sales
router.post('/stock-in', adminOnly, addStock);
router.post('/adjust', adminOnly, adjustStock);

module.exports = router;
