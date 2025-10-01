// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Asegúrate de que este servicio exista y funcione correctamente
import authService from '../../services/authService';
import './Sidebar.css';

// --- Configuración del Menú de Navegación ---
const menuItems = [
    //{ name: 'Dashboard', path: '/', iconClass: 'fas fa-home', role: ['ADMINISTRADOR', 'USUARIO'] },
    { name: 'Usuarios', path: '/users', iconClass: 'fas fa-users', role: ['ADMINISTRADOR', 'USUARIO'] },
    { name: 'Productos', path: '/products', iconClass: 'fas fa-box', role: ['ADMINISTRADOR'] },
    { name: 'Almacenes', path: '/warehouses', iconClass: 'fas fa-warehouse', role: ['ADMINISTRADOR', 'USUARIO'] },
    { name: 'Movimientos', path: '/movements', iconClass: 'fas fa-exchange-alt', role: ['ADMINISTRADOR', 'USUARIO'] },
    { name: 'Reportes', path: '/reports', iconClass: 'fas fa-chart-bar', role: ['ADMINISTRADOR'] },
];

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Para saber la ruta actual
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para el menú de Cerrar Sesión

    // Simulación de datos de usuario (asegúrate de que authService funcione)
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
                {/* Asumiendo que 'StockMaster' es un texto con un ícono (como en la imagen) */}
                <span className="logo-icon-box">📦</span>
                <h3 className="app-title">StockMaster</h3>
                <i className="fas fa-chevron-left sidebar-collapse-icon"></i> {/* Ícono < de la esquina */}
            </div>

            {/* --- Menú de navegación principal --- */}
            <ul className="sidebar-menu">
                {menuItems.map((item) => {
                    // Condición de renderizado por rol
                    const shouldRender = item.role.includes(userRole) &&
                        (item.name === 'Usuarios' || item.name === 'Productos' || item.name !== 'Productos');

                    if (!shouldRender) return null;

                    // Determina si el ítem está activo
                    const isActive = location.pathname === item.path ||
                        (item.path === '/' && location.pathname === '/'); // Caso especial para Dashboard

                    // Solo para las vistas implementadas (Usuarios, Productos)
                    if (item.path !== '/users' && item.path !== '/products' && item.path !== '/') return null;


                    return (
                        <li
                            key={item.name}
                            className={`menu-item ${isActive ? 'active' : ''}`}
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

                {/* Panel de usuario - Siempre visible */}
                <div
                    className="user-profile-panel"
                    onClick={toggleUserPanel}
                    // Aplica la clase 'open' si el menú de logout está abierto (simulando el resaltado)
                    // En la imagen, 'Cerrar Sesión' está resaltado, no el panel, por eso lo ajustamos
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