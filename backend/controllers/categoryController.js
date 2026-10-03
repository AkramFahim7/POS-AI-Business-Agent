const db = require('../config/db');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = async (req, res, next) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name ASC');
        res.json({ success: true, data: categories });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategoryById = async (req, res, next) => {
    try {
        const [category] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
        if (category.length === 0) {
            res.status(404);
            throw new Error('Category not found');
        }
        res.json({ success: true, data: category[0] });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            res.status(400);
            throw new Error('Name is required');
        }

        const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            res.status(400);
            throw new Error('Category already exists');
        }

        const [result] = await db.query('INSERT INTO categories (name, description) VALUES (?, ?)', [name, description]);
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { id: result.insertId, name, description, status: 'ACTIVE' }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
    try {
        const { name, description, status } = req.body;
        const [result] = await db.query(
            'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?',
            [name, description, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            res.status(404);
            throw new Error('Category not found');
        }

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400);
            next(new Error('Category name already exists'));
        } else {
            next(error);
        }
    }
};

// @desc    Delete category (Soft delete if products exist, or hard delete)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;
        // Check if category has products
        const [products] = await db.query('SELECT id FROM products WHERE category_id = ? LIMIT 1', [categoryId]);
        
        if (products.length > 0) {
            // Soft delete
            await db.query('UPDATE categories SET status = ? WHERE id = ?', ['INACTIVE', categoryId]);
            res.json({ success: true, message: 'Category deactivated because it contains products' });
        } else {
            // Hard delete
            const [result] = await db.query('DELETE FROM categories WHERE id = ?', [categoryId]);
            if (result.affectedRows === 0) {
                res.status(404);
                throw new Error('Category not found');
            }
            res.json({ success: true, message: 'Category deleted successfully' });
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
