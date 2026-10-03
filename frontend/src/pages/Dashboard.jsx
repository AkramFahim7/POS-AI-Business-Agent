import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { FiDollarSign, FiShoppingCart, FiBox, FiUsers, FiAlertTriangle } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 flex items-center">
        <div className={`p-4 rounded-full ${colorClass} text-white mr-4`}>
            <Icon size={24} />
        </div>
        <div>
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const Dashboard = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const res = await api.get('/dashboard/summary');
                setSummary(res.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard summary', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Today's Revenue" 
                    value={`Rs. ${parseFloat(summary?.today_revenue || 0).toFixed(2)}`} 
                    icon={FiDollarSign} 
                    colorClass="bg-green-500" 
                />
                <StatCard 
                    title="Today's Sales" 
                    value={summary?.today_sales || 0} 
                    icon={FiShoppingCart} 
                    colorClass="bg-blue-500" 
                />
                <StatCard 
                    title="Total Products" 
                    value={summary?.total_products || 0} 
                    icon={FiBox} 
                    colorClass="bg-indigo-500" 
                />
                <StatCard 
                    title="Low Stock" 
                    value={summary?.low_stock || 0} 
                    icon={FiAlertTriangle} 
                    colorClass={summary?.low_stock > 0 ? "bg-red-500" : "bg-gray-400"} 
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <a href="/pos" className="flex items-center justify-center p-4 bg-primary text-white rounded hover:bg-blue-800 transition">
                            Open POS
                        </a>
                        <a href="/products" className="flex items-center justify-center p-4 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition">
                            Add Product
                        </a>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">System Overview</h3>
                    <p className="text-gray-600">Total Customers: <span className="font-bold">{summary?.total_customers || 0}</span></p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
