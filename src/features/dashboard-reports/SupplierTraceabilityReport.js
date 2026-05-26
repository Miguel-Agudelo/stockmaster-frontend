import { showToast } from '../../core/utils/exportUtils';
import React, { useState, useEffect, useCallback } from 'react';
import ReportService from './reportService';
import supplierService from '../suppliers/supplierService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';

import {
    exportToCsv,
    downloadExcelFromBackend,
    exportSupplierToPdf,
} from '../../core/utils/exportUtils';

// HU-PI2-09 + HU-PI2-05
const SupplierTraceabilityReport = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    const columns = [
        { header: 'Producto',    accessor: 'productName' },
        { header: 'Categoría',   accessor: 'categoryName' },
        { header: 'Stock Total', accessor: 'totalStock' },
        { header: 'Almacén',     accessor: 'warehouseName' },
    ];

    useEffect(() => {
        const fetchSuppliers = async () => {
            setLoadingSuppliers(true);
            try {
                const response = await supplierService.getAllSuppliers();
                setSuppliers(response.data);
            } catch {
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
        } catch {
            setError('No se pudo cargar el reporte de trazabilidad. Intente nuevamente.');
            setReportData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedSupplierId]);

    const selectedSupplierName =
        suppliers.find((s) => String(s.id) === String(selectedSupplierId))?.name || '';

    // ── Exportar CSV ────────────────────────────────────────────────────────
    const handleExportCsv = () => {
        if (!reportData || reportData.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportToCsv(
            ['Producto', 'Categoría', 'Stock Total', 'Almacén'],
            ['productName', 'categoryName', 'totalStock', 'warehouseName'],
            reportData,
            'Reporte_Trazabilidad_Proveedor'
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
                ReportService.exportSupplierTraceabilityExcel(selectedSupplierId, selectedSupplierName),
                'Reporte_Trazabilidad_Proveedor'
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
        exportSupplierToPdf(reportData, selectedSupplierName);
    };

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

                {/* Botones siempre visibles — validan al hacer clic */}
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

            {/* Filtro de proveedor */}
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
                                <option key={s.id} value={s.id}>{s.name}</option>
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
                    <p>
                        No hay información disponible para el proveedor{' '}
                        <strong>{selectedSupplierName}</strong>.
                    </p>
                </div>
            )}

            {!loading && !error && reportData.length > 0 && (
                <Table data={reportData} columns={columns} />
            )}
        </div>
    );
};

export default SupplierTraceabilityReport;
