import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faExclamationTriangle, faCheck, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import alertService from './alertService';
import './LowStockAlertPanel.css';

const LowStockAlertPanel = () => {
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = useCallback(async () => {
        try {
            const data = await alertService.getLowStockAlerts();
            const validDismissed = alertService.syncDismissed(data);
            setDismissed(validDismissed);
            setAlerts(data);
        } catch (err) {
            setAlerts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const handleDismiss = (inventoryId) => {
        alertService.dismissAlert(inventoryId);
        setDismissed(prev => [...prev, inventoryId]);
    };

    const handleDismissAll = () => {
        visibleAlerts.forEach(a => alertService.dismissAlert(a.inventoryId));
        setDismissed(alerts.map(a => a.inventoryId));
        setIsOpen(false);
    };

    const visibleAlerts = alerts.filter(a => !dismissed.includes(a.inventoryId));
    const count = visibleAlerts.length;

    if (loading || alerts.length === 0) return null;

    return (
        <div className="alert-panel-wrapper">
            {/* Botón campana */}
            <button
                className="alert-bell-btn"
                onClick={() => setIsOpen(prev => !prev)}
                title="Alertas de stock crítico"
            >
                <div className="alert-bell-icon-wrapper">
                    <FontAwesomeIcon
                        icon={faBell}
                        className={count > 0 ? 'bell-active' : 'bell-quiet'}
                    />
                    {count > 0 && (
                        <span className="alert-badge">{count}</span>
                    )}
                </div>
                <span className="alert-bell-label">
                    {count > 0
                        ? `${count} alerta${count !== 1 ? 's' : ''} crítica${count !== 1 ? 's' : ''}`
                        : 'Sin alertas críticas'}
                </span>
            </button>

            {/* Panel desplegable */}
            {isOpen && (
                <div className="alert-dropdown">
                    <div className="alert-dropdown-header">
                        <div className="alert-dropdown-title">
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            Stock Crítico
                        </div>
                        <span className="alert-dropdown-count">
                            {count === 0 ? 'Todo visto' : `${count} producto${count !== 1 ? 's' : ''}`}
                        </span>
                    </div>

                    <div className="alert-list">
                        {count === 0 ? (
                            <div className="alert-empty">
                                <FontAwesomeIcon icon={faCheckCircle} />
                                <p>Has revisado todas las alertas.</p>
                            </div>
                        ) : (
                            visibleAlerts.map(alert => (
                                <div key={alert.inventoryId} className="alert-item">
                                    <div className="alert-item-info">
                                        <span className="alert-product-name">{alert.name}</span>
                                        <span className="alert-warehouse">{alert.warehouseName}</span>
                                        <div className="alert-stock-row">
                                            <span className="alert-stock-current">
                                                Stock actual: <strong>{alert.currentStock}</strong>
                                            </span>
                                            <span className="alert-stock-min">
                                                Mínimo: <strong>{alert.minStock}</strong>
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="alert-dismiss-btn"
                                        onClick={() => handleDismiss(alert.inventoryId)}
                                        title="Marcar como visto"
                                    >
                                        <FontAwesomeIcon icon={faCheck} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {count > 0 && (
                        <div className="alert-dropdown-footer">
                            <button className="alert-dismiss-all-btn" onClick={handleDismissAll}>
                                Marcar todo como visto
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LowStockAlertPanel;