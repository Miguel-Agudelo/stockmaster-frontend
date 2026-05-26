import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage          from './features/auth/LoginPage';
import ProductList        from './features/products/pages/ProductList';
import UserList           from './features/admin-recovery/pages/UserList';
import WarehousesView     from './features/warehouses/pages/WarehousesView';
import StockMovementList  from './features/movements/pages/StockMovementList';
import ReportsDashboard   from './features/dashboard-reports/pages/ReportsDashboard';
import ProductRecovery    from './features/admin-recovery/ProductRecovery';
import WarehouseRecovery  from './features/admin-recovery/WarehouseRecovery';
import UserRecovery       from './features/admin-recovery/UserRecovery';
import SupplierRecovery   from './features/admin-recovery/SupplierRecovery';
import SupplierList       from './features/suppliers/pages/SupplierList';
import CategoryList       from './features/categories/pages/CategoryList';
import ProfilePage        from './features/profile/pages/ProfilePage';
import StockTransferPage  from './features/movements/pages/StockTransferPage';
import Sidebar            from './components/layout/Sidebar';

import { AuthProvider, useAuth } from './context/AuthContext';
import useInactivityTimer        from './core/hooks/useInactivityTimer';
import ROLES                     from './core/constants/roles';
import './App.css';

// ─── AuthGuard: solo verifica si hay sesión activa ────────────────────────────
const AuthGuard = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ─── RoleGuard: solo verifica el rol, asume que AuthGuard ya pasó ─────────────
const RoleGuard = ({ roles, children }) => {
    const { currentUser } = useAuth();
    if (roles && roles.length > 0 && (!currentUser || !roles.includes(currentUser.role))) {
        return (
            <div className="access-denied-wrapper">
                <h1 className="access-denied-title">Acceso Denegado.</h1>
            </div>
        );
    }
    return children;
};

// ─── AppLayout: inyecta Sidebar + props de usuario a los hijos ───────────────
const AppLayout = ({ children }) => {
    const { currentUser } = useAuth();
    const childrenWithProps = React.Children.map(children, child =>
        React.isValidElement(child)
            ? React.cloneElement(child, { userRole: currentUser.role, userId: currentUser.id })
            : child
    );
    return (
        <React.Fragment>
            <Sidebar userRole={currentUser.role} />
            <div className="main-content-wrapper">
                {childrenWithProps}
            </div>
        </React.Fragment>
    );
};

// ─── PrivateRoute: compone los tres guardas en orden ─────────────────────────
const PrivateRoute = ({ children, roles }) => (
    <AuthGuard>
        <RoleGuard roles={roles}>
            <AppLayout>
                {children}
            </AppLayout>
        </RoleGuard>
    </AuthGuard>
);

// ─── Componente raíz con inactividad ─────────────────────────────────────────
const AppWithTimer = () => {
    useInactivityTimer();
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <Navigate to="/dashboard" replace />
                </PrivateRoute>
            } />

            <Route path="/dashboard" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <ReportsDashboard />
                </PrivateRoute>
            } />

            <Route path="/reports" element={<Navigate to="/dashboard" replace />} />

            <Route path="/users" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <UserList />
                </PrivateRoute>
            } />
            <Route path="/users/recovery" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <UserRecovery />
                </PrivateRoute>
            } />

            <Route path="/products" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <ProductList />
                </PrivateRoute>
            } />
            <Route path="/products/recovery" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <ProductRecovery />
                </PrivateRoute>
            } />

            <Route path="/warehouses" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <WarehousesView />
                </PrivateRoute>
            } />
            <Route path="/warehouses/recovery" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <WarehouseRecovery />
                </PrivateRoute>
            } />

            <Route path="/movements" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <StockMovementList />
                </PrivateRoute>
            } />
            <Route path="/movements/transfer" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <StockTransferPage />
                </PrivateRoute>
            } />

            <Route path="/suppliers" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <SupplierList />
                </PrivateRoute>
            } />
            <Route path="/suppliers/recovery" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <SupplierRecovery />
                </PrivateRoute>
            } />

            <Route path="/categories" element={
                <PrivateRoute roles={[ROLES.ADMIN]}>
                    <CategoryList />
                </PrivateRoute>
            } />

            <Route path="/profile" element={
                <PrivateRoute roles={[ROLES.ADMIN, ROLES.OPERATOR]}>
                    <ProfilePage />
                </PrivateRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppWithTimer />
            </Router>
        </AuthProvider>
    );
}

export default App;
