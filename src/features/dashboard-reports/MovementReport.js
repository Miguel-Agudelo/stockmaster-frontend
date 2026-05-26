import { showToast } from '../../core/utils/exportUtils';
import React, { useState, useEffect, useCallback } from 'react';
import ReportService from './reportService';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';

import {
    exportToCsv,
    downloadExcelFromBackend,
    exportMovementsToPdf,
} from '../../core/utils/exportUtils';

// ── Helpers ─────────────────────────────────────────────────────────────────

const getISODate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
};

const formatTableDateTime = (isoDateTime) => {
    if (!isoDateTime) return '';
    try {
        const date = new Date(isoDateTime);
        const datePart = date.toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const timePart = date.toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });
        return `${datePart} ${timePart}`;
    } catch {
        return isoDateTime;
    }
};

const renderMovementBadge = (type) => {
    const isExit = type === 'SALIDA';
    return (
        <span className={`badge-movement ${isExit ? 'badge-movement-danger' : 'badge-movement-success'}`}>
            {isExit ? 'Salida' : 'Entrada'}
        </span>
    );
};

const getDatesForInitialLoad = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { start: getISODate(thirtyDaysAgo), end: getISODate(today) };
};

const initialDates = getDatesForInitialLoad();

// ── Componente ───────────────────────────────────────────────────────────────

const MovementReport = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startDate, setStartDate] = useState(initialDates.start);
    const [endDate, setEndDate] = useState(initialDates.end);
    const [exportingExcel, setExportingExcel] = useState(false);

    const columns = [
        {
            header: 'Fecha',
            accessor: 'movementDate',
            render: (item) => formatTableDateTime(item.movementDate),
        },
        { header: 'Producto', accessor: 'productName' },
        {
            header: 'Tipo',
            accessor: 'movementType',
            render: (item) => renderMovementBadge(item.movementType),
        },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            render: (item) => {
                const isExit = item.movementType === 'SALIDA';
                return (
                    <span className={isExit ? 'text-danger' : 'text-success'}>
                        {isExit ? '-' : '+'}{item.quantity}
                    </span>
                );
            },
        },
        { header: 'Almacén', accessor: 'warehouseName' },
        { header: 'Usuario',  accessor: 'userName' },
    ];

    const fetchMovementsData = useCallback(async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getMovementReportByDate(start, end);
            setMovements(response.data);
        } catch (err) {
            console.error('Error al cargar reporte de Movimientos:', err);
            setError('No se pudo cargar el reporte de Movimientos. Verifique el rango y la conexión.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMovementsData(initialDates.start, initialDates.end);
    }, [fetchMovementsData]);

    const handleApplyFilter = (e) => {
        e.preventDefault();
        if (startDate && endDate) {
            fetchMovementsData(startDate, endDate);
        } else {
            setError('Por favor, seleccione ambas fechas para filtrar.');
        }
    };

    const handleDateChange = (setter) => (e) => {
        setter(e.target.value || null);
    };

    const handleClearFilters = () => {
        const newDates = getDatesForInitialLoad();
        setStartDate(newDates.start);
        setEndDate(newDates.end);
        fetchMovementsData(newDates.start, newDates.end);
    };

    // ── Exportar CSV (respeta filtro de fechas aplicado) ────────────────────
    const handleExportCsv = () => {
        if (!movements || movements.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportToCsv(
            ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Almacén', 'Usuario'],
            ['movementDate', 'productName', 'movementType', 'quantity', 'warehouseName', 'userName'],
            movements,
            'Reporte_Movimientos'
        );
    };

    // ── Exportar Excel (respeta filtro de fechas aplicado) ──────────────────
    const handleExportExcel = async () => {
        if (!movements || movements.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        setExportingExcel(true);
        try {
            await downloadExcelFromBackend(
                ReportService.exportMovementsExcel(startDate, endDate),
                'Reporte_Movimientos'
            );
        } finally {
            setExportingExcel(false);
        }
    };

    // ── Exportar PDF (respeta filtro de fechas aplicado) ────────────────────
    const handleExportPdf = () => {
        if (!movements || movements.length === 0) {
            showToast('No hay datos disponibles para exportar.');
            return;
        }
        exportMovementsToPdf(movements, startDate, endDate);
    };

    return (
        <div className="report-movement">
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        <i className="fas fa-calendar-alt icon-info"></i> Reporte de Movimientos
                    </h4>
                    <p className="report-subtitle">
                        Historial de entradas y salidas por rango de fechas
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

            {/* Formulario de filtros */}
            <form onSubmit={handleApplyFilter} className="date-filter-form">
                <div className="filter-controls">
                    <div className="input-group">
                        <label className="input-label">Desde</label>
                        <Input
                            type="date"
                            value={startDate || ''}
                            onChange={handleDateChange(setStartDate)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Hasta</label>
                        <Input
                            type="date"
                            value={endDate || ''}
                            onChange={handleDateChange(setEndDate)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary filter-button" disabled={loading}>
                        Aplicar Filtro
                    </button>
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="btn btn-outline-secondary filter-button clean-filter-button"
                        disabled={loading}
                    >
                        Limpiar Filtros
                    </button>
                </div>
            </form>

            {/* Contenido del reporte */}
            {loading && <div className="loading-message">Cargando movimientos...</div>}
            {error   && <div className="error-message alert alert-danger">{error}</div>}

            {!loading && !error && (
                <>
                    {movements.length > 0 ? (
                        <Table data={movements} columns={columns} />
                    ) : (
                        <div className="alert alert-info mt-4">
                            No se encontraron movimientos para el rango seleccionado.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MovementReport;
