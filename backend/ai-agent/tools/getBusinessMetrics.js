const db = require('../../config/db');
const getSalesData = require('./getSalesData');
const getInventoryData = require('./getInventoryData');

/**
 * Tool: getBusinessMetrics
 * High-level overview of the business.
 */
const getBusinessMetrics = async () => {
    try {
        // We can reuse the sales and inventory tools for a comprehensive summary
        const thisMonthSales = await getSalesData({ period: 'this month' });
        const lastMonthSales = await getSalesData({ period: 'last month' });
        const inventoryData = await getInventoryData();

        // Calculate sales growth
        let sales_growth_percentage = 0;
        if (lastMonthSales.total_revenue > 0) {
            sales_growth_percentage = ((thisMonthSales.total_revenue - lastMonthSales.total_revenue) / lastMonthSales.total_revenue) * 100;
        } else if (thisMonthSales.total_revenue > 0) {
            sales_growth_percentage = 100; // From 0 to something
        }

        // Active customers this month
        const [activeCustomers] = await db.query(`
            SELECT COUNT(DISTINCT customer_id) as active_count
            FROM sales
            WHERE created_at BETWEEN ? AND ? AND payment_status = 'PAID' AND customer_id IS NOT NULL
        `, [thisMonthSales.start_date, thisMonthSales.end_date]);

        return {
            current_period: 'This Month',
            total_revenue: thisMonthSales.total_revenue,
            transaction_count: thisMonthSales.transactions,
            average_order_value: thisMonthSales.average_transaction,
            sales_growth_percentage: parseFloat(sales_growth_percentage.toFixed(2)),
            previous_month_revenue: lastMonthSales.total_revenue,
            top_products: thisMonthSales.top_products.slice(0, 5),
            low_stock_products_count: inventoryData.low_stock.length,
            out_of_stock_products_count: inventoryData.out_of_stock.length,
            active_customers_this_month: parseInt(activeCustomers[0].active_count)
        };

    } catch (error) {
        console.error('Error in getBusinessMetrics tool:', error);
        throw new Error('Failed to retrieve business metrics');
    }
};

module.exports = getBusinessMetrics;
