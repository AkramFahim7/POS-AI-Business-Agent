const getSalesData = require('../tools/getSalesData');

/**
 * Calculates percentage change between two values.
 * Handles zero division gracefully.
 */
const calculatePercentageChange = (current, previous) => {
    if (previous === 0 && current === 0) return 0;
    if (previous === 0) return 100; // From 0 to something is a 100% increase theoretically
    return ((current - previous) / previous) * 100;
};

/**
 * Compares two sales periods and returns analysis.
 */
const compareSalesPeriods = async (currentPeriod, previousPeriod) => {
    const currentSales = await getSalesData({ period: currentPeriod });
    const previousSales = await getSalesData({ period: previousPeriod });

    const revenueChange = calculatePercentageChange(currentSales.total_revenue, previousSales.total_revenue);
    const transactionChange = calculatePercentageChange(currentSales.transactions, previousSales.transactions);
    
    // Analyze product performance changes
    const currentProducts = new Map(currentSales.top_products.map(p => [p.name, p]));
    const previousProducts = new Map(previousSales.top_products.map(p => [p.name, p]));
    
    const productPerformance = [];
    
    for (const [name, currentItem] of currentProducts.entries()) {
        const previousItem = previousProducts.get(name);
        const previousQuantity = previousItem ? parseFloat(previousItem.quantity_sold) : 0;
        const currentQuantity = parseFloat(currentItem.quantity_sold);
        
        productPerformance.push({
            name,
            current_quantity: currentQuantity,
            previous_quantity: previousQuantity,
            change_percentage: calculatePercentageChange(currentQuantity, previousQuantity)
        });
    }

    // Sort by change percentage to find best and worst
    productPerformance.sort((a, b) => b.change_percentage - a.change_percentage);
    
    const bestPerformingProducts = productPerformance.slice(0, 3).filter(p => p.change_percentage > 0);
    const worstPerformingProducts = [...productPerformance].sort((a, b) => a.change_percentage - b.change_percentage).slice(0, 3).filter(p => p.change_percentage < 0);

    return {
        current_period: currentPeriod,
        previous_period: previousPeriod,
        revenue: {
            current: currentSales.total_revenue,
            previous: previousSales.total_revenue,
            change_percentage: parseFloat(revenueChange.toFixed(2)),
            trend: revenueChange > 0 ? 'increasing' : (revenueChange < 0 ? 'decreasing' : 'stable')
        },
        transactions: {
            current: currentSales.transactions,
            previous: previousSales.transactions,
            change_percentage: parseFloat(transactionChange.toFixed(2)),
            trend: transactionChange > 0 ? 'increasing' : (transactionChange < 0 ? 'decreasing' : 'stable')
        },
        product_performance: {
            best: bestPerformingProducts,
            worst: worstPerformingProducts
        }
    };
};

module.exports = {
    compareSalesPeriods,
    calculatePercentageChange
};
