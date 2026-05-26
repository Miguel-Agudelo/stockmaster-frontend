import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUser, faUserTie, faPencilAlt, faTrashAlt, faTrashRestore } from '@fortawesome/free-solid-svg-icons';

import UserForm          from '../components/UserForm';
import Pagination        from '../../../components/ui/Pagination';
import SummaryCard       from '../../../components/ui/SummaryCard';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import usePagination     from '../../../core/hooks/usePagination';
import ROLES             from '../../../core/constants/roles';
import userService       from '../userService';
import { formatDate }    from '../../../core/utils/dateUtils';
import './UserList.css';

const UserList = ({ userRole }) => {
    const navigate = useNavigate();
    const isAdmin  = userRole === ROLES.ADMIN;

    const [users,        setUsers]        = useState([]);
    const [isLoading,    setIsLoading]    = useState(true);
    const [error,        setError]        = useState(null);
    const [isFormOpen,   setIsFormOpen]   = useState(false);
    const [currentUser,  setCurrentUser]  = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteError,  setDeleteError]  = useState('');   // ← getter restaurado
    const [searchTerm,   setSearchTerm]   = useState('');

    // ── Carga de datos ────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.getAllUsers();
            setUsers(response.data);
        } catch (err) {
            console.error('Error al obtener usuarios:', err.response?.data || err.message);
            setError('No se pudieron cargar los usuarios.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // ── Métricas (memoizadas para evitar recálculo en cada render) ────────────
    const DYNAMIC_METRICS = useMemo(() => {
        const totalAdmins    = users.filter(u => u.role === ROLES.ADMIN).length;
        const totalOperators = users.filter(u => u.role === ROLES.OPERATOR).length;
        return [
            { title: 'Total Usuarios',  value: users.length,   icon: faUser,    colorClass: 'metric-orange' },
            { title: 'Administradores', value: totalAdmins,    icon: faUserTie, colorClass: 'metric-green'  },
            { title: 'Operadores',      value: totalOperators, icon: faUser,    colorClass: 'metric-blue'   },
        ];
    }, [users]);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const handleNewUser   = () => { setCurrentUser(null); setIsFormOpen(true); };
    const handleEdit      = (u) => { setCurrentUser(u);   setIsFormOpen(true); };
    const handleDelete    = (u) => { setUserToDelete(u);  setDeleteError(''); };
    const cancelDeletion  = () =>  { setUserToDelete(null); setDeleteError(''); };

    // Solo recarga si el formulario guardó cambios (saved=true)
    const handleCloseForm = (saved = false) => {
        setIsFormOpen(false);
        setCurrentUser(null);
        if (saved) fetchUsers();
    };

    const confirmDeletion = async () => {
        try {
            await userService.deleteUser(userToDelete.id);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'No se pudo eliminar el usuario.');
        }
    };

    // ── Filtrado + paginación ─────────────────────────────────────────────────
    const filteredUsers = useMemo(() =>
            users.filter(u =>
                [u.name, u.email, u.role].some(f =>
                    f?.toLowerCase().includes(searchTerm.toLowerCase())
                )
            ),
        [users, searchTerm]);

    const { currentPage, pageSize, paginated: paginatedUsers, setPage, setPageSize } =
        usePagination(filteredUsers);

    return (
        <div className="main-content">

            {/* Header */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Usuarios</h1>
                    <p className="page-subtitle">Administrar usuarios y permisos del sistema</p>
                </div>
                <div className="action-buttons-group">
                    {isAdmin && (
                        <button className="delete-recovery-button"
                                onClick={() => navigate('/users/recovery')}>
                            <FontAwesomeIcon icon={faTrashRestore} /> Papelera
                        </button>
                    )}
                    <button className="add-new-button" onClick={handleNewUser}>
                        <FontAwesomeIcon icon={faPlus} /> Nuevo Usuario
                    </button>
                </div>
            </div>

            {/* Métricas */}
            <div className="summary-cards-container">
                {DYNAMIC_METRICS.map((m, i) => (
                    <SummaryCard
                        key={i}
                        title={m.title}
                        value={isLoading ? 'Cargando...' : m.value}
                        colorClass={m.colorClass}
                    />
                ))}
            </div>

            {/* Búsqueda */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar usuarios por nombre, email o rol..."
                    className="product-search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="user-list-card">
                <div className="table-info">
                    Lista de Usuarios
                    <p className="user-count">
                        Mostrando {filteredUsers.length} de {users.length} usuarios
                    </p>
                </div>

                {isLoading ? (
                    <p className="loading-message">Cargando usuarios...</p>
                ) : error ? (
                    <p className="error-display">{error}</p>
                ) : filteredUsers.length > 0 ? (
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
                        {paginatedUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{formatDate(user.createdAt)}</td>
                                <td className="actions-cell">
                                    <button className="icon-button edit-button"
                                            onClick={() => handleEdit(user)} title="Editar">
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    <button className="icon-button delete-button"
                                            onClick={() => handleDelete(user)} title="Eliminar">
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No se encontraron usuarios.</p>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredUsers.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onSizeChange={setPageSize}
                />
            </div>

            {/* Mensaje de error al eliminar */}
            {deleteError && (
                <p className="error-display">{deleteError}</p>
            )}

            {/* Modal: Formulario */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <UserForm
                        onSave={() => handleCloseForm(true)}
                        onCancel={() => handleCloseForm(false)}
                        currentUser={currentUser}
                    />
                </div>
            )}

            {/* Modal: Confirmar eliminación */}
            {userToDelete && (
                <ConfirmationModal
                    title="¿Eliminar Usuario?"
                    message={`Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar a "${userToDelete.name}" (${userToDelete.email})?`}
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    type="delete"
                    onConfirm={confirmDeletion}
                    onCancel={cancelDeletion}
                />
            )}
        </div>
    );
};

export default UserList;
