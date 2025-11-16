import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUser, faUserTie, faPencilAlt, faTrashAlt, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import UserForm from '../../components/users/UserForm';
import userService from '../../services/userService';
import './UserList.css';

const SummaryCard = ({ title, value, colorClass }) => {
    const formatValue = (val) => {
        return val.toLocaleString('es-CO'); // Formato de miles
    };

    const displayValue = formatValue(value);

    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value">{displayValue}</h2>
            </div>
        </div>
    );
};

// FUNCIÓN CLAVE: Formatea la cadena de fecha
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

const UserList = ({ userRole }) => {
    const navigate = useNavigate();

    // 1. ESTADOS CLAVE
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    const isAdmin = userRole === 'ADMINISTRADOR';

    // 2. LÓGICA DE CARGA DE DATOS
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

    // 3. EFECTO: Cargar datos al montar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    // LÓGICA DE BOTONES
    const handleNewUser = () => {
        setCurrentUser(null);
        setIsFormOpen(true);
    };

    const handleEdit = (user) => {
        setCurrentUser(user);
        setIsFormOpen(true);
    };

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

    // 4. Función de navegación a la papelera
    const handleGoToRecovery = () => {
        navigate('/users/recovery');
    };
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'ADMINISTRADOR').length;
    const totalOperators = users.filter(u => u.role === 'OPERADOR').length;

    const DYNAMIC_METRICS = [
        { title: "Total Usuarios", value: totalUsers, icon: faUser, colorClass: "metric-orange" },
        { title: "Administradores", value: totalAdmins, icon: faUserTie, colorClass: "metric-green" },
        { title: "Operadores", value: totalOperators, icon: faUser, colorClass: "metric-blue" },
    ];


    return (
        <div className="main-content">

            {/* Header y botón "Nuevo Usuario" */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Usuarios</h1>
                    <p className="page-subtitle">Administrar usuarios y permisos del sistema</p>
                </div>
                {/* Contenedor de botones de acción */}
                <div className="action-buttons-group">
                    {/* BOTÓN PAPELERA (Solo Admin) */}
                    {isAdmin && (
                        <button className="delete-recovery-button" onClick={handleGoToRecovery}>
                            <FontAwesomeIcon icon={faTrashRestore} />
                            Papelera
                        </button>
                    )}
                    {/* Botón Nuevo Usuario */}
                    <button className="add-new-button" onClick={handleNewUser}>
                        <FontAwesomeIcon icon={faPlus} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="summary-cards-container">
                {DYNAMIC_METRICS.map((metric, index) => (
                    <SummaryCard
                        key={index}
                        title={metric.title}
                        value={metric.value}
                        colorClass={metric.colorClass}
                    />
                ))}
            </div>

            {/* Lista de Usuarios */}
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

            {/* MODALES */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <UserForm
                        onSave={handleCloseForm}
                        onCancel={handleCloseForm}
                        currentUser={currentUser}
                    />
                </div>
            )}

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