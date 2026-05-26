import { showToast } from '../../core/utils/exportUtils';
import React, { useState, useEffect, useCallback } from 'react';
import ReportService from './reportService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';

import {
    exportToCsv,
    downloadExcelFromBackend,
    exportLowStockToPdf,
} from '../../core/utils/exportUtils';

const DangerText = ({ value }) => (
    <span className="text-danger">{value}</span>
);

const LowStockReport = ({ setLowStockCount }) => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [exportingExcel, setExportingExcel] = useState(false);

    const columns = [
        { header: 'ID',           accessor: 'productId' },
        { header: 'Nombre',       accessor: 'productName' },
        { header: 'Almacén',      accessor: 'warehouseName' },
        {
            header: 'Stock Actual',
            accessor: 'currentStock',
            render: (item) => <DangerText value={item.currentStock} />,
        },
        {
            header: 'Stock Mínimo',
            accessor: 'minimumStock',
            render: (item) => <DangerText value={item.minimumStock} />,
        },
    ];

    const fetchLowStockData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getLowStockReport();
            const data = response.data;
            setLowStockProducts(data);
            if (setLowStockCount) setLowStockCount(data.length);
        } catch (err) {
            console.error('Error al cargar reporte de Stock Bajo:', err);
            setError('No se pudo cargar el reporte de Stock Bajo. Intente nuevamente.');
            if (setLowStockCount) setLowStockCount(0);
        } finally {
            setLoading(false);
        }
    }, [setLowStockCount]);

    useEffect(() => {
        fetchLowStockData();
    }, [fetchLowStockData]);

    // ── Exportar CSV ────────────────────────────────────────────────────────
    const handleExportCsv = () => {
        if (!lowStockProducts || lowStockProducts.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportToCsv(
            ['ID Producto', 'Nombre Producto', 'Almacén', 'Stock Actual', 'Stock Mínimo'],
            ['productId', 'productName', 'warehouseName', 'currentStock', 'minimumStock'],
            lowStockProducts,
            'Reporte_Stock_Bajo'
        );
    };

    // ── Exportar Excel ──────────────────────────────────────────────────────
    const handleExportExcel = async () => {
        if (!lowStockProducts || lowStockProducts.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        setExportingExcel(true);
        try {
            await downloadExcelFromBackend(
                ReportService.exportLowStockExcel(),
                'Reporte_Stock_Bajo'
            );
        } finally {
            setExportingExcel(false);
        }
    };

    // ── Exportar PDF ────────────────────────────────────────────────────────
    const handleExportPdf = () => {
        if (!lowStockProducts || lowStockProducts.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportLowStockToPdf(lowStockProducts);
    };

    if (loading) {
        return <div className="loading-message">Cargando productos con stock bajo...</div>;
    }

    if (error) {
        return <div className="error-message alert alert-danger">{error}</div>;
    }

    return (
        <div className="report-low-stock">
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        <i className="fas fa-exclamation-triangle icon-alert"></i> Reporte de Stock Bajo
                    </h4>
                    <p className="report-subtitle">
                        Productos que necesitan reabastecimiento debido a que su stock actual es menor al stock mínimo configurado.
                    </p>
                </div>

                {/* Botones de exportación */}
                <div className="report-header-actions export-buttons-group">
                    <Button className="btn-export btn-export-csv" onClick={handleExportCsv}>
                        <i className="fas fa-file-csv"></i> CSV
                    </Button>
                    <Button
                        className="btn-export btn-export-excel"
                        onClick={handleExportExcel}
                        disabled={exportingExcel}
                    >
                        <i className="fas fa-file-excel"></i>
                        {exportingExcel ? ' Generando...' : ' Excel'}
                    </Button>
                    <Button className="btn-export btn-export-pdf" onClick={handleExportPdf}>
                        <i className="fas fa-file-pdf"></i> PDF
                    </Button>
                </div>
            </div>

            {/* Contenido dinámico */}
            {lowStockProducts.length === 0 ? (
                <div className="alert alert-success mt-4">
                    <p><strong>¡Excelente!</strong> No hay productos con stock bajo en este momento.</p>
                </div>
            ) : (
                <Table data={lowStockProducts} columns={columns} />
            )}
        </div>
    );
};

export default LowStockReport;
