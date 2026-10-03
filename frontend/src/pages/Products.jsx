import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', category_id: '', sku: '', barcode: '', description: '',
        product_type: 'COUNT', unit: 'PCS', cost_price: 0, selling_price: 0,
        stock_quantity: 0, reorder_level: 0
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [search]);

    const fetchProducts = async () => {
        try {
            const res = await api.get(`/products?search=${search}`);
            setProducts(res.data.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/products', formData);
            setIsModalOpen(false);
            fetchProducts();
            setFormData({
                name: '', category_id: '', sku: '', barcode: '', description: '',
                product_type: 'COUNT', unit: 'PCS', cost_price: 0, selling_price: 0,
                stock_quantity: 0, reorder_level: 0
            });
        } catch (error) {
            alert(error.response?.data?.message || "Failed to create product");
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to deactivate this product?')) {
            try {
                await api.delete(`/products/${id}`);
                fetchProducts();
            } catch(error) {
                alert("Failed to delete product");
            }
        }
    };

    const handleProductTypeChange = (e) => {
        const product_type = e.target.value;
        const unit = product_type === 'WEIGHT' ? 'KG' : product_type === 'VOLUME' ? 'L' : 'PCS';
        setFormData({ ...formData, product_type, unit });
    };

    const unitsByType = {
        COUNT: ['PCS'],
        WEIGHT: ['KG', 'G'],
        VOLUME: ['L', 'ML']
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Products</h1>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary hover:bg-blue-800 text-white px-4 py-2 rounded"
                >
                    Add Product
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <input 
                        type="text"
                        placeholder="Search by name, SKU, barcode..."
                        className="w-full md:w-1/3 border rounded px-4 py-2"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Stock</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => (
                                    <tr key={product.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{product.sku}</td>
                                        <td className="p-3">{product.name}</td>
                                        <td className="p-3">{product.category_name}</td>
                                        <td className="p-3">Rs. {parseFloat(product.selling_price).toFixed(2)} / {product.unit}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${product.stock_quantity <= product.reorder_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {Number(product.stock_quantity).toFixed(3)} {product.unit}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {product.status === 'ACTIVE' ? (
                                                <span className="text-green-600">Active</span>
                                            ) : (
                                                <span className="text-red-600">Inactive</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-right">
                                            {/* Edit not fully implemented for brevity, but delete/deactivate is */}
                                            <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-700">Deactivate</button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="p-4 text-center text-gray-500">No products found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Add New Product</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category *</label>
                                    <select name="category_id" required value={formData.category_id} onChange={handleChange} className="w-full border rounded p-2">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Type *</label>
                                    <select name="product_type" required value={formData.product_type} onChange={handleProductTypeChange} className="w-full border rounded p-2">
                                        <option value="COUNT">Count (pieces)</option>
                                        <option value="WEIGHT">Weight</option>
                                        <option value="VOLUME">Volume</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Base Unit *</label>
                                    <select name="unit" required value={formData.unit} onChange={handleChange} className="w-full border rounded p-2">
                                        {unitsByType[formData.product_type].map(unit => <option key={unit} value={unit}>{unit}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">SKU *</label>
                                    <input type="text" name="sku" required value={formData.sku} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Barcode</label>
                                    <input type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Cost Price (Rs. per {formData.unit}) *</label>
                                    <input type="number" step="0.01" min="0" name="cost_price" required value={formData.cost_price} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Selling Price (Rs. per {formData.unit}) *</label>
                                    <input type="number" step="0.01" min="0" name="selling_price" required value={formData.selling_price} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Initial Stock ({formData.unit})</label>
                                    <input type="number" min="0" step={formData.product_type === 'COUNT' ? '1' : '0.001'} name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reorder Level ({formData.unit})</label>
                                    <input type="number" min="0" step={formData.product_type === 'COUNT' ? '1' : '0.001'} name="reorder_level" value={formData.reorder_level} onChange={handleChange} className="w-full border rounded p-2" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border rounded p-2" rows="2"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
