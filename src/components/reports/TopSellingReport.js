import React, { useState, useEffect, useCallback } from 'react';
import ReportService from '../../services/reportService';
import Table  from '../common/Table';
import { exportToCsv } from '../../utils/exportUtils';

const TopSellingReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleExport = () => {
        // Definir las cabeceras y los campos de los datos (accessors)
        const headers = ['ID Producto', 'Nombre Producto', 'Unidades Vendidas', 'Ingresos Generados', 'Precio Promedio'];
        const fields = ['productId', 'productName', 'unitsSold', 'totalRevenue', 'averagePrice'];

        exportToCsv(headers, fields, reportData, 'Reporte_Mas_Vendidos');
    };


    // Función para renderizar el número de posición con el diseño de insignia redonda
    const renderPosition = (index) => {
        const position = index + 1;
        return (
            <span className={`badge-ranking badge-ranking-${position}`}>
                #{position}
            </span>
        );
    };

    // Definición de las columnas de la tabla
    const columns = [
        {
            header: 'Posición',
            accessor: 'position',
            render: (item, index) => renderPosition(index)
        },
        { header: 'Producto', accessor: 'productName' },
        {
            header: 'Unidades Vendidas',
            accessor: 'unitsSold',
            render: (item) => <span className="text-success">{item.unitsSold} unidades</span>
        },
        {
            header: 'Ingresos Generados',
            accessor: 'totalRevenue',
            render: (item) => (
                <span className="text-success">
                    ${item.totalRevenue ? item.totalRevenue.toFixed(2) : '0.00'}
                </span>
            )
        },
        {
            header: 'Precio Promedio',
            accessor: 'averagePrice',
            render: (item) => {
                const avg = item.averagePrice || (item.unitsSold > 0 ? item.totalRevenue / item.unitsSold : 0);
                return `$${isFinite(avg) ? avg.toFixed(2) : '0.00'}`;
            }
        },
    ];

    // Envolvemos fetchReport en useCallback para estabilidad
    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getTopSellingReport();
            setReportData(response.data);
        } catch (err) {
            console.error("Error al cargar reporte de Más Vendidos:", err);
            setError('No se pudo cargar el reporte de productos más vendidos. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    if (loading) {
        return <div className="loading-message">Generando ranking de ventas...</div>;
    }

    if (error) {
        return <div className="error-message alert alert-danger">{error}</div>;
    }

    return (
        <div className="report-top-selling">
            {/* ESTRUCTURA DE ENCABEZADO CON BOTÓN DE EXPORTAR */}
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        <i className="fas fa-chart-line icon-success"></i> Productos Más Vendidos
                    </h4>
                    <p className="report-subtitle">
                        Ranking de productos por cantidad vendida e ingresos generados
                    </p>
                </div>

                {/* Botón Exportar CSV */}
                <div className="report-header-actions">
                    {/* CONECTAR LA FUNCIÓN AL BOTÓN */}
                    <button className="btn-export" onClick={handleExport}>
                        <i className="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            {reportData.length === 0 ? (
                <div className="alert alert-info mt-4">
                    <p>No hay datos suficientes para generar el ranking de productos más vendidos.</p>
                </div>
            ) : (
                <Table
                    data={reportData}
                    columns={columns}
                />
            )}
        </div>
    );
};

export default TopSellingReport;