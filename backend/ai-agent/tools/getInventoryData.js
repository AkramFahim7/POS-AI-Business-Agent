const db = require('../../config/db');

/**
 * Tool: getInventoryData
 * Retrieves inventory levels and statuses.
 */
const getInventoryData = async () => {
    try {
        // Current Stock Summary
        const [summaryResult] = await db.query(`
            SELECT 
                COUNT(id) as total_products,
                SUM(stock_quantity) as total_items_in_stock
            FROM products 
            WHERE status = 'ACTIVE'
        `);
        
        const summary = summaryResult[0];

        // Out of stock
        const [outOfStock] = await db.query(`
            SELECT id, name, sku, stock_quantity, reorder_level 
            FROM products 
            WHERE stock_quantity <= 0 AND status = 'ACTIVE'
        `);

        // Low stock (stock > 0 but <= reorder_level)
        const [lowStock] = await db.query(`
            SELECT id, name, sku, stock_quantity, reorder_level 
            FROM products 
            WHERE stock_quantity > 0 AND stock_quantity <= reorder_level AND status = 'ACTIVE'
        `);
        
        // Fast moving products (based on last 30 days of sales)
        const [fastMoving] = await db.query(`
            SELECT p.id, p.name, SUM(si.quantity) as sold_last_30_days, p.stock_quantity
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND s.payment_status = 'PAID'
            GROUP BY p.id
            ORDER BY sold_last_30_days DESC
            LIMIT 10
        `);

        // Slow moving products (active products with little or no sales in 30 days)
        const [slowMoving] = await db.query(`
            SELECT p.id, p.name, COALESCE(SUM(si.quantity), 0) as sold_last_30_days, p.stock_quantity
            FROM products p
            LEFT JOIN sale_items si ON p.id = si.product_id
            LEFT JOIN sales s ON si.sale_id = s.id AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND s.payment_status = 'PAID'
            WHERE p.status = 'ACTIVE' AND p.stock_quantity > 0
            GROUP BY p.id
            HAVING sold_last_30_days <= 1
            ORDER BY sold_last_30_days ASC
            LIMIT 10
        `);

        // Recent stock movements (last 10)
        const [stockMovements] = await db.query(`
            SELECT sm.id, p.name as product_name, sm.type, sm.quantity, sm.created_at, sm.reason
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            ORDER BY sm.created_at DESC
            LIMIT 10
        `);

        return {
            total_products: parseInt(summary.total_products),
            total_items_in_stock: parseFloat(summary.total_items_in_stock),
            out_of_stock: outOfStock,
            low_stock: lowStock,
            fast_moving: fastMoving,
            slow_moving: slowMoving,
            recent_movements: stockMovements
        };

    } catch (error) {
        console.error('Error in getInventoryData tool:', error);
        throw new Error('Failed to retrieve inventory data');
    }
};

module.exports = getInventoryData;
