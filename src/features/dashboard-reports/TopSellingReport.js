import { showToast } from '../../core/utils/exportUtils';
import React, { useState, useEffect, useCallback } from 'react';
import ReportService from './reportService';
import Table from '../../components/ui/Table';

import {
    exportToCsv,
    downloadExcelFromBackend,
    exportTopSellingToPdf,
} from '../../core/utils/exportUtils';

const TopSellingReport = () => {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportingExcel, setExportingExcel] = useState(false);

    const renderPosition = (index) => {
        const position = index + 1;
        const className = position <= 10
            ? `badge-ranking badge-ranking-${position}`
            : 'badge-ranking badge-ranking-default';

        return (
            <span className={className}>
            #{position}
        </span>
        );
    };

    const columns = [
        {
            header: 'Posición',
            accessor: 'position',
            render: (item, index) => renderPosition(index),
        },
        { header: 'Producto', accessor: 'productName' },
        {
            header: 'Unidades Vendidas',
            accessor: 'unitsSold',
            render: (item) => (
                <span className="text-success">{item.unitsSold} unidades</span>
            ),
        },
        {
            header: 'Ingresos Generados',
            accessor: 'totalRevenue',
            render: (item) => (
                <span className="text-success">
                    ${item.totalRevenue ? item.totalRevenue.toFixed(2) : '0.00'}
                </span>
            ),
        },
        {
            header: 'Precio Promedio',
            accessor: 'averagePrice',
            render: (item) => {
                const avg = item.averagePrice ||
                    (item.unitsSold > 0 ? item.totalRevenue / item.unitsSold : 0);
                return `$${isFinite(avg) ? avg.toFixed(2) : '0.00'}`;
            },
        },
    ];

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getTopSellingReport();
            setReportData(response.data);
        } catch (err) {
            console.error('Error al cargar reporte de Más Vendidos:', err);
            setError('No se pudo cargar el reporte de productos más vendidos. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    // ── Exportar CSV ────────────────────────────────────────────────────────
    const handleExportCsv = () => {
        if (!reportData || reportData.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportToCsv(
            ['ID Producto', 'Nombre Producto', 'Unidades Vendidas', 'Ingresos Generados', 'Precio Promedio'],
            ['productId', 'productName', 'unitsSold', 'totalRevenue', 'averagePrice'],
            reportData,
            'Reporte_Mas_Vendidos'
        );
    };

    // ── Exportar Excel ──────────────────────────────────────────────────────
    const handleExportExcel = async () => {
        if (!reportData || reportData.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        setExportingExcel(true);
        try {
            await downloadExcelFromBackend(
                ReportService.exportTopSellingExcel(),
                'Reporte_Mas_Vendidos'
            );
        } finally {
            setExportingExcel(false);
        }
    };

    // ── Exportar PDF ────────────────────────────────────────────────────────
    const handleExportPdf = () => {
        if (!reportData || reportData.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportTopSellingToPdf(reportData);
    };

    if (loading) {
        return <div className="loading-message">Generando ranking de ventas...</div>;
    }

    if (error) {
        return <div className="error-message alert alert-danger">{error}</div>;
    }

    return (
        <div className="report-top-selling">
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        <i className="fas fa-chart-line icon-success"></i> Productos Más Vendidos
                    </h4>
                    <p className="report-subtitle">
                        Ranking de productos por cantidad vendida e ingresos generados
                    </p>
                </div>

                {/* Botones de exportación */}
                <div className="report-header-actions export-buttons-group">
                    <button className="btn-export btn-export-csv" onClick={handleExportCsv}>
                        <i className="fas fa-file-csv"></i> CSV
                    </button>
                    <button
                        className="btn-export btn-export-excel"
                        onClick={handleExportExcel}
                        disabled={exportingExcel}
                    >
                        <i className="fas fa-file-excel"></i>
                        {exportingExcel ? ' Generando...' : ' Excel'}
                    </button>
                    <button className="btn-export btn-export-pdf" onClick={handleExportPdf}>
                        <i className="fas fa-file-pdf"></i> PDF
                    </button>
                </div>
            </div>

            {/* Contenido dinámico */}
            {reportData.length === 0 ? (
                <div className="alert alert-info mt-4">
                    <p>No hay datos suficientes para generar el ranking de productos más vendidos.</p>
                </div>
            ) : (
                <Table data={reportData} columns={columns} />
            )}
        </div>
    );
};

export default TopSellingReport;
