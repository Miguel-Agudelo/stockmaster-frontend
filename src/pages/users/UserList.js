// src/pages/users/UserList.js (VERSIÓN FINAL CORREGIDA)

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUser, faUserTie, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import UserForm from '../../components/users/UserForm';
import userService from '../../services/userService';
import './UserList.css';

// Componente para la Tarjeta de Métrica (Mantenido)
const MetricCard = ({ title, value, icon, color }) => (
    <div className="metric-card">
        <div className="card-header">
            <span className="card-title">{title}</span>
            <FontAwesomeIcon icon={icon} style={{ color: color, opacity: 0.8 }} />
        </div>
        <div className="card-value">{value}</div>
    </div>
);

// 💡 FUNCIÓN CLAVE: Formatea la cadena de fecha (Mantenido)
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('es-CO', options);
    } catch (e) {
        console.error("Error al formatear la fecha:", dateString, e);
        return 'Inválida';
    }
};


const UserList = () => {
    // 1. ESTADOS CLAVE (Mantenido)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // 2. LÓGICA DE CARGA DE DATOS (Mantenido)
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getAllUsers();
            setUsers(response.data);
        } catch (err) {
            console.error("Error al obtener usuarios:", err.response?.data || err.message);
            setError("No se pudieron cargar los usuarios. Revisa tu conexión o permisos.");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. EFECTO: Cargar datos al montar el componente (Mantenido)
    useEffect(() => {
        fetchUsers();
    }, []);

    // LÓGICA DE BOTONES (Mantenido)
    const handleNewUser = () => {
        setCurrentUser(null); // CLAVE: Resetea el usuario para entrar en modo CREACIÓN
        setIsFormOpen(true);
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsFormOpen(true);
    };

    // ... (Lógica de eliminación confirmDeletion, handleDelete, cancelDeletion y handleCloseForm) ...

    const handleDelete = (user) => {
        setUserToDelete(user);
    };

    const confirmDeletion = async () => {
        if (!userToDelete) return;

        const { id: userId, name: userName } = userToDelete;

        try {
            await userService.deleteUser(userId);
            console.log(`Usuario ${userName} eliminado exitosamente.`);
            fetchUsers();
        } catch (error) {
            console.error("Error al eliminar usuario:", error.response);
            alert(`Error: No se pudo eliminar el usuario. ${error.response?.data?.message || ''}`);
        } finally {
            setUserToDelete(null);
        }
    };

    const cancelDeletion = () => {
        setUserToDelete(null);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setCurrentUser(null);
        fetchUsers();
    };

    // CÁLCULO DE MÉTRICAS (Mantenido)
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'ADMINISTRADOR').length;
    const totalOperators = users.filter(u => u.role === 'OPERADOR').length;

    const DYNAMIC_METRICS = [
        { title: "Total Usuarios", value: totalUsers, icon: faUser, color: "#FF7B00" },
        { title: "Administradores", value: totalAdmins, icon: faUserTie, color: "#10B981" },
        { title: "Operadores", value: totalOperators, icon: faUser, color: "#3B82F6" },
    ];


    return (
        <div className="main-content">

            {/* Header y botón "Nuevo Usuario" siempre visibles (Mantenido) */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Usuarios</h1>
                    <p className="page-subtitle">Administrar usuarios y permisos del sistema</p>
                </div>
                <button className="add-new-button" onClick={handleNewUser}>
                    <FontAwesomeIcon icon={faPlus} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Métricas siempre visibles (Mantenido) */}
            <div className="metrics-grid">
                {DYNAMIC_METRICS.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                ))}
            </div>

            {/* Lista de Usuarios (Tabla Estilizada) - Mantenido */}
            <div className="user-list-card">
                <div className="table-info">
                    Lista de Usuarios
                    <p className="user-count">{users.length} usuarios registrados en el sistema</p>
                </div>

                {isLoading && <p className="loading-message">Cargando usuarios...</p>}
                {error && <p className="error-display">{error}</p>}

                {!isLoading && !error && users.length > 0 && (
                    <table>
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Fecha de Registro</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span>
                                </td>

                                <td>
                                    {formatDate(user.createdAt)}
                                </td>

                                <td className="actions-cell">
                                    <button className="icon-button edit-button" onClick={() => handleEdit(user)}>
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    <button className="icon-button delete-button" onClick={() => handleDelete(user)}>
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}

                {!isLoading && !error && users.length === 0 && (
                    <p className="no-data-message">No se encontraron usuarios en la base de datos.</p>
                )}
            </div>

            {/* 🎯 MODAL DE FORMULARIO (REINSERTADO) */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <UserForm
                        onSave={handleCloseForm} // Esto recargará la lista
                        onCancel={handleCloseForm}
                        currentUser={currentUser} // Si es null, el form debe entrar en modo CREACIÓN
                    />
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN (Mantenido) */}
            {userToDelete && (
                <div className="modal-backdrop">
                    <div className="custom-modal delete-modal">
                        <div className="modal-content">
                            <h3>¿Eliminar Usuario?</h3>
                            <p>
                                Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar a
                                <strong> {userToDelete.name}</strong> ({userToDelete.email}) permanentemente del sistema?
                            </p>
                            <div className="modal-actions">
                                <button className="cancel-button" onClick={cancelDeletion}>
                                    Cancelar
                                </button>
                                <button className="delete-button-red" onClick={confirmDeletion}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;