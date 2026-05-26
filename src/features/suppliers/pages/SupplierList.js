import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTimesCircle, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import SupplierForm from '../components/SupplierForm';
import supplierService from '../supplierService';
import Pagination from '../../../components/ui/Pagination';
import usePagination from '../../../core/hooks/usePagination';
import ROLES from '../../../core/constants/roles';
import './SupplierList.css';

const SummaryCard = ({ title, value, colorClass }) => (
    <div className={`summary-card ${colorClass}`}>
        <div className="card-content">
            <p className="card-title">{title}</p>
            <h2 className="card-value">{value}</h2>
        </div>
    </div>
);

const SupplierList = ({ userRole }) => {
    const isAdmin = userRole === ROLES.ADMIN;
    const navigate = useNavigate();

    const [suppliers, setSuppliers]                 = useState([]);
    const [isLoading, setIsLoading]                 = useState(true);
    const [error, setError]                         = useState(null);
    const [searchTerm, setSearchTerm]               = useState('');
    const [isFormOpen, setIsFormOpen]               = useState(false);
    const [currentSupplier, setCurrentSupplier]     = useState(null);
    const [supplierToDeactivate, setSupplierToDeactivate] = useState(null);
    const [deactivateError, setDeactivateError]     = useState('');

    const fetchSuppliers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await supplierService.getAllSuppliers();
            setSuppliers(res.data);
        } catch {
            setError('No se pudieron cargar los proveedores.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

    // Contadores calculados sobre el array completo (activos + inactivos)
    const totalActive   = suppliers.filter(s => s.active).length;
    const totalInactive = suppliers.filter(s => !s.active).length;

    // La tabla solo muestra proveedores activos; la búsqueda se aplica sobre ellos
    const activeSuppliers = suppliers.filter(s => s.active);

    const filteredSuppliers = activeSuppliers.filter(s =>
        (s.name  && s.name.toLowerCase().includes(searchTerm.toLowerCase()))  ||
        (s.nit   && s.nit.toLowerCase().includes(searchTerm.toLowerCase()))   ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.phone && s.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const { currentPage, pageSize, paginated: paginatedSuppliers, setPage, setPageSize } =
        usePagination(filteredSuppliers);

    const handleNew          = () => { setCurrentSupplier(null); setIsFormOpen(true); };
    const handleEdit         = (s) => { setCurrentSupplier(s); setIsFormOpen(true); };
    const handleSaved        = () => { setIsFormOpen(false); fetchSuppliers(); };
    const handleDeactivate   = (s) => { setSupplierToDeactivate(s); setDeactivateError(''); };
    const handleGoToRecovery = () => navigate('/suppliers/recovery');

    const confirmDeactivate = async () => {
        try {
            await supplierService.deactivateSupplier(supplierToDeactivate.id);
            setSupplierToDeactivate(null);
            fetchSuppliers();
        } catch (err) {
            setDeactivateError(err.response?.data?.message || 'No se pudo desactivar el proveedor.');
        }
    };

    return (
        <div className="main-content">

            {/* ── Encabezado ── */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Proveedores</h1>
                    <p className="page-subtitle">Administrar el catálogo de proveedores del sistema</p>
                </div>
                {isAdmin && (
                    <div className="action-buttons-group">
                        <button className="delete-recovery-button" onClick={handleGoToRecovery}>
                            <FontAwesomeIcon icon={faTrashRestore} /> Papelera
                        </button>
                        <button className="add-new-button-orange" onClick={handleNew}>
                            <FontAwesomeIcon icon={faPlus} /> Nuevo Proveedor
                        </button>
                    </div>
                )}
            </div>

            {/* ── KPIs — calculados sobre todos los proveedores ── */}
            <div className="summary-cards-container">
                <SummaryCard
                    title="Total Proveedores"
                    value={isLoading ? '...' : suppliers.length}
                    colorClass="metric-orange"
                />
                <SummaryCard
                    title="Proveedores Activos"
                    value={isLoading ? '...' : totalActive}
                    colorClass="metric-green"
                />
                <SummaryCard
                    title="Inactivos"
                    value={isLoading ? '...' : totalInactive}
                    colorClass="metric-blue"
                />
            </div>

            {/* ── Búsqueda ── */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar proveedores por nombre, NIT o correo..."
                    className="product-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* ── Tabla — solo muestra proveedores activos ── */}
            <div className="product-list-card">
                <div className="table-info">
                    Lista de Proveedores
                    <p className="product-count">
                        Mostrando {filteredSuppliers.length} de {activeSuppliers.length} proveedores activos
                    </p>
                </div>

                {isLoading ? (
                    <p className="loading-message">Cargando proveedores...</p>
                ) : error ? (
                    <div className="error-message api-error">{error}</div>
                ) : filteredSuppliers.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>NIT</th>
                            <th>Teléfono</th>
                            <th>Correo electrónico</th>
                            <th>Productos</th>
                            <th>Estado</th>
                            {isAdmin && <th>Acciones</th>}
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedSuppliers.map(supplier => (
                            <tr key={supplier.id}>
                                <td><strong>{supplier.name}</strong></td>
                                <td style={{ color: '#6B7280' }}>{supplier.nit || '—'}</td>
                                <td>{supplier.phone || '—'}</td>
                                <td style={{ color: '#3B82F6' }}>{supplier.email || '—'}</td>
                                <td>
                                        <span className={supplier.productCount > 0 ? 'supplier-prod-badge' : 'supplier-prod-empty'}>
                                            {supplier.productCount} producto(s)
                                        </span>
                                </td>
                                <td>
                                        <span className={supplier.active ? 'supplier-active-badge' : 'supplier-inactive-badge'}>
                                            {supplier.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                </td>
                                {isAdmin && (
                                    <td className="actions-cell">
                                        <button
                                            className="icon-button edit-button"
                                            onClick={() => handleEdit(supplier)}
                                            title="Editar"
                                        >
                                            <FontAwesomeIcon icon={faPencilAlt} />
                                        </button>
                                        {supplier.active && (
                                            <button
                                                className="icon-button delete-button-red"
                                                onClick={() => handleDeactivate(supplier)}
                                                title="Desactivar"
                                            >
                                                <FontAwesomeIcon icon={faTimesCircle} />
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No se encontraron proveedores.</p>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredSuppliers.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onSizeChange={setPageSize}
                />
            </div>

            {/* ── Modal: formulario crear / editar ── */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <SupplierForm
                        currentSupplier={currentSupplier}
                        onSave={handleSaved}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            {/* ── Modal: confirmar desactivación ── */}
            {supplierToDeactivate && (
                <div className="modal-backdrop">
                    <div className="custom-modal delete-modal">
                        <div className="modal-content">
                            <h3>¿Desactivar Proveedor?</h3>
                            <p>
                                El proveedor <strong>{supplierToDeactivate.name}</strong> dejará de aparecer
                                en los listados activos, pero su información se conservará en el sistema.
                                Puedes restaurarlo desde la Papelera.
                            </p>
                            {deactivateError && (
                                <div style={{
                                    marginBottom: 12, padding: '8px 12px',
                                    background: '#FEF2F2', borderRadius: 6,
                                    color: '#B91C1C', fontSize: '0.85rem'
                                }}>
                                    {deactivateError}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="cancel-button" onClick={() => setSupplierToDeactivate(null)}>
                                    Cancelar
                                </button>
                                <button className="delete-button-red" onClick={confirmDeactivate}>
                                    Desactivar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SupplierList;