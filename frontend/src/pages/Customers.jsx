import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await api.get('/customers');
                setCustomers(res.data.data);
            } catch (error) {
                console.error("Failed to fetch customers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCustomers();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
                {loading ? <p>Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-gray-50">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Phone</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3">{c.name}</td>
                                        <td className="p-3">{c.phone || '-'}</td>
                                        <td className="p-3">{c.email || '-'}</td>
                                        <td className="p-3">{c.address || '-'}</td>
                                    </tr>
                                ))}
                                {customers.length === 0 && <tr><td colSpan="4" className="text-center p-4">No customers</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;
