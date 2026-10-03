import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Reports = () => {
    const [dailySales, setDailySales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/reports/daily-sales');
                setDailySales(res.data.data);
            } catch (error) {
                console.error("Failed to fetch reports", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Daily Sales Summary</h2>
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Date</th>
                                    <th className="p-3 text-center">Transactions</th>
                                    <th className="p-3 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailySales.map((d, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
                                        <td className="p-3 text-center">{d.transactions}</td>
                                        <td className="p-3 text-right font-bold">Rs. {parseFloat(d.revenue).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reports;
