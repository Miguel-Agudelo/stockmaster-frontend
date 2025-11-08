import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Vistas de Autenticación, Productos y Usuarios
import LoginPage from './pages/auth/LoginPage';
import ProductList from './pages/products/ProductList';
import UserList from './pages/users/UserList';

// Importar las vistas de Gestión (Sprint 2)
import WarehousesView from './pages/warehouses/WarehousesView';
import StockMovementList from './pages/movements/StockMovementList';

// Página de Reportes (HU14, HU15, HU16)
import ReportsDashboard from './pages/reports/ReportsDashboard';

// Vistas de Recuperación (HU17, HU18, HU19)
// Asumo que estos componentes están en la carpeta 'components/admin' como definimos
import ProductRecovery from './components/admin/ProductRecovery';
import WarehouseRecovery from './components/admin/WarehouseRecovery';
import UserRecovery from './components/admin/UserRecovery';

// Componentes de Layout
import Sidebar from './components/layout/Sidebar';
import authService from './services/authService';

import './App.css';

/**
 * Componente que verifica la autenticación y la autorización (roles).
 * También inyecta el rol y el ID del usuario en los componentes hijos.
 */
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


    // Configuración del Layout
    return (
        <React.Fragment>
            <Sidebar userRole={currentUser.role} />
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
                {/* Recuperación de Usuarios (ADMINISTRADOR) - HU19 */}
                <Route
                    path="/users/recovery"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <UserRecovery />
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
                {/* Recuperación de Productos (ADMINISTRADOR) - HU17 */}
                <Route
                    path="/products/recovery"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <ProductRecovery />
                        </PrivateRoute>
                    }
                />

                {/* RUTA: Almacenes (ADMIN, OPERADOR) */}
                <Route
                    path="/warehouses"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR', 'OPERADOR']}>
                            <WarehousesView />
                        </PrivateRoute>
                    }
                />
                {/* Recuperación de Almacenes (ADMINISTRADOR) - HU18 */}
                <Route
                    path="/warehouses/recovery"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <WarehouseRecovery />
                        </PrivateRoute>
                    }
                />

                {/* RUTA: Movimientos (ADMIN, OPERADOR) */}
                <Route
                    path="/movements"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR','OPERADOR']}>
                            <StockMovementList />
                        </PrivateRoute>
                    }
                />

                {/* RUTA: Reportes (ADMIN) - HU14, HU15, HU16 */}
                <Route
                    path="/reports"
                    element={
                        <PrivateRoute roles={['ADMINISTRADOR']}>
                            <ReportsDashboard />
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