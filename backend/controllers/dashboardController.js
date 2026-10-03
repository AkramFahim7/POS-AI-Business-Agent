const db = require('../config/db');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res, next) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Today's Sales & Revenue
        const [[todayStats]] = await db.query(`
            SELECT COUNT(*) as sales_count, COALESCE(SUM(total), 0) as revenue 
            FROM sales 
            WHERE DATE(created_at) = ?
        `, [today]);

        // Total Products & Low Stock
        const [[productStats]] = await db.query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_count
            FROM products 
            WHERE status = 'ACTIVE'
        `);

        // Total Customers
        const [[customerStats]] = await db.query('SELECT COUNT(*) as total_customers FROM customers WHERE status = "ACTIVE"');

        res.json({
            success: true,
            data: {
                today_sales: todayStats.sales_count,
                today_revenue: todayStats.revenue,
                total_products: productStats.total_products,
                low_stock: productStats.low_stock_count || 0,
                total_customers: customerStats.total_customers
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sales trend (last 7 days by default)
// @route   GET /api/dashboard/sales-trend
// @access  Private
const getSalesTrend = async (req, res, next) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        const [trend] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as transactions
            FROM sales
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);

        res.json({ success: true, data: trend });
    } catch (error) {
        next(error);
    }
};

// @desc    Get top products
// @route   GET /api/dashboard/top-products
// @access  Private
const getTopProducts = async (req, res, next) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const [products] = await db.query(`
            SELECT p.name, SUM(si.quantity) as units_sold, SUM(si.subtotal) as revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            GROUP BY p.id
            ORDER BY units_sold DESC
            LIMIT ?
        `, [limit]);

        res.json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment summary
// @route   GET /api/dashboard/payment-summary
// @access  Private
const getPaymentSummary = async (req, res, next) => {
    try {
        const [summary] = await db.query(`
            SELECT payment_method, COUNT(*) as count, SUM(total) as total_amount
            FROM sales
            GROUP BY payment_method
        `);

        res.json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardSummary, getSalesTrend, getTopProducts, getPaymentSummary };
