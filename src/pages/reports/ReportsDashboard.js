import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import LowStockReport from '../../components/reports/LowStockReport';
import MovementReport from '../../components/reports/MovementReport';
import TopSellingReport from '../../components/reports/TopSellingReport';
import SupplierTraceabilityReport from '../../components/reports/SupplierTraceabilityReport';

import reportService from '../../services/reportService';
import dashboardService from '../../services/dashboardService';
import authService from '../../services/authService';
import '../../components/reports/Reports.css';

const LowStockAlert = ({ count }) => {
    if (count === 0) return null;
    const message = count === 1
        ? '1 producto tiene stock por debajo del umbral mínimo.'
        : `${count} productos tienen stock por debajo del umbral mínimo.`;

    return (
        <div className="alert alert-warning low-stock-banner">
            <FontAwesomeIcon icon={faBell} style={{ marginRight: '10px' }} />
            Alerta de Stock Bajo: {message}
        </div>
    );
};

const SummaryCard = ({ title, value, iconClass, colorClass }) => {

    const formatValue = (val, isMoney) => {
        if (typeof val !== 'number' || isNaN(val)) {
            val = 0;
        }

        if (isMoney) {
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(val);
        }
        return new Intl.NumberFormat('es-CO').format(val);
    };

    const isMoney = title.includes('Ingresos');
    const displayValue = formatValue(value, isMoney);

    const cardValueStyle = title.includes('Ingresos') ? { fontSize: '1.8rem' } : {};
    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value" style={cardValueStyle}>{displayValue}</h2>
            </div>
            <i className={`card-icon fas ${iconClass}`}></i>
        </div>
    );
};

const ReportsDashboard = () => {
    const [activeTab, setActiveTab] = useState('lowStock');

    const [pageData, setPageData] = useState({
        userName: 'Usuario',
        date: new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        lowStockCount: 0,
        lowStockReportCount: 0,
        totalMovements: 0,
        totalRevenue: 0.00,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const updateLowStockReportCount = useCallback((count) => {
        setPageData(prev => ({ ...prev, lowStockReportCount: count, lowStockCount: count }));
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const currentUser = authService.getCurrentUser();
                const currentUserName = currentUser ? currentUser.name : 'Usuario';

                const {
                    lowStockCount: rawLowStockCount,
                    totalMovements: rawTotalMovements
                } = await dashboardService.getDashboardSummary();

                const lowStockCount = Number(rawLowStockCount) || 0;
                const totalMovements = Number(rawTotalMovements) || 0;

                const topSellingResponse = await reportService.getTopSellingReport();
                const totalRevenue = topSellingResponse.data.reduce((sum, item) => sum + (Number(item.totalRevenue) || 0), 0);

                setPageData(prev => ({
                    ...prev,
                    userName: currentUserName,
                    lowStockCount: lowStockCount,
                    lowStockReportCount: lowStockCount,
                    totalMovements: totalMovements,
                    totalRevenue: totalRevenue,
                }));

            } catch (err) {
                console.error("Error al cargar datos unificados:", err);
                setError("Error al cargar datos del Dashboard/Reportes. Ver consola para más detalles.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'lowStock':
                return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
            case 'movements':
                return <MovementReport />;
            case 'topSelling':
                return <TopSellingReport />;
            case 'supplierTraceability':
                return <SupplierTraceabilityReport />;
            default:
                return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
        }
    };

    if (loading) {
        return <div className="main-content">Cargando Panel de Control y Reportes...</div>;
    }

    return (
        <div className="main-content">
            <header className="dashboard-header">
                <h1>Bienvenido, {pageData.userName}</h1>
                <p className="dashboard-date">Panel de control - {pageData.date}</p>
            </header>

            <LowStockAlert count={pageData.lowStockCount} />

            <h2 className="report-title-header">Reportes</h2>
            <p className="subtitle">Análisis e informes del sistema de inventario</p>

            <div className="summary-cards-container">
                <SummaryCard
                    title="Productos con Stock Bajo"
                    value={pageData.lowStockReportCount}
                    iconClass="fa-exclamation-triangle"
                    colorClass="alert"
                />
                <SummaryCard
                    title="Movimientos Total"
                    value={pageData.totalMovements}
                    iconClass="fa-exchange-alt"
                    colorClass="info"
                />
                <SummaryCard
                    title="Ingresos Totales"
                    value={pageData.totalRevenue}
                    iconClass="fa-dollar-sign"
                    colorClass="success-money"
                />
            </div>

            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === 'lowStock' ? 'active' : ''}`}
                    onClick={() => setActiveTab('lowStock')}
                >
                    Stock Bajo
                </button>
                <button
                    className={`tab-button ${activeTab === 'movements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('movements')}
                >
                    Movimientos
                </button>
                <button
                    className={`tab-button ${activeTab === 'topSelling' ? 'active' : ''}`}
                    onClick={() => setActiveTab('topSelling')}
                >
                    Más Vendidos
                </button>
                <button
                    className={`tab-button ${activeTab === 'supplierTraceability' ? 'active' : ''}`}
                    onClick={() => setActiveTab('supplierTraceability')}
                >
                    Trazabilidad Proveedor
                </button>
            </div>

            <div className="report-content-area">
                {error ? <p className="error-message">{error}</p> : renderContent()}
            </div>
        </div>
    );
};

export default ReportsDashboard;
