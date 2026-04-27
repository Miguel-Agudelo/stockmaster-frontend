import React, { useState, useEffect } from 'react';
import './ProductChangeLogModal.css';
import productChangeLogService from '../../services/productChangeLogService';
import Spinner from '../common/Spinner';

/**
 * HU-PI2-10 — Modal de historial de cambios de un producto.
 * @param {object}   product  - Producto seleccionado { id, name }
 * @param {function} onClose  - Callback para cerrar el modal
 */
const ProductChangeLogModal = ({ product, onClose }) => {
    const [logs, setLogs]       = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState(null);

    useEffect(() => {
        if (!product?.id) return;
        setLoading(true);
        setError(null);

        productChangeLogService.getChangeLog(product.id)
            .then(res => setLogs(res.data))
            .catch(() => setError('No se pudo cargar el historial de cambios.'))
            .finally(() => setLoading(false));
    }, [product]);

    const formatDateTime = (isoString) => {
        if (!isoString) return '—';
        try {
            return new Date(isoString).toLocaleString('es-CO', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch {
            return isoString;
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="changelog-loading">
                    <Spinner message="Cargando historial..." />
                </div>
            );
        }

        if (error) {
            return <div className="changelog-loading" style={{ color: '#EF4444' }}>{error}</div>;
        }

        if (logs.length === 0) {
            return (
                <div className="changelog-empty">
                    <div className="changelog-empty-icon">📋</div>
                    <p>Este producto no tiene cambios registrados aún.</p>
                    <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                        Los cambios aparecerán aquí cada vez que se edite el producto.
                    </p>
                </div>
            );
        }

        return (
            <table className="changelog-table">
                <thead>
                <tr>
                    <th>Campo</th>
                    <th>Cambio</th>
                    <th>Usuario</th>
                    <th>Fecha y Hora</th>
                </tr>
                </thead>
                <tbody>
                {logs.map(log => (
                    <tr key={log.id}>
                        {/* Campo modificado */}
                        <td>
                            <span className="field-badge">{log.fieldName}</span>
                        </td>

                        {/* Valor anterior → Valor nuevo */}
                        <td>
                            <span className="value-old">{log.oldValue}</span>
                            <span className="value-arrow">→</span>
                            <span className="value-new">{log.newValue}</span>
                        </td>

                        {/* Usuario responsable */}
                        <td>
                            <div className="changelog-user">
                                <span className="changelog-user-dot" />
                                {log.changedByName}
                            </div>
                        </td>

                        {/* Fecha */}
                        <td>
                                <span className="changelog-date">
                                    {formatDateTime(log.changedAt)}
                                </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="changelog-overlay">
            <div className="changelog-modal">

                {/* ── Cabecera ── */}
                <div className="changelog-header">
                    <div className="changelog-header-text">
                        <h3>Historial de Cambios</h3>
                        <p>Producto: <strong>{product?.name}</strong></p>
                    </div>
                    <button className="changelog-close-btn" onClick={onClose}>&times;</button>
                </div>

                {/* ── Cuerpo ── */}
                <div className="changelog-body">
                    {renderContent()}
                </div>

                {/* ── Pie ── */}
                <div className="changelog-footer">
                    <button className="btn-close-log" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default ProductChangeLogModal;