const db = require('../config/db');

const validQuantityFor = (value, productType, { allowZero = true } = {}) => {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || (allowZero ? quantity < 0 : quantity <= 0)
        || Math.round(quantity * 1000) !== quantity * 1000) {
        return false;
    }
    return productType !== 'COUNT' || Number.isInteger(quantity);
};

// @desc    Get inventory (products with stock info)
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM products WHERE status = "ACTIVE"');
        
        const [products] = await db.query(
            `SELECT id, name, sku, product_type, unit, stock_quantity, reorder_level, 
                CASE 
                    WHEN stock_quantity <= 0 THEN 'OUT OF STOCK'
                    WHEN stock_quantity <= reorder_level THEN 'LOW STOCK'
                    ELSE 'IN STOCK'
                END as stock_status
            FROM products 
            WHERE status = "ACTIVE"
            ORDER BY name ASC 
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: products,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get stock movements
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM stock_movements');
        
        const [movements] = await db.query(
            `SELECT sm.*, p.name as product_name, p.sku, u.name as user_name
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            JOIN users u ON sm.user_id = u.id
            ORDER BY sm.created_at DESC 
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: movements,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add stock (Stock In)
// @route   POST /api/inventory/stock-in
// @access  Private/Admin
const addStock = async (req, res, next) => {
    try {
        const { product_id, quantity, reason } = req.body;

        if (!product_id || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
            res.status(400);
            throw new Error('Valid product ID and positive quantity are required');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get current stock
            const [products] = await connection.query('SELECT stock_quantity, product_type, unit FROM products WHERE id = ? FOR UPDATE', [product_id]);
            
            if (products.length === 0) {
                res.status(404);
                throw new Error('Product not found');
            }

            const { stock_quantity: previous_quantity, product_type, unit } = products[0];
            if (!validQuantityFor(quantity, product_type, { allowZero: false })) {
                res.status(400);
                throw new Error('Quantity must be positive, use at most 3 decimals, and be whole for COUNT products');
            }
            const new_quantity = Math.round((Number(previous_quantity) + Number(quantity)) * 1000) / 1000;

            // Update product stock
            await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [new_quantity, product_id]);

            // Create movement
            await connection.query(
                `INSERT INTO stock_movements (product_id, user_id, type, quantity, previous_quantity, new_quantity, unit, reason)
                VALUES (?, ?, 'STOCK_IN', ?, ?, ?, ?, ?)`,
                [product_id, req.user.id, quantity, previous_quantity, new_quantity, unit, reason || 'Stock Replenishment']
            );

            await connection.commit();
            res.json({ success: true, message: 'Stock added successfully', data: { new_quantity } });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Adjust stock (Can be negative or positive)
// @route   POST /api/inventory/adjust
// @access  Private/Admin
const adjustStock = async (req, res, next) => {
    try {
        const { product_id, new_quantity, reason } = req.body;

        if (!product_id || new_quantity === undefined || !Number.isFinite(Number(new_quantity)) || Number(new_quantity) < 0) {
            res.status(400);
            throw new Error('Valid product ID and non-negative new quantity are required');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Get current stock
            const [products] = await connection.query('SELECT stock_quantity, product_type, unit FROM products WHERE id = ? FOR UPDATE', [product_id]);
            
            if (products.length === 0) {
                res.status(404);
                throw new Error('Product not found');
            }

            const { stock_quantity: previous_quantity, product_type, unit } = products[0];
            if (!validQuantityFor(new_quantity, product_type)) {
                res.status(400);
                throw new Error('New quantity must use at most 3 decimals, and be whole for COUNT products');
            }
            const normalizedQuantity = Math.round(Number(new_quantity) * 1000) / 1000;
            const difference = normalizedQuantity - Number(previous_quantity);

            if (difference === 0) {
                await connection.rollback();
                return res.json({ success: true, message: 'No adjustment needed' });
            }

            // Update product stock
            await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [normalizedQuantity, product_id]);

            // Create movement
            await connection.query(
                `INSERT INTO stock_movements (product_id, user_id, type, quantity, previous_quantity, new_quantity, unit, reason)
                VALUES (?, ?, 'ADJUSTMENT', ?, ?, ?, ?, ?)`,
                [product_id, req.user.id, Math.abs(difference), previous_quantity, normalizedQuantity, unit, reason || 'Manual Adjustment']
            );

            await connection.commit();
            res.json({ success: true, message: 'Stock adjusted successfully', data: { new_quantity: normalizedQuantity } });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { getInventory, getStockMovements, addStock, adjustStock };
