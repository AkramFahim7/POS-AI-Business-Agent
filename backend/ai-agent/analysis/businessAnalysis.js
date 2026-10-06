const { compareSalesPeriods } = require('./salesAnalysis');
const { analyzeInventory } = require('./inventoryAnalysis');
const { analyzeCustomers } = require('./customerAnalysis');
const getBusinessMetrics = require('../tools/getBusinessMetrics');

/**
 * High-level business insight engine that correlates data points.
 */
const generateBusinessInsights = async (currentPeriod = 'this month', previousPeriod = 'last month') => {
    const salesAnalysis = await compareSalesPeriods(currentPeriod, previousPeriod);
    const inventoryAnalysis = await analyzeInventory();
    const customerAnalysis = await analyzeCustomers();
    const metrics = await getBusinessMetrics();

    const insights = [];

    // 1. Analyze Revenue Trends
    if (salesAnalysis.revenue.trend === 'decreasing') {
        const drop = Math.abs(salesAnalysis.revenue.change_percentage);
        let reasoning = \`Revenue decreased by \${drop}%. \`;
        
        // Correlate with worst performing products
        const worstProducts = salesAnalysis.product_performance.worst;
        if (worstProducts.length > 0) {
            reasoning += \`Main contributing products to the decline: \${worstProducts.map(p => p.name).join(', ')}. \`;
            
            // Correlate with inventory
            const outOfStockNames = inventoryAnalysis.summary.out_of_stock_count > 0 ? inventoryAnalysis.restock_recommendations.filter(r => r.reason === 'Out of stock').map(r => r.name) : [];
            const outOfStockCulprits = worstProducts.filter(p => outOfStockNames.includes(p.name));
            
            if (outOfStockCulprits.length > 0) {
                reasoning += \`\nProduct shortage is a plausible contributor, as \${outOfStockCulprits.map(p => p.name).join(', ')} are currently out of stock.\`;
            }
        }
        
        insights.push({
            type: 'RISK',
            title: 'Revenue Decline Analysis',
            description: reasoning,
            confidence: 'Medium' // Based purely on correlation
        });
    } else if (salesAnalysis.revenue.trend === 'increasing') {
        const increase = salesAnalysis.revenue.change_percentage;
        let reasoning = \`Revenue increased by \${increase}%. \`;
        
        const bestProducts = salesAnalysis.product_performance.best;
        if (bestProducts.length > 0) {
            reasoning += \`Driven largely by: \${bestProducts.map(p => p.name).join(', ')}.\`;
        }
        
        insights.push({
            type: 'POSITIVE',
            title: 'Revenue Growth',
            description: reasoning,
            confidence: 'High'
        });
    }

    // 2. Inventory Risks
    if (inventoryAnalysis.summary.out_of_stock_count > 0 || inventoryAnalysis.summary.low_stock_count > 0) {
        const critical = inventoryAnalysis.restock_recommendations.filter(r => r.priority === 'CRITICAL');
        if (critical.length > 0) {
            insights.push({
                type: 'WARNING',
                title: 'Critical Stock Shortages',
                description: \`\${critical.length} fast-moving products are currently out of stock: \${critical.map(c => c.name).join(', ')}.\`,
                confidence: 'High'
            });
        }
    }

    // 3. Customer Activity
    if (customerAnalysis.trend.activity_level === 'decreasing') {
        insights.push({
            type: 'WARNING',
            title: 'Decreasing Customer Activity',
            description: \`Transaction count has dropped from \${customerAnalysis.trend.transactions_last_month} to \${customerAnalysis.trend.transactions_this_month} compared to the previous period.\`,
            confidence: 'Medium'
        });
    }

    return {
        metrics,
        insights,
        raw_analysis: {
            sales: salesAnalysis,
            inventory: inventoryAnalysis,
            customers: customerAnalysis
        }
    };
};

module.exports = {
    generateBusinessInsights
};
