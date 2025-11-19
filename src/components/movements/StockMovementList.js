import React, { useState, useEffect } from 'react';
import stockMovementService from '../../services/stockMovementService';
import { Table } from '../../components/common/Table';
import '../../pages/movements/StockMovementList.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Formato 24 horas
    };

    return new Date(dateString).toLocaleTimeString('es-ES', options).replace(',', '');
};


const StockMovementList = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Definición de las columnas de la tabla de movimientos
    const columns = [
        {
            header: 'Fecha',
            accessor: 'movementDate',
            render: (item) => formatDate(item.movementDate)
        },
        {
            header: 'Tipo de Movimiento',
            accessor: 'movementType',
            render: (item) => (
                <span className={`badge ${item.movementType === 'ENTRADA' ? 'badge-success' : 'badge-danger'}`}>
                    {item.movementType}
                </span>
            )
        },
        { header: 'Producto', accessor: 'productName' },
        { header: 'Almacén', accessor: 'warehouseName' },
        {
            header: 'Cantidad',
            accessor: 'quantity',
            render: (item) => {
                const sign = item.movementType === 'ENTRADA' ? '+' : '-';
                return `${sign}${item.quantity}`;
            }
        },
        {
            header: 'Motivo',
            accessor: 'motive',
            render: (item) => {
                // Muestra el motivo si existe, o la referencia de transferencia si es parte de un par de movimientos
                if (item.motive) {
                    return item.motive;
                }

                if (item.transferReference) {
                    return `Transferencia (Ref: ${item.transferReference.substring(0, 8)}...)`;
                }
                return '-';
            }
        },
        { header: 'Usuario', accessor: 'userName' },
    ];

    // 2. Función de carga de datos
    const fetchMovements = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await stockMovementService.getMovementHistory();
            setMovements(response.data);

        } catch (err) {
            console.error("Error al cargar movimientos:", err);
            const msg = err.response?.status === 403
                ? "Acceso denegado. No tiene permisos para ver el historial."
                : "Error al cargar el historial de movimientos.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // 3. Efecto para cargar datos al montar
    useEffect(() => {
        fetchMovements();
    }, []);

    return (
        <div className="stock-movement-list-page">
            <h2>Historial de Movimientos</h2>
            <p className="subtitle">Visualización completa de todas las entradas y salidas de inventario.</p>

            {loading && <div className="loading-message">Cargando historial...</div>}
            {error && <div className="error-message alert alert-danger">{error}</div>}

            {!loading && !error && (
                <>
                    {movements.length === 0 ? (
                        <div className="alert alert-info">
                            No se ha registrado ningún movimiento de inventario.
                        </div>
                    ) : (
                        <div className="movement-list-container">
                            <Table
                                data={movements}
                                columns={columns}
                                title={`Historial de Movimientos (${movements.length} movimientos)`}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StockMovementList;