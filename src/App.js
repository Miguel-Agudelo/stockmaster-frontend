// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import ProductList from './pages/products/ProductList';
import UserList from './pages/users/UserList'; // Importar la página de usuarios
import Sidebar from './components/layout/Sidebar';
import authService from './services/authService';
import './App.css'; // Asegúrate de tener los estilos necesarios

const PrivateRoute = ({ children, roles }) => {
    const isAuthenticated = authService.isUserAuthenticated();
    const currentUser = authService.getCurrentUser();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(currentUser.role)) {
        return <div>Acceso Denegado. No tienes los permisos necesarios.</div>;
    }

    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <div style={{ flex: 1, padding: '20px' }}>
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route
                    path="/users"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <UserList />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/products"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR', 'OPERADOR']}>
                            <ProductList />
                        </PrivateRoute>
                    }
                />

            </Routes>
        </Router>
    );
}

export default App;
