import React, { useState, useEffect, useCallback } from 'react';
import ReportService from '../../services/reportService';
import Table from '../common/Table';
import Input from '../common/Input';

import { exportToCsv } from '../../utils/exportUtils';

// Función utilitaria para formatear la fecha a 'YYYY-MM-DD'
const getISODate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
}

// Formato de fecha y hora de la tabla (DD/MM/AAAA HH:MM)
const formatTableDateTime = (isoDateTime) => {
    if (!isoDateTime) return '';
    try {
        const date = new Date(isoDateTime);
        // Formato DD/MM/AAAA
        const datePart = date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        // Formato HH:MM
        const timePart = date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Formato 24 horas
        });
        return `${datePart} ${timePart}`;
    } catch (e) {
        return isoDateTime; // Fallback
    }
}

// Renderizado de la insignia de Tipo de Movimiento
const renderMovementBadge = (type) => {
    const isExit = type === 'SALIDA';
    const className = isExit ? 'badge-movement-danger' : 'badge-movement-success';
    const displayType = isExit ? 'Salida' : 'Entrada';
    return (
        <span className={`badge-movement ${className}`}>
            {displayType}
        </span>
    );
};


// FUNCIÓN HELPER PARA OBTENER FECHAS POR DEFECTO
const getDatesForInitialLoad = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
        start: getISODate(thirtyDaysAgo),
        end: getISODate(today)
    };
};
const initialDates = getDatesForInitialLoad();


const MovementReport = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [startDate, setStartDate] = useState(initialDates.start);
    const [endDate, setEndDate] = useState(initialDates.end);


    // Definición de las columnas de la tabla
    const columns = [
        {
            header: 'Fecha',
            accessor: 'movementDate',
            // Formato de Fecha/Hora
            render: (item) => formatTableDateTime(item.movementDate)
        },
        { header: 'Producto', accessor: 'productName' },
        {
            header: 'Tipo',
            accessor: 'movementType',
            render: (item) => renderMovementBadge(item.movementType)
        },
        {
            header: 'Cantidad',
            accessor: 'quantity',

            render: (item) => {
                const isExit = item.movementType === 'SALIDA';
                const sign = isExit ? '-' : '+';
                const className = isExit ? 'text-danger' : 'text-success';
                return (
                    <span className={className}>
                        {sign}{item.quantity}
                    </span>
                );
            }
        },
        { header: 'Almacén', accessor: 'warehouseName' },
        { header: 'Usuario', accessor: 'userName' },
    ];


    const fetchMovementsData = useCallback(async (start, end) => {
        setLoading(true);
        setError(null);
        try {
            const response = await ReportService.getMovementReportByDate(start, end);
            setMovements(response.data);

        } catch (err) {
            console.error("Error al cargar reporte de Movimientos:", err);
            setError("No se pudo cargar el reporte de Movimientos. Verifique el rango y la conexión.");
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
            setError("Por favor, seleccione ambas fechas para filtrar.");
        }
    };

    const handleDateChange = (setter) => (e) => {
        const dateValue = e.target.value;
        if (dateValue) {
            setter(dateValue);
        } else {
            setter(null);
        }
    };

    // Función extra para limpiar los filtros
    const handleClearFilters = () => {
        // Restauramos al rango inicial y volvemos a cargar
        const newInitialDates = getDatesForInitialLoad();
        setStartDate(newInitialDates.start);
        setEndDate(newInitialDates.end);
        fetchMovementsData(newInitialDates.start, newInitialDates.end);
    };


    const handleExport = () => {
        // Definir las cabeceras y los campos de los datos (accessors)
        const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Almacen', 'Usuario'];
        const fields = ['movementDate', 'productName', 'movementType', 'quantity', 'warehouseName', 'userName'];

        // Llamar a la función genérica
        exportToCsv(headers, fields, movements, 'Reporte_Movimientos');
    };

    return (
        <div className="report-movement">
            <div className="report-header-section">
                <div className="report-title-container">
                    <h4 className="report-title-section">
                        {/* Icono y texto de la imagen */}
                        <i className="fas fa-calendar-alt icon-info"></i> Reporte de Movimientos
                    </h4>
                    <p className="report-subtitle">
                        Historial de entradas y salidas por rango de fechas
                    </p>
                </div>
                {/* Botón Exportar CSV (asumo que usas un componente Button simple o un <a>) */}
                <div className="report-header-actions">
                    <button className="btn-export" onClick={handleExport}>
                        <i className="fas fa-download"></i> Exportar CSV
                    </button>
                </div>
            </div>

            {/* --- Formulario de Filtros --- */}
            <form onSubmit={handleApplyFilter} className="date-filter-form">
                <div className="filter-controls">
                    {/* Campos de fecha */}
                    <div className="input-group">
                        <label className="input-label">Desde</label>
                        <Input
                            type="date"
                            placeholder="dd/mm/aaaa"
                            value={startDate || ''}
                            onChange={handleDateChange(setStartDate)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Hasta</label>
                        <Input
                            type="date"
                            placeholder="dd/mm/aaaa"
                            value={endDate || ''}
                            onChange={handleDateChange(setEndDate)}
                            required
                        />
                    </div>

                    {/* Botones de acción */}
                    <button type="submit" className="btn btn-primary filter-button" disabled={loading}>
                        Aplicar Filtro
                    </button>
                    {/* Botón Limpiar Filtros */}
                    <button type="button" onClick={handleClearFilters} className="btn btn-outline-secondary filter-button clean-filter-button" disabled={loading}>
                        Limpiar Filtros
                    </button>
                </div>
            </form>

            {/* --- Contenido del Reporte --- */}
            {loading && <div className="loading-message">Cargando movimientos...</div>}
            {error && <div className="error-message alert alert-danger">{error}</div>}

            {!loading && !error && (
                <>
                    {movements.length > 0 ? (
                        <Table
                            data={movements}
                            columns={columns}
                        />
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