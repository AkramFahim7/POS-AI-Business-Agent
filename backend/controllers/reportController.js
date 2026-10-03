const db = require('../config/db');

// @desc    Daily Sales Report
// @route   GET /api/reports/daily-sales
// @access  Private/Admin
const getDailySales = async (req, res, next) => {
    try {
        const { start_date, end_date } = req.query;
        let query = `
            SELECT DATE(created_at) as date, COUNT(*) as transactions, 
                   SUM(subtotal) as subtotal, SUM(discount) as discount, 
                   SUM(tax) as tax, SUM(total) as revenue
            FROM sales
        `;
        let queryParams = [];

        if (start_date && end_date) {
            query += ' WHERE DATE(created_at) BETWEEN ? AND ?';
            queryParams.push(start_date, end_date);
        }

        query += ' GROUP BY DATE(created_at) ORDER BY date DESC';

        const [report] = await db.query(query, queryParams);
        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Monthly Sales Report
// @route   GET /api/reports/monthly-sales
// @access  Private/Admin
const getMonthlySales = async (req, res, next) => {
    try {
        const [report] = await db.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as transactions, 
                   SUM(total) as revenue
            FROM sales
            GROUP BY month
            ORDER BY month DESC
        `);
        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Product Sales Report
// @route   GET /api/reports/product-sales
// @access  Private/Admin
const getProductSales = async (req, res, next) => {
    try {
        const [report] = await db.query(`
            SELECT p.name, p.sku, c.name as category, SUM(si.quantity) as quantity_sold, SUM(si.subtotal) as revenue
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            GROUP BY p.id
            ORDER BY revenue DESC
        `);
        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

// @desc    Cashier Sales Report
// @route   GET /api/reports/cashier-sales
// @access  Private/Admin
const getCashierSales = async (req, res, next) => {
    try {
        const [report] = await db.query(`
            SELECT u.name as cashier, COUNT(s.id) as transactions, SUM(s.total) as revenue
            FROM sales s
            JOIN users u ON s.user_id = u.id
            GROUP BY u.id
            ORDER BY revenue DESC
        `);
        res.json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDailySales, getMonthlySales, getProductSales, getCashierSales };
