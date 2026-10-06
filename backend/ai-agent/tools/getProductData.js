const db = require('../../config/db');

/**
 * Tool: getProductData
 * Retrieves specific product information or a list of products.
 * @param {Object} params
 * @param {string} [params.searchQuery] - Name or SKU to search for
 * @param {number} [params.limit] - Number of results to return
 */
const getProductData = async (params = {}) => {
    try {
        const { searchQuery, limit = 20 } = params;
        
        let query = `
            SELECT 
                p.id, p.name, p.sku, p.barcode, 
                c.name as category, 
                p.cost_price, p.selling_price, 
                p.stock_quantity,
                (SELECT COALESCE(SUM(si.quantity), 0) FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = p.id AND s.payment_status = 'PAID') as total_sales_quantity
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'ACTIVE'
        `;
        
        const queryParams = [];

        if (searchQuery) {
            query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
            const likeQuery = `%${searchQuery}%`;
            queryParams.push(likeQuery, likeQuery, likeQuery);
        }

        query += ` ORDER BY p.name ASC LIMIT ?`;
        queryParams.push(parseInt(limit));

        const [products] = await db.query(query, queryParams);

        return products.map(p => ({
            ...p,
            cost_price: parseFloat(p.cost_price),
            selling_price: parseFloat(p.selling_price),
            stock_quantity: parseFloat(p.stock_quantity),
            total_sales_quantity: parseFloat(p.total_sales_quantity)
        }));

    } catch (error) {
        console.error('Error in getProductData tool:', error);
        throw new Error('Failed to retrieve product data');
    }
};

module.exports = getProductData;
