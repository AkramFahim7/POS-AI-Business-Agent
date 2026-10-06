const db = require('../../config/db');

/**
 * Tool: getCustomerData
 * Retrieves customer insights.
 */
const getCustomerData = async () => {
    try {
        // Customer count
        const [countResult] = await db.query(`SELECT COUNT(id) as total_customers FROM customers WHERE status = 'ACTIVE'`);
        const total_customers = parseInt(countResult[0].total_customers);

        // Top customers by total spending
        const [topCustomers] = await db.query(`
            SELECT 
                c.id, c.name, c.phone,
                COUNT(s.id) as purchase_frequency,
                COALESCE(SUM(s.total), 0) as total_spending
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE s.payment_status = 'PAID'
            GROUP BY c.id
            ORDER BY total_spending DESC
            LIMIT 10
        `);

        // Recent purchases by known customers
        const [recentPurchases] = await db.query(`
            SELECT 
                c.name as customer_name,
                s.invoice_number,
                s.total,
                s.created_at as purchase_date
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            WHERE s.payment_status = 'PAID'
            ORDER BY s.created_at DESC
            LIMIT 10
        `);
        
        // Calculate average purchase frequency and spending per customer
        const [avgResult] = await db.query(`
            SELECT 
                COUNT(s.id) / COUNT(DISTINCT c.id) as avg_frequency,
                SUM(s.total) / COUNT(DISTINCT c.id) as avg_spending
            FROM customers c
            JOIN sales s ON c.id = s.customer_id
            WHERE s.payment_status = 'PAID'
        `);
        
        const averages = avgResult[0];

        return {
            total_customers,
            average_purchase_frequency: parseFloat(averages.avg_frequency || 0).toFixed(2),
            average_customer_spending: parseFloat(averages.avg_spending || 0).toFixed(2),
            top_customers: topCustomers.map(c => ({
                ...c,
                total_spending: parseFloat(c.total_spending)
            })),
            recent_purchases: recentPurchases.map(r => ({
                ...r,
                total: parseFloat(r.total)
            }))
        };

    } catch (error) {
        console.error('Error in getCustomerData tool:', error);
        throw new Error('Failed to retrieve customer data');
    }
};

module.exports = getCustomerData;
