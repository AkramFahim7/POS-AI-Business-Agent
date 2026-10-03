import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustData, setAdjustData] = useState({ product_id: '', new_quantity: '', reason: '' });
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await api.get('/inventory?limit=50');
            setInventory(res.data.data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const openAdjustModal = (product) => {
        setSelectedProduct(product);
        setAdjustData({ product_id: product.id, new_quantity: product.stock_quantity, reason: 'Manual adjustment' });
        setIsAdjustModalOpen(true);
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/inventory/adjust', adjustData);
            setIsAdjustModalOpen(false);
            fetchInventory();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to adjust stock');
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h1>

            <div className="bg-white rounded-lg shadow-sm p-6">
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">SKU</th>
                                    <th className="p-3">Product Name</th>
                                    <th className="p-3 text-center">Current Stock</th>
                                    <th className="p-3 text-center">Reorder Level</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-600">{item.sku}</td>
                                        <td className="p-3">{item.name}</td>
                                        <td className="p-3 text-center text-lg font-bold">{item.product_type === 'COUNT' ? Number(item.stock_quantity).toFixed(0) : Number(item.stock_quantity).toFixed(3)} {item.unit}</td>
                                        <td className="p-3 text-center text-gray-500">{item.product_type === 'COUNT' ? Number(item.reorder_level).toFixed(0) : Number(item.reorder_level).toFixed(3)} {item.unit}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                item.stock_status === 'IN STOCK' ? 'bg-green-100 text-green-800' :
                                                item.stock_status === 'LOW STOCK' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {item.stock_status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button 
                                                onClick={() => openAdjustModal(item)}
                                                className="text-primary hover:text-blue-800 font-medium border border-primary px-3 py-1 rounded"
                                            >
                                                Adjust
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {inventory.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">No inventory data found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isAdjustModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
                        <p className="mb-4 text-gray-600">Adjusting stock for: <strong>{selectedProduct?.name}</strong></p>
                        
                        <form onSubmit={handleAdjustSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">New Quantity</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step={selectedProduct?.product_type === 'COUNT' ? '1' : '0.001'}
                                    required 
                                    value={adjustData.new_quantity} 
                                    onChange={(e) => setAdjustData({...adjustData, new_quantity: e.target.value})} 
                                    className="w-full border rounded p-2 text-lg font-bold" 
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Reason</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={adjustData.reason} 
                                    onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})} 
                                    className="w-full border rounded p-2" 
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-4 py-2 border rounded text-gray-600">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Update Stock</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
