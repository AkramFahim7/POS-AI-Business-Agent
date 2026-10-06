const getInventoryData = require('../tools/getInventoryData');

/**
 * Analyzes inventory to identify restocking needs and risks.
 */
const analyzeInventory = async () => {
    const inventoryData = await getInventoryData();

    // Calculate restock recommendations based on sales velocity and low stock
    const restock_recommendations = [];

    // Prioritize out of stock that are also fast moving
    const fastMovingIds = new Set(inventoryData.fast_moving.map(p => p.id));
    
    inventoryData.out_of_stock.forEach(item => {
        restock_recommendations.push({
            product_id: item.id,
            name: item.name,
            sku: item.sku,
            priority: fastMovingIds.has(item.id) ? 'CRITICAL' : 'HIGH',
            reason: 'Out of stock'
        });
    });

    // Then low stock items based on velocity
    inventoryData.low_stock.forEach(item => {
        // If it's fast moving, higher priority
        const isFastMoving = fastMovingIds.has(item.id);
        restock_recommendations.push({
            product_id: item.id,
            name: item.name,
            sku: item.sku,
            priority: isFastMoving ? 'HIGH' : 'MEDIUM',
            reason: \`Stock (\${item.stock_quantity}) is below reorder level (\${item.reorder_level})\`
        });
    });

    // Identify overstocked or declining demand (slow moving but high stock)
    // Arbitrary threshold: if stock > 50 and sold < 1 in 30 days
    const overstocked_risks = inventoryData.slow_moving.filter(p => parseFloat(p.stock_quantity) > 50).map(p => ({
        product_id: p.id,
        name: p.name,
        stock_quantity: p.stock_quantity,
        sold_last_30_days: p.sold_last_30_days,
        risk: 'High stock with very low recent demand'
    }));

    return {
        summary: {
            total_items: inventoryData.total_items_in_stock,
            out_of_stock_count: inventoryData.out_of_stock.length,
            low_stock_count: inventoryData.low_stock.length
        },
        restock_recommendations,
        overstocked_risks,
        fastest_selling: inventoryData.fast_moving.slice(0, 5),
        slowest_selling: inventoryData.slow_moving.slice(0, 5)
    };
};

module.exports = {
    analyzeInventory
};
