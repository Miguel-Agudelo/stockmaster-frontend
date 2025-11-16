import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import warehouseService from '../../services/warehouseService';
import WarehouseForm from '../../components/warehouses/WarehouseForm';
import './WarehousesView.css';
import {
    faTrashRestore,
    faPlus
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const ADMIN_ROLE = 'ADMINISTRADOR';

// Componente Toast para la notificación de error
const Toast = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Ocultar después de 5 segundos
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className={`toast-notification ${isVisible ? 'show' : ''}`} style={{ backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda' }}>
            {message}
        </div>
    );
};


const SummaryCard = ({ title, value, colorClass }) => {

    const formatValue = (val) => {
        return val.toLocaleString('es-CO');
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


const WarehousesView = ({ userRole }) => {
    const navigate = useNavigate();

    const [warehouses, setWarehouses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState(null);

    const [warehouseToDelete, setWarehouseToDelete] = useState(null);
    const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

    const isAdmin = userRole === ADMIN_ROLE;

    const fetchWarehouses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await warehouseService.getAllWarehouses();
            setWarehouses(data);
        } catch (err) {
            setError('Error al cargar la lista de almacenes. Intente de nuevo.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWarehouses();
    }, [fetchWarehouses]);


    // --- Lógica del CRUD y Formularios

    const handleCreateClick = () => { setEditingWarehouse(null); setShowForm(true); };
    const handleEditClick = (warehouse) => { setEditingWarehouse(warehouse); setShowForm(true); };
    const handleFormSave = () => { setShowForm(false); setEditingWarehouse(null); fetchWarehouses(); };
    const handleFormCancel = () => { setShowForm(false); setEditingWarehouse(null); };
    const handleDeleteClick = (warehouse) => { if (isAdmin) setWarehouseToDelete(warehouse); };
    const cancelDeletion = () => { setWarehouseToDelete(null); };
    const showToast = (message, type = 'error') => { setToast({ message, type, isVisible: true }); };

    const confirmDeletion = async () => {
        if (!warehouseToDelete) return;
        const { id: warehouseId, name: warehouseName, totalStock } = warehouseToDelete;

        if (totalStock > 0) {
            showToast("No se puede eliminar un almacén que contiene productos. Vacíe el stock primero.");
            setWarehouseToDelete(null);
            return;
        }

        try {
            await warehouseService.deleteWarehouse(warehouseId);
            showToast(`Almacén "${warehouseName}" eliminado correctamente.`, 'success');
            fetchWarehouses();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error desconocido al intentar eliminar.';
            showToast(`Error: ${errorMessage}`);
        } finally {
            setWarehouseToDelete(null);
        }
    };

    // Lógica de Navegación a Recuperación (Papelera)
    const handleGoToRecovery = () => {
        navigate('/warehouses/recovery');
    };

    // --- Cálculo de Métricas
    const totalWarehouses = warehouses.length;
    const totalProductsCount = warehouses.reduce((acc, wh) => acc + (wh.products?.length || 0), 0);
    const totalStock = warehouses.reduce((acc, wh) => acc + (wh.totalStock || 0), 0);

    const WAREHOUSE_METRICS = [
        { title: "Total Almacenes", value: totalWarehouses, colorClass: "metric-orange" },
        { title: "Productos Almacenados", value: totalProductsCount, colorClass: "metric-green" },
        { title: "Stock Total (Unidades)", value: totalStock, colorClass: "metric-blue" },
    ];


    // --- Renderizado de la Tabla
    const renderWarehouseTable = () => {
        if (isLoading) return <p className="loading-message">Cargando almacenes...</p>;
        if (error) return <p className="error-display">{error}</p>;

        return (
            <div className="data-table-card">
                <div className="table-info">
                    Lista de Almacenes
                    <p className="data-count">{warehouses.length} almacenes registrados en el sistema</p>
                </div>

                {warehouses.length === 0 ? (
                    <p className="no-data">No se encontraron almacenes en la base de datos.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ minWidth: '1100px' }}>
                            <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Ubicación</th>
                                <th>Descripción</th>
                                <th>Productos</th>
                                <th>Stock Total</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {warehouses.map((wh) => (
                                <tr key={wh.id}>
                                    <td>{wh.name}</td>
                                    <td>{`${wh.address}, ${wh.city}`}</td>
                                    <td>{wh.description}</td>

                                    <td>
                                        <span className="stock-badge badge-products">{wh.products?.length || 0} productos</span>
                                    </td>

                                    <td>
                                        <span className="stock-badge badge-stock">{wh.totalStock || 0} unidades</span>
                                    </td>

                                    <td className="actions-cell">
                                        <button className="action-button edit-button" onClick={() => handleEditClick(wh)}>
                                            Editar
                                        </button>
                                        {isAdmin && (
                                            <button className="action-button delete-button" onClick={() => handleDeleteClick(wh)}>
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // Renderizado del Resumen de Stock por Producto
    const renderStockSummary = () => {
        const warehousesWithStock = warehouses.filter(wh => wh.products && wh.products.length > 0);

        if (isLoading) {
            return <div className="loading-message">Cargando resumen de stock...</div>;
        }

        if (warehousesWithStock.length === 0) {
            return (
                <div className="stock-summary-container">
                    <div className="stock-summary-header">Stock Actual por Producto</div>
                    <p className="stock-summary-subtitle">Visualización detallada del inventario.</p>
                    <div className="no-data">Ningún almacén tiene stock activo actualmente.</div>
                </div>
            );
        }

        return (
            <div className="stock-summary-container">
                <div className="stock-summary-header">Stock Actual por Producto</div>
                <p className="stock-summary-subtitle">Visualización detallada del inventario por cada ubicación de almacén.</p>

                <div className="warehouse-stock-grid">
                    {warehousesWithStock.map((warehouse) => (
                        <div key={warehouse.id} className="warehouse-stock-card">
                            <h4>{warehouse.name}</h4>

                            <p className="subtitle">Stock actual por producto</p>

                            <ul className="product-list">
                                {warehouse.products
                                    .filter(p => p.currentStock > 0)
                                    .map((product) => {
                                        const minStock = product.minStock || 0;
                                        const isLowStock = product.currentStock <= minStock;
                                        const badgeClass = isLowStock ? 'low-stock-badge' : 'product-stock-badge';

                                        return (
                                            <li key={product.productId} className="product-item">

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                    <span className="product-name">{product.productName}</span>

                                                    <span className="product-min-stock">
                                                        Mínimo: {minStock}
                                                    </span>
                                                </div>

                                                <span className={badgeClass}>
                                                    {product.currentStock} unidades
                                                </span>
                                            </li>
                                        );
                                    })
                                }

                                {warehouse.products.every(p => p.currentStock === 0) && (
                                    <div className="no-stock-message">Stock vaciado.</div>
                                )}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="main-content">

            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Almacenes</h1>
                    <p className="page-subtitle">Administrar ubicaciones de almacenamiento y stock</p>
                </div>
                {isAdmin && (
                    <div className="action-buttons-group">
                        {/* BOTÓN PAPELERA */}
                        <button className="delete-recovery-button" onClick={handleGoToRecovery}>
                            <FontAwesomeIcon icon={faTrashRestore} />
                            Papelera
                        </button>
                        {/* Botón Nuevo Almacén */}
                        <button className="add-new-button" onClick={handleCreateClick}>
                            <FontAwesomeIcon icon={faPlus} />
                            Nuevo Almacén
                        </button>
                    </div>
                )}
            </div>

            <div className="summary-cards-container">
                {WAREHOUSE_METRICS.map((metric, index) => (
                    <SummaryCard
                        key={index}
                        title={metric.title}
                        value={metric.value}
                        colorClass={metric.colorClass}
                    />
                ))}
            </div>

            {renderWarehouseTable()}
            {renderStockSummary()}

            {/* MODAL DE CREACIÓN/EDICIÓN */}
            {showForm && (
                <div className="modal-backdrop">
                    <WarehouseForm
                        onSave={handleFormSave}
                        onCancel={handleFormCancel}
                        currentWarehouse={editingWarehouse}
                    />
                </div>
            )}

            {/* MODAL DE ELIMINACIÓN */}
            {warehouseToDelete && (
                <div className="modal-backdrop">
                    <div className="custom-modal delete-modal">
                        <div className="modal-content">
                            <h3>¿Eliminar Almacén?</h3>
                            <p>
                                Esta acción es permanente. ¿Está seguro de que desea eliminar el almacén
                                <strong> {warehouseToDelete.name}</strong>?
                                Actualmente tiene <strong>{warehouseToDelete.totalStock || 0}</strong> unidades de stock.
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

            {/* TOAST DE NOTIFICACIÓN */}
            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast({ ...toast, isVisible: false })}
            />
        </div>
    );
};

export default WarehousesView;