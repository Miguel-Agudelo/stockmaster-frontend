// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import './Sidebar.css';

import LogoImage from '../../assets/LogoStockMaster.png';

// --- Configuración del Menú de Navegación ---
const menuItems = [
    { name: 'Dashboard', path: '/dashboard', iconClass: 'fas fa-home', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Usuarios', path: '/users', iconClass: 'fas fa-users', role: ['ADMINISTRADOR'] },
    { name: 'Productos', path: '/products', iconClass: 'fas fa-box', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Almacenes', path: '/warehouses', iconClass: 'fas fa-warehouse', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Movimientos', path: '/movements', iconClass: 'fas fa-exchange-alt', role: ['ADMINISTRADOR', 'OPERADOR'] },
    { name: 'Reportes', path: '/reports', iconClass: 'fas fa-chart-bar', role: ['ADMINISTRADOR'] },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Para saber la ruta actual
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú de Cerrar Sesión

    // Simulación de datos de usuario (asegúrate de que authService funcione)
    const currentUser = authService.getCurrentUser() || {
        // Rol de Almacenes/Movimientos es 'OPERADOR' o 'ADMINISTRADOR'
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

                    const isImplementedPath = item.path === '/dashboard' ||
                        item.path === '/users' ||
                        item.path === '/products' ||
                        item.path === '/warehouses' ||
                        item.path === '/movements' ||
                        item.path === '/reports'; // 🟢 RUTA DE REPORTES AGREGADA

                    if (!isImplementedPath) return null;


                    // Determina si el ítem está activo
                    const isActive = location.pathname.startsWith(item.path) && item.path !== '/';
                    // Usar startsWith permite que rutas como /warehouses/edit/1 sigan marcando /warehouses como activo.
                    const isDashboardActive = item.path === '/dashboard' && location.pathname === '/dashboard';


                    return (
                        <li
                            key={item.name}
                            className={`menu-item ${isActive || isDashboardActive ? 'active' : ''}`}
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