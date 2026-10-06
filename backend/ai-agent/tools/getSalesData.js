const db = require('../../config/db');

/**
 * Parses period string into start and end dates for SQL querying.
 */
const getDateRange = (period, customStartDate, customEndDate) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'yesterday':
            startDate.setDate(now.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(now.getDate() - 1);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'this week':
            // Assuming week starts on Sunday
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last week':
            startDate.setDate(now.getDate() - now.getDay() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'this month':
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'last month':
            startDate.setMonth(now.getMonth() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setDate(0); // Last day of previous month
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'custom':
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            // default to all time if not specified or invalid, but cap it?
            // For safety, default to this month
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
    }

    // Format for MySQL
    return {
        start: startDate.toISOString().slice(0, 19).replace('T', ' '),
        end: endDate.toISOString().slice(0, 19).replace('T', ' ')
    };
};

/**
 * Tool: getSalesData
 * @param {Object} params 
 * @param {string} params.period - 'today', 'yesterday', 'this week', 'last week', 'this month', 'last month', 'custom'
 * @param {string} params.startDate - YYYY-MM-DD for custom
 * @param {string} params.endDate - YYYY-MM-DD for custom
 */
const getSalesData = async (params) => {
    try {
        const { period = 'this month', startDate, endDate } = params;
        const { start, end } = getDateRange(period, startDate, endDate);

        // Get aggregate metrics
        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(id) as transactions,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(AVG(total), 0) as average_transaction
            FROM sales 
            WHERE created_at BETWEEN ? AND ? AND payment_status = 'PAID'
        `, [start, end]);

        const metrics = metricsResult[0];

        // Get total items sold
        const [itemsResult] = await db.query(`
            SELECT COALESCE(SUM(si.quantity), 0) as items_sold
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE s.created_at BETWEEN ? AND ? AND s.payment_status = 'PAID'
        `, [start, end]);
        
        metrics.items_sold = itemsResult[0].items_sold;

        // Get sales by day
        const [salesByDay] = await db.query(`
            SELECT DATE(created_at) as date, SUM(total) as daily_revenue
            FROM sales
            WHERE created_at BETWEEN ? AND ? AND payment_status = 'PAID'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [start, end]);

        // Get sales by product
        const [salesByProduct] = await db.query(`
            SELECT p.name, SUM(si.quantity) as quantity_sold, SUM(si.subtotal) as product_revenue
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at BETWEEN ? AND ? AND s.payment_status = 'PAID'
            GROUP BY p.id
            ORDER BY product_revenue DESC
            LIMIT 10
        `, [start, end]);

        return {
            period,
            start_date: start,
            end_date: end,
            total_revenue: parseFloat(metrics.total_revenue),
            transactions: parseInt(metrics.transactions),
            average_transaction: parseFloat(metrics.average_transaction),
            items_sold: parseFloat(metrics.items_sold),
            sales_by_day: salesByDay,
            top_products: salesByProduct
        };

    } catch (error) {
        console.error('Error in getSalesData tool:', error);
        throw new Error('Failed to retrieve sales data');
    }
};

module.exports = getSalesData;
