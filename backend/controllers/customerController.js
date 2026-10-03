const db = require('../config/db');

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        let queryParams = [];
        let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE status = "ACTIVE"';
        let selectQuery = 'SELECT * FROM customers WHERE status = "ACTIVE"';

        if (search) {
            const searchTerm = `%${search}%`;
            countQuery += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            selectQuery += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        const [[{ total }]] = await db.query(countQuery, queryParams);

        selectQuery += ' ORDER BY name ASC LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [customers] = await db.query(selectQuery, queryParams);

        res.json({
            success: true,
            data: customers,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
    try {
        const [customer] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
        if (customer.length === 0) {
            res.status(404);
            throw new Error('Customer not found');
        }
        res.json({ success: true, data: customer[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address } = req.body;
        if (!name) {
            res.status(400);
            throw new Error('Name is required');
        }

        const [result] = await db.query(
            'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
            [name, phone || null, email || null, address || null]
        );
        
        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: { id: result.insertId, name, phone, email, address }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
    try {
        const { name, phone, email, address } = req.body;
        
        const [result] = await db.query(
            'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
            [name, phone || null, email || null, address || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Customer not found');
        }

        res.json({ success: true, message: 'Customer updated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete (deactivate) customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = async (req, res, next) => {
    try {
        const [result] = await db.query('UPDATE customers SET status = "INACTIVE" WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Customer not found');
        }
        res.json({ success: true, message: 'Customer deactivated successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer };
