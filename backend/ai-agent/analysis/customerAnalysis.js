const getCustomerData = require('../tools/getCustomerData');
const getSalesData = require('../tools/getSalesData');

/**
 * Analyzes customer behaviors and trends.
 */
const analyzeCustomers = async () => {
    const customerData = await getCustomerData();
    
    // Check if purchases are increasing or decreasing this month vs last month
    const thisMonthSales = await getSalesData({ period: 'this month' });
    const lastMonthSales = await getSalesData({ period: 'last month' });

    let customer_activity_trend = 'stable';
    // Using transaction count as a proxy for customer activity trend
    if (thisMonthSales.transactions > lastMonthSales.transactions * 1.1) {
        customer_activity_trend = 'increasing';
    } else if (thisMonthSales.transactions < lastMonthSales.transactions * 0.9) {
        customer_activity_trend = 'decreasing';
    }

    return {
        summary: {
            total_customers: customerData.total_customers,
            average_frequency: customerData.average_purchase_frequency,
            average_spending: customerData.average_customer_spending
        },
        top_customers: customerData.top_customers,
        recent_activity: customerData.recent_purchases,
        trend: {
            activity_level: customer_activity_trend,
            transactions_this_month: thisMonthSales.transactions,
            transactions_last_month: lastMonthSales.transactions
        }
    };
};

module.exports = {
    analyzeCustomers
};
