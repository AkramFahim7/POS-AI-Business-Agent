const db = require('../config/db');
const { generateInvoiceNumber } = require('../utils/invoiceGenerator');

const quantityToMilliunits = (value) => {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity <= 0 || Math.round(quantity * 1000) !== quantity * 1000) {
        return null;
    }
    return Math.round(quantity * 1000);
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM sales');

        const [sales] = await db.query(`
            SELECT s.*, c.name as customer_name, u.name as cashier_name 
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        res.json({
            success: true,
            data: sales,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get sale by ID with items
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res, next) => {
    try {
        const [sales] = await db.query(`
            SELECT s.*, c.name as customer_name, c.phone as customer_phone, u.name as cashier_name 
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (sales.length === 0) {
            res.status(404);
            throw new Error('Sale not found');
        }

        const [items] = await db.query(`
            SELECT si.*, p.name as product_name, p.sku 
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        `, [req.params.id]);

        res.json({
            success: true,
            data: { ...sales[0], items }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
    // Crucial: We must not trust frontend prices. We must calculate on the backend.
    const connection = await db.getConnection();
    try {
        const { customer_id, cart_items, payment_method, cash_received, discount = 0, tax = 0, notes } = req.body;

        if (!cart_items || cart_items.length === 0) {
            res.status(400);
            throw new Error('Cart is empty');
        }

        if (!payment_method) {
            res.status(400);
            throw new Error('Payment method is required');
        }

        await connection.beginTransaction();

        let calculatedSubtotalCents = 0;
        const validItems = [];

        // 1. Validate items and stock
        for (const item of cart_items) {
            const [products] = await connection.query(
                'SELECT id, selling_price, stock_quantity, product_type, unit, status FROM products WHERE id = ? FOR UPDATE',
                [item.product_id]
            );

            if (products.length === 0 || products[0].status !== 'ACTIVE') {
                throw new Error(`Product ID ${item.product_id} is not available`);
            }

            const product = products[0];
            const quantityMilliunits = quantityToMilliunits(item.quantity);
            if (quantityMilliunits === null || (product.product_type === 'COUNT' && quantityMilliunits % 1000 !== 0)) {
                res.status(400);
                throw new Error(`${product.product_type} product quantities must be greater than zero, use at most 3 decimals, and COUNT quantities must be whole numbers`);
            }
            const quantity = quantityMilliunits / 1000;

            if (Number(product.stock_quantity) < quantity) {
                res.status(400);
                throw new Error(`Insufficient stock for Product ID ${product.id}. Only ${product.stock_quantity} available.`);
            }

            const unitPriceCents = Math.round(Number(product.selling_price) * 100);
            const itemSubtotalCents = Math.round((unitPriceCents * quantityMilliunits) / 1000);
            calculatedSubtotalCents += itemSubtotalCents;

            validItems.push({
                product_id: product.id,
                quantity,
                quantity_milliunits: quantityMilliunits,
                unit: product.unit,
                unit_price: product.selling_price,
                subtotal: itemSubtotalCents / 100,
                previous_stock_milliunits: Math.round(Number(product.stock_quantity) * 1000)
            });
        }

        // 2. Calculate totals
        const discountCents = Math.round(Number(discount) * 100);
        const taxCents = Math.round(Number(tax) * 100);
        if (!Number.isFinite(discountCents) || !Number.isFinite(taxCents) || discountCents < 0 || taxCents < 0) {
            res.status(400);
            throw new Error('Discount and tax must be valid non-negative amounts');
        }
        const calculatedTotalCents = calculatedSubtotalCents - discountCents + taxCents;
        if (calculatedTotalCents < 0) {
            res.status(400);
            throw new Error('Discount cannot exceed the sale subtotal');
        }
        const calculatedSubtotal = calculatedSubtotalCents / 100;
        const calculatedTotal = calculatedTotalCents / 100;
        
        let change_amount = 0;
        if (payment_method === 'CASH') {
            const cashReceivedAmount = Number(cash_received);
            if (!Number.isFinite(cashReceivedAmount) || Math.round(cashReceivedAmount * 100) < calculatedTotalCents) {
                res.status(400);
                throw new Error('Cash received is less than total amount');
            }
            change_amount = (Math.round(cashReceivedAmount * 100) - calculatedTotalCents) / 100;
        }

        // 3. Generate Invoice Number
        const invoice_number = await generateInvoiceNumber();

        // 4. Create Sale Record
        const [saleResult] = await connection.query(
            `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount, tax, total, payment_method, payment_status, cash_received, change_amount, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [invoice_number, customer_id || null, req.user.id, calculatedSubtotal, discountCents / 100, taxCents / 100, calculatedTotal, payment_method, 'PAID', cash_received || 0, change_amount, notes || '']
        );

        const saleId = saleResult.insertId;

        // 5. Create Sale Items and update stock/movements
        for (const item of validItems) {
            // Insert Sale Item
            await connection.query(
                `INSERT INTO sale_items (sale_id, product_id, quantity, unit, unit_price, discount, subtotal)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [saleId, item.product_id, item.quantity, item.unit, item.unit_price, 0, item.subtotal]
            );

            // Update Product Stock
            const newStockMilliunits = item.previous_stock_milliunits - item.quantity_milliunits;
            const newStock = newStockMilliunits / 1000;
            await connection.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, item.product_id]);

            // Insert Stock Movement
            await connection.query(
                `INSERT INTO stock_movements (product_id, user_id, type, quantity, previous_quantity, new_quantity, unit, reference_id, reason)
                 VALUES (?, ?, 'SALE', ?, ?, ?, ?, ?, ?)`,
                [item.product_id, req.user.id, item.quantity, item.previous_stock_milliunits / 1000, newStock, item.unit, saleId, `Sale ${invoice_number}`]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Sale completed successfully',
            data: {
                sale_id: saleId,
                invoice_number,
                total: calculatedTotal,
                change: change_amount
            }
        });

    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

module.exports = { getSales, getSaleById, createSale };
