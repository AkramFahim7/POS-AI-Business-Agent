import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSales();
    }, []);

    const fetchSales = async () => {
        try {
            const res = await api.get('/sales?limit=50');
            setSales(res.data.data);
        } catch (error) {
            console.error("Failed to fetch sales", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales History</h1>

            <div className="bg-white rounded-lg shadow-sm p-6">
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Invoice</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Cashier</th>
                                    <th className="p-3">Customer</th>
                                    <th className="p-3">Method</th>
                                    <th className="p-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map(sale => (
                                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-primary">{sale.invoice_number}</td>
                                        <td className="p-3">{new Date(sale.created_at).toLocaleString()}</td>
                                        <td className="p-3">{sale.cashier_name}</td>
                                        <td className="p-3">{sale.customer_name || 'Walk-in'}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-800">
                                            Rs. {parseFloat(sale.total).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                {sales.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-4 text-center text-gray-500">No sales found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sales;
