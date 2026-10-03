const db = require('../config/db');

const productTypes = {
    COUNT: ['PCS'],
    WEIGHT: ['KG', 'G'],
    VOLUME: ['L', 'ML']
};

const isValidQuantity = (value, productType) => {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0 || Math.round(quantity * 1000) !== quantity * 1000) {
        return false;
    }
    return productType !== 'COUNT' || Number.isInteger(quantity);
};

// @desc    Get all products (with pagination & search)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const categoryId = req.query.category_id || '';

        let queryParams = [];
        let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
        let selectQuery = `
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE 1=1
        `;

        if (search) {
            const searchTerm = `%${search}%`;
            countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
            selectQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (categoryId) {
            countQuery += ' AND p.category_id = ?';
            selectQuery += ' AND p.category_id = ?';
            queryParams.push(categoryId);
        }

        const [[{ total }]] = await db.query(countQuery, queryParams);

        selectQuery += ' ORDER BY p.name ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [products] = await db.query(selectQuery, queryParams);

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

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
    try {
        const [products] = await db.query(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ?
        `, [req.params.id]);

        if (products.length === 0) {
            res.status(404);
            throw new Error('Product not found');
        }

        res.json({ success: true, data: products[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    try {
        const { category_id, name, sku, barcode, description, cost_price, selling_price, stock_quantity = 0, reorder_level = 0 } = req.body;
        const product_type = String(req.body.product_type || 'COUNT').toUpperCase();
        const unit = String(req.body.unit || 'PCS').toUpperCase();

        // Validation
        if (!category_id || !name || !sku || selling_price === undefined || cost_price === undefined) {
            res.status(400);
            throw new Error('Please provide all required fields');
        }

        if (!productTypes[product_type] || !productTypes[product_type].includes(unit)) {
            res.status(400);
            throw new Error('Choose a valid unit for the product type');
        }

        if (![selling_price, cost_price].every(value => Number.isFinite(Number(value)) && Number(value) >= 0)
            || !isValidQuantity(stock_quantity, product_type)
            || !isValidQuantity(reorder_level, product_type)) {
            res.status(400);
            throw new Error('Prices must be non-negative, quantities must use at most 3 decimals, and COUNT quantities must be whole numbers');
        }

        // Start transaction if we are setting initial stock
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [result] = await connection.query(
                `INSERT INTO products (category_id, name, sku, barcode, description, product_type, unit, cost_price, selling_price, stock_quantity, reorder_level) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [category_id, name, sku, barcode || null, description, product_type, unit, cost_price, selling_price, Number(stock_quantity), Number(reorder_level)]
            );

            // Record initial stock movement if > 0
            if (stock_quantity > 0) {
                await connection.query(
                    `INSERT INTO stock_movements (product_id, user_id, type, quantity, previous_quantity, new_quantity, unit, reason)
                    VALUES (?, ?, 'STOCK_IN', ?, 0, ?, ?, 'Initial Stock')`,
                    [result.insertId, req.user.id, stock_quantity, stock_quantity, unit]
                );
            }

            await connection.commit();
            res.status(201).json({ success: true, message: 'Product created successfully', data: { id: result.insertId } });
        } catch (err) {
            await connection.rollback();
            if (err.code === 'ER_DUP_ENTRY') {
                res.status(400);
                throw new Error('SKU or Barcode already exists');
            }
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    try {
        const { category_id, name, sku, barcode, description, cost_price, selling_price, reorder_level, status } = req.body;
        const product_type = String(req.body.product_type || 'COUNT').toUpperCase();
        const unit = String(req.body.unit || 'PCS').toUpperCase();

        if (!productTypes[product_type] || !productTypes[product_type].includes(unit)) {
            res.status(400);
            throw new Error('Choose a valid unit for the product type');
        }

        if (![selling_price, cost_price].every(value => Number.isFinite(Number(value)) && Number(value) >= 0)
            || !isValidQuantity(reorder_level, product_type)) {
            res.status(400);
            throw new Error('Prices must be non-negative, and reorder level must use a valid quantity');
        }

        const [result] = await db.query(
            `UPDATE products SET 
                category_id = ?, name = ?, sku = ?, barcode = ?, description = ?, 
                cost_price = ?, selling_price = ?, product_type = ?, reorder_level = ?, unit = ?, status = ?
            WHERE id = ?`,
            [category_id, name, sku, barcode || null, description, cost_price, selling_price, product_type, reorder_level, unit, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Product not found');
        }

        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400);
            next(new Error('SKU or Barcode already exists'));
        } else {
            next(error);
        }
    }
};

// @desc    Delete/Deactivate product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
    try {
        // Soft delete
        const [result] = await db.query('UPDATE products SET status = ? WHERE id = ?', ['INACTIVE', req.params.id]);
        
        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Product not found');
        }

        res.json({ success: true, message: 'Product deactivated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
