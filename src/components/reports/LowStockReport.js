import React, { useState, useEffect, useCallback } from 'react';
import ReportService from '../../services/reportService';
import Table  from '../common/Table';
import Button from '../common/Button';

import { exportToCsv } from '../../utils/exportUtils';

const LowStockReport = ({ setLowStockCount }) => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const DangerText = ({ value }) => (
        <span className="text-danger">{value}</span>
    );

    // Definición de las columnas de la tabla
    const columns = [
        { header: 'ID', accessor: 'productId' },
        { header: 'Nombre', accessor: 'productName' },
        { header: 'Almacén', accessor: 'warehouseName' },
        {
            header: 'Stock Actual',
            accessor: 'currentStock',
            render: (item) => <DangerText value={item.currentStock} />
        },
        {
            header: 'Stock Mínimo',
            accessor: 'minimumStock',
            render: (item) => <DangerText value={item.minimumStock} />
        },
    ];

    // Estabilizamos la función de carga con useCallback
    const fetchLowStockData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getLowStockReport();
            const data = response.data;

            setLowStockProducts(data);

            if (setLowStockCount) {
                setLowStockCount(data.length);
            }

        } catch (err) {
            console.error("Error al cargar reporte de Stock Bajo:", err);
            setError("No se pudo cargar el reporte de Stock Bajo. Intente nuevamente.");
            if (setLowStockCount) {
                setLowStockCount(0);
            }
        } finally {
            setLoading(false);
        }
    }, [setLowStockCount]);

    useEffect(() => {
        fetchLowStockData();
    }, [fetchLowStockData]);

    if (loading) {
        return <div className="loading-message">Cargando productos con stock bajo...</div>;
    }

    if (error) {
        return <div className="error-message alert alert-danger">{error}</div>;
    }

    const handleExport = () => {
        // Definir las cabeceras y los campos de los datos (accessors)
        const headers = ['ID Producto', 'Nombre Producto', 'Stock Actual', 'Stock Minimo', 'Almacen'];
        const fields = ['productId', 'productName', 'currentStock', 'minimumStock', 'warehouseName'];

        exportToCsv(headers, fields, lowStockProducts, 'Reporte_Stock_Bajo');
    };

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

                {/* Botón Exportar CSV */}
                <div className="report-header-actions">
                    <Button className="btn-export" onClick={handleExport}>
                        <i className="fas fa-download"></i> Exportar CSV
                    </Button>
                </div>
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}
            {lowStockProducts.length === 0 ? (
                <div className="alert alert-success mt-4">
                    <p><strong>¡Excelente!</strong> No hay productos con stock bajo en este momento.</p>
                </div>
            ) : (
                <Table
                    data={lowStockProducts}
                    columns={columns}
                />
            )}
        </div>
    );
};

export default LowStockReport;