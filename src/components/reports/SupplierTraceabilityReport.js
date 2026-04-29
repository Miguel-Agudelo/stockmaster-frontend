import React, { useState, useEffect, useCallback } from 'react';
import ReportService from '../../services/reportService';
import supplierService from '../../services/supplierService';
import Table from '../common/Table';
import Button from '../common/Button';
import { exportToCsv } from '../../utils/exportUtils';

// HU-PI2-09
const SupplierTraceabilityReport = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    const columns = [
        { header: 'Producto', accessor: 'productName' },
        { header: 'Categoría', accessor: 'categoryName' },
        { header: 'Stock Total', accessor: 'totalStock' },
        { header: 'Almacén', accessor: 'warehouseName' },
    ];

    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoadingSuppliers(true);
            try {
                const response = await supplierService.getAllSuppliers();
                setSuppliers(response.data);
            } catch (err) {
                setError('No se pudo cargar la lista de proveedores.');
            } finally {
                setLoadingSuppliers(false);
            }
        };
        fetchSuppliers();
    }, []);

    const fetchReport = useCallback(async () => {
        if (!selectedSupplierId) return;
        setLoading(true);
        setError(null);
        setSearched(true);
        try {
            const response = await ReportService.getSupplierTraceabilityReport(selectedSupplierId);
            setReportData(response.data);
        } catch (err) {
            setError('No se pudo cargar el reporte de trazabilidad. Intente nuevamente.');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedSupplierId]);

    const handleExportCsv = () => {
        const headers = ['Producto', 'Categoría', 'Stock Total', 'Almacén'];
        const fields = ['productName', 'categoryName', 'totalStock', 'warehouseName'];
        exportToCsv(headers, fields, reportData, 'Reporte_Trazabilidad_Proveedor');
    };

    const handleExportExcel = async () => {
        if (!selectedSupplierId) return;
        try {
            const response = await ReportService.exportSupplierTraceabilityExcel(selectedSupplierId);
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', `Trazabilidad_Proveedor_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError('No se pudo generar el archivo Excel. Intente nuevamente.');
        }
    };

    const selectedSupplierName = suppliers.find(s => String(s.id) === String(selectedSupplierId))?.name || '';

    return (
        <div className="report-supplier-traceability">
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        <i className="fas fa-truck icon-info"></i> Reporte de Trazabilidad por Proveedor
                    </h4>
                    <p className="report-subtitle">
                        Productos asociados a cada proveedor con su stock actual y ubicación en almacén.
                    </p>
                </div>

                {searched && reportData.length > 0 && (
                    <div className="report-header-actions" style={{ gap: '8px' }}>
                        <Button className="btn-export" onClick={handleExportCsv}>
                            <i className="fas fa-file-csv"></i> Exportar CSV
                        </Button>
                        <Button className="btn-export" onClick={handleExportExcel}>
                            <i className="fas fa-file-excel"></i> Exportar Excel
                        </Button>
                    </div>
                )}
            </div>

            <div className="date-filter-form">
                <div className="filter-controls">
                    <div className="input-group">
                        <label className="input-label" htmlFor="supplier-select">
                            Seleccionar Proveedor
                        </label>
                        <select
                            id="supplier-select"
                            className="form-select"
                            value={selectedSupplierId}
                            onChange={(e) => {
                                setSelectedSupplierId(e.target.value);
                                setSearched(false);
                                setReportData([]);
                            }}
                            disabled={loadingSuppliers}
                            style={{
                                padding: '8px 10px',
                                border: '1px solid #ced4da',
                                borderRadius: '6px',
                                fontSize: '1rem',
                                color: '#495057',
                                minWidth: '220px',
                            }}
                        >
                            <option value="">-- Seleccione un proveedor --</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        className="filter-button"
                        onClick={fetchReport}
                        disabled={!selectedSupplierId || loading}
                    >
                        <i className="fas fa-search"></i> Consultar
                    </Button>
                </div>
            </div>

            {loading && (
                <div className="loading-message">Cargando reporte de trazabilidad...</div>
            )}

            {error && !loading && (
                <div className="error-message alert alert-danger">{error}</div>
            )}

            {!loading && searched && !error && reportData.length === 0 && (
                <div className="alert alert-info mt-4">
                    <p>No hay información disponible para el proveedor <strong>{selectedSupplierName}</strong>.</p>
                </div>
            )}

            {!loading && !error && reportData.length > 0 && (
                <Table data={reportData} columns={columns} />
            )}
        </div>
    );
};

export default SupplierTraceabilityReport;
