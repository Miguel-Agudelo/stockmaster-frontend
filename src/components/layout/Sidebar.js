import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './Sidebar.css';

import LogoImage from '../../assets/LogoStockMaster.png';

// --- Configuración del Menú de Navegación ---
const menuItems = [
    { name: 'Dashboard/Reportes', path: '/reports', iconClass: 'fas fa-chart-bar', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Usuarios', path: '/users', iconClass: 'fas fa-users', role: ['ADMINISTRADOR'] },
    { name: 'Productos', path: '/products', iconClass: 'fas fa-box', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Almacenes', path: '/warehouses', iconClass: 'fas fa-warehouse', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Movimientos', path: '/movements', iconClass: 'fas fa-truck-moving', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Transferencias', path: '/movements/transfer', iconClass: 'fas fa-exchange-alt', role: ['ADMINISTRADOR', 'OPERADOR'] },

];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const currentUser = authService.getCurrentUser() || {
        role: 'ADMINISTRADOR',
        name: 'Juan Pérez',
        initials: 'JP'
    };
    const userRole = currentUser.role;
    const userName = currentUser.name || 'Usuario';
    const userInitials = currentUser.initials || userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);


    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleUserPanel = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div className="sidebar">
            {/* --- Encabezado / Logo --- */}
            <div className="sidebar-header">

                <span className="logo-icon-box">
                <img
                    src={LogoImage}
                    alt="StockMaster Logo"
                    className="logo-img"
                />
            </span>
                <h3 className="app-title">StockMaster</h3>
                <i className="fas fa-chevron-left sidebar-collapse-icon"></i>
            </div>

            {/* --- Menú de navegación principal --- */}
            <ul className="sidebar-menu">
                {menuItems.map((item) => {

                    const hasRequiredRole = item.role.includes(userRole);

                    if (!hasRequiredRole) return null;

                    const isImplementedPath =
                        item.path === '/reports' ||
                        item.path === '/users' ||
                        item.path === '/products' ||
                        item.path === '/warehouses' ||
                        item.path === '/movements' ||
                        item.path === '/movements/transfer';

                    if (!isImplementedPath) return null;


                    let finalActiveState = false;

                    // 1. Caso especial para Reportes: activo si la URL es '/' o '/reports'
                    if (item.path === '/reports') {
                        finalActiveState = location.pathname === '/' || location.pathname.startsWith('/reports');
                    }
                    // 2. Caso para Transferencias: debe ser exacto para no activar solo /movements
                    else if (item.path === '/movements/transfer') {
                        finalActiveState = location.pathname.startsWith('/movements/transfer');
                    }
                    // 3. Caso para Movimientos: solo activo si es /movements (no /movements/transfer)
                    else if (item.path === '/movements') {
                        finalActiveState = location.pathname === '/movements';
                    }
                    // 4. Casos generales (users, products, warehouses, etc.)
                    else {
                        finalActiveState = location.pathname.startsWith(item.path) && item.path !== '/';
                    }


                    return (
                        <li
                            key={item.name}
                            className={`menu-item ${finalActiveState ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <i className={item.iconClass}></i>
                            {item.name}
                        </li>
                    );
                })}
            </ul>

            {/* --- Footer de Usuario y Logout --- */}
            <div className="sidebar-footer">

                {/* Opción 'Cerrar Sesión' */}
                {isMenuOpen && (
                    <div className="logout-button-container">
                        <button onClick={handleLogout} className="logout-button">
                            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                        </button>
                    </div>
                )}

                <div
                    className="user-profile-panel"
                    onClick={toggleUserPanel}
                >
                    <div className="user-avatar">{userInitials}</div>
                    <div className="user-details">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">{userRole}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Sidebar;