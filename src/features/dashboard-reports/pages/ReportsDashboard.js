import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import LowStockReport            from '../LowStockReport';
import MovementReport            from '../MovementReport';
import TopSellingReport          from '../TopSellingReport';
import SupplierTraceabilityReport from '../SupplierTraceabilityReport';
import InventoryDashboard        from '../InventoryDashboard';

import reportService    from '../reportService';
import dashboardService from '../dashboardService';
import authService      from '../../auth/authService';
import '../reports.css';

const LowStockAlert = ({ count }) => {
    if (count === 0) return null;
    const msg = count === 1
        ? '1 producto tiene stock por debajo del umbral mínimo.'
        : `${count} productos tienen stock por debajo del umbral mínimo.`;
    return (
        <div className="alert alert-warning low-stock-banner">
            <FontAwesomeIcon icon={faBell} style={{ marginRight: '10px' }} />
            Alerta de Stock Bajo: {msg}
        </div>
    );
};

const ReportsDashboard = () => {
    const [activeTab, setActiveTab] = useState('lowStock');
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);

    const [pageData, setPageData] = useState({
        userName: 'Usuario',
        date: new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }),
        lowStockCount:        0,
        lowStockReportCount:  0,
        totalMovements:       0,
        totalRevenue:         0,
        warehouseStockChart:  [],
        categoryStockChart:   [],
        totalInventoryValue:  0,
        movimientosMensuales: [],
        topProductosByStock:  [],
    });

    const updateLowStockReportCount = useCallback((count) => {
        setPageData(prev => ({ ...prev, lowStockReportCount: count, lowStockCount: count }));
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const currentUser     = authService.getCurrentUser();
                const currentUserName = currentUser ? currentUser.name : 'Usuario';

                const summaryData = await dashboardService.getDashboardSummary();
                const {
                    lowStockCount: rawLowStock,
                    totalMovements: rawTotalMov,
                    warehouseStockChart,
                    categoryStockChart,
                    totalInventoryValue,
                    movimientosMensuales,
                    topProductosByStock,
                } = summaryData;

                const topSellingResponse = await reportService.getTopSellingReport();
                const reportRevenue = topSellingResponse.data.reduce(
                    (sum, item) => sum + (Number(item.totalRevenue) || 0), 0
                );

                setPageData(prev => ({
                    ...prev,
                    userName:             currentUserName,
                    lowStockCount:        Number(rawLowStock)  || 0,
                    lowStockReportCount:  Number(rawLowStock)  || 0,
                    totalMovements:       Number(rawTotalMov)  || 0,
                    totalRevenue:         reportRevenue,
                    warehouseStockChart:  warehouseStockChart  || [],
                    categoryStockChart:   categoryStockChart   || [],
                    totalInventoryValue:  Number(totalInventoryValue) || 0,
                    movimientosMensuales: movimientosMensuales || [],
                    topProductosByStock:  topProductosByStock  || [],
                }));

            } catch (err) {
                console.error('Error al cargar datos:', err);
                setError('Error al cargar datos del Dashboard/Reportes.');
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case 'lowStock':           return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
            case 'movements':          return <MovementReport />;
            case 'topSelling':         return <TopSellingReport />;
            case 'supplierTraceability': return <SupplierTraceabilityReport />;
            default:                   return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
        }
    };

    if (loading) return <div className="main-content">Cargando Panel de Control y Reportes...</div>;

    return (
        <div className="main-content">

            <header className="dashboard-header">
                <h1>Bienvenido, {pageData.userName}</h1>
                <p className="dashboard-date">Panel de control - {pageData.date}</p>
            </header>

            <LowStockAlert count={pageData.lowStockCount} />

            <InventoryDashboard
                warehouseStockChart  = {pageData.warehouseStockChart}
                categoryStockChart   = {pageData.categoryStockChart}
                totalInventoryValue  = {pageData.totalInventoryValue}
                totalRevenue         = {pageData.totalRevenue}
                lowStockCount        = {pageData.lowStockCount}
                totalMovements       = {pageData.totalMovements}
                movimientosMensuales = {pageData.movimientosMensuales}
                topProductosByStock  = {pageData.topProductosByStock}
            />

            <h2 className="report-title-header">Reportes</h2>
            <p className="subtitle">Análisis e informes del sistema de inventario</p>



            <div className="tabs-container">
                {[
                    { key: 'lowStock',             label: 'Stock Bajo' },
                    { key: 'movements',            label: 'Movimientos' },
                    { key: 'topSelling',           label: 'Más Vendidos' },
                    { key: 'supplierTraceability', label: 'Trazabilidad Proveedor' },
                ].map(t => (
                    <button key={t.key}
                            className={`tab-button ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                    >{t.label}</button>
                ))}
            </div>

            <div className="report-content-area">
                {error ? <p className="error-message">{error}</p> : renderContent()}
            </div>

        </div>
    );
};

export default ReportsDashboard;