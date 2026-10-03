import React, { useContext } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiHome, FiShoppingBag, FiBox, FiUsers, FiSettings, FiLogOut, FiPieChart, FiMonitor } from 'react-icons/fi';

const MainLayout = () => {
    const { user, logout } = useContext(AuthContext);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: FiHome, adminOnly: false },
        { name: 'POS', href: '/pos', icon: FiMonitor, adminOnly: false },
        { name: 'Sales', href: '/sales', icon: FiShoppingBag, adminOnly: false },
        { name: 'Products', href: '/products', icon: FiBox, adminOnly: true },
        { name: 'Inventory', href: '/inventory', icon: FiBox, adminOnly: true },
        { name: 'Customers', href: '/customers', icon: FiUsers, adminOnly: false },
        { name: 'Users', href: '/users', icon: FiUsers, adminOnly: true },
        { name: 'Reports', href: '/reports', icon: FiPieChart, adminOnly: true },
    ];

    const navItems = navigation.filter(item => !item.adminOnly || user.role === 'ADMIN');

    return (
        <div className="flex h-screen bg-bgLight">
            {/* Sidebar */}
            <div className="w-64 bg-primary text-white flex flex-col">
                <div className="flex items-center justify-center h-16 border-b border-blue-800">
                    <h1 className="text-xl font-bold">POS System</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={`flex items-center px-6 py-3 text-sm font-medium ${
                                            isActive ? 'bg-blue-800 border-l-4 border-white' : 'hover:bg-blue-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="p-4 border-t border-blue-800">
                    <div className="flex items-center mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-blue-300">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-200 hover:bg-red-600 hover:text-white rounded transition-colors"
                    >
                        <FiLogOut className="mr-3 h-4 w-4" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white shadow-sm flex items-center px-6 justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {navItems.find(item => location.pathname.startsWith(item.href))?.name || 'Overview'}
                    </h2>
                </header>
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
