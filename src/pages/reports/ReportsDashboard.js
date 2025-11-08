import React, { useState, useEffect, useCallback } from 'react';
// Importa los componentes de las pestañas (se asume exportación default)
import LowStockReport from '../../components/reports/LowStockReport';
import MovementReport from '../../components/reports/MovementReport';
import TopSellingReport from '../../components/reports/TopSellingReport';
import ReportService from '../../services/reportService';
import '../../components/reports/Reports.css';

/**
 * Componente reutilizable para las tarjetas de resumen
 */
const SummaryCard = ({ title, value, iconClass, colorClass }) => {

    // FUNCIÓN DE FORMATO: Usamos Intl.NumberFormat para moneda sin decimales
    const formatValue = (val, isMoney) => {
        if (isMoney) {
            // Usa formato local (ej: 'es-CO') para moneda sin decimales para ahorrar espacio
            return new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP', // Asumiendo COP, ajusta si es USD o otra
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(val);
        }
        return val;
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

const ReportsDashboard = () => {
    // 1. Estado para manejar la pestaña activa: 'lowStock', 'movements', 'topSelling'
    const [activeTab, setActiveTab] = useState('lowStock');

    // 2. Estado para los datos de resumen (tarjetas)
    const [summaryData, setSummaryData] = useState({
        lowStock: 0,
        totalMovements: 0,
        totalSold: 0,
        totalRevenue: 0.00,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // FUNCIÓN ESTABLE PARA ACTUALIZAR EL CONTADOR DE STOCK BAJO EN EL ESTADO DEL DASHBOARD
    const updateLowStockCount = useCallback((count) => {
        setSummaryData(prev => ({...prev, lowStock: count}));
    }, [setSummaryData]);

    // Función para calcular los datos de resumen a partir de los reportes
    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // Lógica para obtener las métricas de Ingresos
                const topSellingResponse = await ReportService.getTopSellingReport();
                // Calcula el total de ingresos de todos los ítems vendidos
                const totalRevenue = topSellingResponse.data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);

                setSummaryData(prev => ({
                    ...prev,
                    totalMovements: 2, // Simulado
                    totalSold: 5, // Simulado
                    totalRevenue: totalRevenue,
                }));
            } catch (err) {
                console.error("Error al cargar datos de resumen:", err);
                setError("Error al cargar datos de resumen.");
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
        // Solo se ejecuta al montar el Dashboard
    }, []);

    // Función para renderizar el contenido según la pestaña activa
    const renderContent = () => {
        switch (activeTab) {
            case 'lowStock':
                // PASAMOS LA FUNCIÓN ESTABLE updateLowStockCount AL HIJO
                return <LowStockReport setLowStockCount={updateLowStockCount} />;
            case 'movements':
                return <MovementReport />;
            case 'topSelling':
                return <TopSellingReport />;
            default:
                return <LowStockReport />;
        }
    };

    return (
        <div className="main-content">
            <h2>Reportes</h2>
            <p className="subtitle">Análisis e informes del sistema de inventario</p>

            {/* Tarjetas de Resumen (Mockup Superior) */}
            <div className="summary-cards-container">
                <SummaryCard
                    title="Productos con Stock Bajo"
                    value={summaryData.lowStock}
                    iconClass="fa-exclamation-triangle"
                    colorClass="alert"
                />
                <SummaryCard
                    title="Movimientos Total"
                    value={summaryData.totalMovements}
                    iconClass="fa-exchange-alt"
                    colorClass="info"
                />
                <SummaryCard
                    title="Total Vendido"
                    value={summaryData.totalSold}
                    iconClass="fa-chart-line"
                    colorClass="success"
                />
                <SummaryCard
                    title="Ingresos Totales"
                    value={summaryData.totalRevenue} // 🟢 CORRECCIÓN: Pasamos el valor numérico
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
                {loading ? <p>Cargando reportes...</p> : renderContent()}
            </div>
        </div>
    );
};

export default ReportsDashboard;