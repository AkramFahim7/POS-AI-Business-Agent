const express = require('express');
const router = express.Router();
const { getDashboardSummary, getSalesTrend, getTopProducts, getPaymentSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/payment-summary', getPaymentSummary);

module.exports = router;
