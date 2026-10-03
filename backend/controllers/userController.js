const bcrypt = require('bcryptjs');
const db = require('../config/db');

// @desc    Get all users (with pagination)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
        
        const [users] = await db.query(
            'SELECT id, name, email, role, phone, status, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.json({
            success: true,
            data: users,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res, next) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, phone, status, created_at FROM users WHERE id = ?',
            [req.params.id]
        );

        if (users.length === 0) {
            res.status(404);
            throw new Error('User not found');
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Please add all required fields');
        }

        // Check if user exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'CASHIER', phone]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: result.insertId,
                name,
                email,
                role: role || 'CASHIER'
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res, next) => {
    try {
        const { name, email, role, phone, password } = req.body;
        const userId = req.params.id;

        const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            res.status(404);
            throw new Error('User not found');
        }

        let updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?, phone = ?';
        const queryParams = [name, email, role, phone];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateQuery += ', password = ?';
            queryParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        queryParams.push(userId);

        await db.query(updateQuery, queryParams);

        res.json({
            success: true,
            message: 'User updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user status (soft delete / activate)
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body; // 'ACTIVE' or 'INACTIVE'
        
        if (!['ACTIVE', 'INACTIVE'].includes(status)) {
            res.status(400);
            throw new Error('Invalid status');
        }

        const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('User not found');
        }

        res.json({
            success: true,
            message: `User status updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user (Prefer soft delete in a real app, this might just be for extreme cases or if required)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        // We will just do a soft delete (status = INACTIVE) as per requirements to keep sales history safe
        const [result] = await db.query('UPDATE users SET status = ? WHERE id = ?', ['INACTIVE', req.params.id]);
        
        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('User not found');
        }

        res.json({
            success: true,
            message: 'User deactivated (soft deleted) successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser
};
