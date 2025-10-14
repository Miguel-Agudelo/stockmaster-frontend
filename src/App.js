//App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 🎯 Rutas Corregidas: Se asume que pages/ y components/ están directamente bajo src/
// Vistas de Autenticación, Productos y Usuarios
import LoginPage from './pages/auth/LoginPage';
import ProductList from './pages/products/ProductList';
import UserList from './pages/users/UserList';

// 🎯 Importar las nuevas vistas del Sprint 2
import WarehousesView from './pages/warehouses/WarehousesView';
import StockMovementList from './pages/movements/StockMovementList';

// Componentes de Layout
import Sidebar from './components/layout/Sidebar';
import authService from './services/authService';

import './App.css';

const PrivateRoute = ({ children, roles }) => {
    // Obtener los datos del usuario logueado
    const isAuthenticated = authService.isUserAuthenticated();
    const currentUser = authService.getCurrentUser();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 1. Verificación de Roles (Autorización)
    if (roles && roles.length > 0 && (!currentUser || !roles.includes(currentUser.role))) {
        // Estilo básico para Denegado
        return (
            <div style={{
                padding: '40px',
                textAlign: 'center',
                fontSize: '1.2rem',
                color: '#dc3545'
            }}>Acceso Denegado. No tienes los permisos necesarios.</div>
        );
    }

    // 2. Pasar el rol y el ID del usuario como props
    const childWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                userRole: currentUser.role,
                userId: currentUser.id
            });
        }
        return child;
    });


    // 🟢 CORRECCIÓN DE LAYOUT IMPLEMENTADA AQUÍ
    return (
        // El Fragment permite devolver múltiples elementos sin un div contenedor,
        // lo cual es necesario cuando el Sidebar es Fixed.
        <React.Fragment>
            <Sidebar userRole={currentUser.role} />

            {/* La clase .main-content-wrapper (definida en App.css) hace el trabajo:
            margin-left: 250px;
            width: calc(100% - 250px);

            Quitamos los estilos inline 'display: flex' del padre y 'flex: 1' del hijo.
            */}
            <div className="main-content-wrapper">
                {childWithProps}
            </div>
        </React.Fragment>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Ruta de Usuarios (ADMIN) */}
                <Route
                    path="/users"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <UserList />
                        </PrivateRoute>
                    }
                />

                {/* Ruta de Productos (ADMIN, OPERADOR) */}
                <Route
                    path="/products"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR', 'OPERADOR']}>
                            <ProductList />
                        </PrivateRoute>
                    }
                />

                {/* NUEVA RUTA: Almacenes (Todos) */}
                <Route
                    path="/warehouses"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR', 'OPERADOR']}>
                            <WarehousesView />
                        </PrivateRoute>
                    }
                />

                {/* NUEVA RUTA: Movimientos (OPERADOR) */}
                <Route
                    path="/movements"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR','OPERADOR']}>
                            <StockMovementList />
                        </PrivateRoute>
                    }
                />

                {/* Manejo de rutas no encontradas */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </Router>
    );
}

export default App;