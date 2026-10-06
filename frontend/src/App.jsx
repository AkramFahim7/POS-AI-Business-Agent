import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Reports from './pages/Reports';
import AIAgent from './pages/AIAgent';

const App = () => {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="customers" element={<Customers />} />
                    
                    {/* Admin Only Routes */}
                    <Route path="ai-agent" element={
                        <RoleProtectedRoute requiredRole="ADMIN">
                            <AIAgent />
                        </RoleProtectedRoute>
                    } />
                    <Route path="products" element={
                        <RoleProtectedRoute requiredRole="ADMIN">
                            <Products />
                        </RoleProtectedRoute>
                    } />
                    <Route path="inventory" element={
                        <RoleProtectedRoute requiredRole="ADMIN">
                            <Inventory />
                        </RoleProtectedRoute>
                    } />
                    <Route path="users" element={
                        <RoleProtectedRoute requiredRole="ADMIN">
                            <Users />
                        </RoleProtectedRoute>
                    } />
                    <Route path="reports" element={
                        <RoleProtectedRoute requiredRole="ADMIN">
                            <Reports />
                        </RoleProtectedRoute>
                    } />
                </Route>
            </Routes>
        </Router>
    );
};

export default App;
