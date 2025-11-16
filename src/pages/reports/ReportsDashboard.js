import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

import LowStockReport from '../../components/reports/LowStockReport';
import MovementReport from '../../components/reports/MovementReport';
import TopSellingReport from '../../components/reports/TopSellingReport';

import reportService from '../../services/reportService';
import dashboardService from '../../services/dashboardService';
import authService from '../../services/authService';
import '../../components/reports/Reports.css';

const LowStockAlert = ({ count }) => {
    if (count === 0) return null;
    const message = count === 1
        ? '1 producto tiene stock por debajo del umbral mínimo.'
        : `${count} productos tienen stock por debajo del umbral mínimo.`;

    // Usamos la clase 'low-stock-banner' del Dashboard
    return (
        <div className="alert alert-warning low-stock-banner">
            <FontAwesomeIcon icon={faBell} style={{ marginRight: '10px' }} />
            Alerta de Stock Bajo: {message}
        </div>
    );
};

// Componente: SummaryCard (Formato de valores)
/**
 * Componente reutilizable para las tarjetas de resumen
 */
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
                {/* Muestra el valor formateado */}
                <h2 className="card-value"style={cardValueStyle}>{displayValue}</h2>
            </div>
            <i className={`card-icon fas ${iconClass}`}></i>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL MODIFICADO ---

const ReportsDashboard = () => {
    // 1. Estado para manejar la pestaña activa: 'lowStock', 'movements', 'topSelling'
    const [activeTab, setActiveTab] = useState('lowStock');

    // 2. Estado para los datos unificados
    const [pageData, setPageData] = useState({
        // Datos del Dashboard
        userName: 'Usuario',
        date: new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        lowStockCount: 0, // Para la alerta superior

        // Datos de Reportes (tarjetas de resumen)
        lowStockReportCount: 0, // Para la tarjeta de resumen
        totalMovements: 0,
        // Eliminado: totalSold
        totalRevenue: 0.00,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // FUNCIÓN ESTABLE PARA ACTUALIZAR EL CONTADOR DE STOCK BAJO EN EL ESTADO DEL DASHBOARD
    const updateLowStockReportCount = useCallback((count) => {
        // Se usa para la tarjeta de resumen y se asegura que la alerta superior también esté sincronizada.
        setPageData(prev => ({...prev, lowStockReportCount: count, lowStockCount: count}));
    }, []);

    // Función principal para obtener todos los datos
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // 1. OBTENER NOMBRE DEL USUARIO DESDE AUTHSERVICE
                const currentUser = authService.getCurrentUser();
                const currentUserName = currentUser ? currentUser.name : 'Usuario';

                // 2. Obtener datos del Dashboard (Alertas, Reportes)
                const {
                    lowStockCount: rawLowStockCount,
                    totalMovements: rawTotalMovements
                } = await dashboardService.getDashboardSummary();

                // Aseguramos que los valores sean numéricos (0 si son null, undefined o NaN)
                const lowStockCount = Number(rawLowStockCount) || 0;
                const totalMovements = Number(rawTotalMovements) || 0;

                // 3. Obtener el Reporte de Más Vendidos para calcular Ingresos
                const topSellingResponse = await reportService.getTopSellingReport();

                // Calcular Ingresos Totales (siempre seguro contra null)
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

    // Función para renderizar el contenido según la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'lowStock':
                return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
            case 'movements':
                return <MovementReport />;
            case 'topSelling':
                return <TopSellingReport />;
            default:
                return <LowStockReport setLowStockCount={updateLowStockReportCount} />;
        }
    };

    if (loading) {
        return <div className="main-content">Cargando Panel de Control y Reportes...</div>;
    }

    return (
        <div className="main-content">
            {/* 1. MENSAJE DE PANEL DE CONTROL Y DÍA ACTUALIZADO */}
            <header className="dashboard-header">
                <h1>Bienvenido, {pageData.userName}</h1>
                <p className="dashboard-date">Panel de control - {pageData.date}</p>
            </header>

            {/* 2. ALERTA DE STOCK BAJO */}
            <LowStockAlert count={pageData.lowStockCount} />

            <h2 className="report-title-header">Reportes</h2>
            <p className="subtitle">Análisis e informes del sistema de inventario</p>

            {/* Tarjetas de Resumen */}
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

            {/* Navegación por Pestañas */}
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
            </div>

            {/* Contenido Dinámico del Reporte */}
            <div className="report-content-area">
                {error ? <p className="error-message">{error}</p> : renderContent()}
            </div>
        </div>
    );
};

export default ReportsDashboard;