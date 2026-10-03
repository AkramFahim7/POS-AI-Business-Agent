const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, adminOnly, createProduct);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, adminOnly, updateProduct)
    .delete(protect, adminOnly, deleteProduct);

module.exports = router;
