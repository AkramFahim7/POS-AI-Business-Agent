const express = require('express');
const router = express.Router();
const { getDailySales, getMonthlySales, getProductSales, getCashierSales } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/daily-sales', getDailySales);
router.get('/monthly-sales', getMonthlySales);
router.get('/product-sales', getProductSales);
router.get('/cashier-sales', getCashierSales);

module.exports = router;
