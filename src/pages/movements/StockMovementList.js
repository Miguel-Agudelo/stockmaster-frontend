import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Íconos adaptados para movimientos/métricas:
import { faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';

import StockMovementForm from '../../components/movements/StockMovementForm';
import stockMovementService from '../../services/stockMovementService';
import './StockMovementList.css';


const SummaryCard = ({ title, value, colorClass }) => {

    // Función de formato simple para números
    const formatValue = (val) => {
        const numberValue = Number(val);
        if (isNaN(numberValue)) return val;
        return numberValue.toLocaleString('es-CO');
    };

    const displayValue = formatValue(value);

    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value">{displayValue}</h2>
            </div>
        </div>
    );
};


const StockMovementList = ({userRole}) => {
    // 1. ESTADOS CLAVE
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const hasAccess = userRole === 'ADMINISTRADOR' || userRole === 'OPERADOR';

    // 2. ESTADOS DE BÚSQUEDA Y FILTRO
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'ENTRADA', 'SALIDA'

    // 3. ESTADO PARA EL MODAL DE MOVIMIENTO (HU 8 y 9)
    const [isFormOpen, setIsFormOpen] = useState(false);


    // FUNCIONALIDAD DE CARGA DE DATOS
    const fetchMovements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Llama al servicio para obtener el historial
            const response = await stockMovementService.getMovementHistory();
            const data = response.data.map(m => ({
                ...m,
                quantity: parseInt(m.quantity) || 0
            }));
            setMovements(data);
        } catch (err) {
            console.error("Error al cargar movimientos:", err);
            setError("No se pudo cargar el historial de movimientos. Revise la consola.");
            setMovements([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements();
    }, []);


    const DYNAMIC_METRICS = useMemo(() => {
        if (movements.length === 0) {
            return [
                { title: "Total Movimientos", value: 0, colorClass: "metric-orange" },
                { title: "Unidades de Entrada", value: 0, colorClass: "metric-green" },
                { title: "Unidades de Salida", value: 0, colorClass: "metric-red" },
            ];
        }

        const totalMovements = movements.length;
        const totalEntries = movements
            .filter(m => m.movementType === 'ENTRADA')
            .reduce((sum, m) => sum + m.quantity, 0);
        const totalExits = movements
            .filter(m => m.movementType === 'SALIDA')
            .reduce((sum, m) => sum + m.quantity, 0);

        return [
            { title: "Total Movimientos", value: totalMovements, colorClass: "metric-orange" },
            { title: "Unidades de Entrada", value: totalEntries, colorClass: "metric-green" },
            { title: "Unidades de Salida", value: totalExits, colorClass: "metric-red" },
        ];
    }, [movements]);


    // FUNCIONALIDAD DE FILTRADO
    const filteredMovements = useMemo(() => {
        let list = movements;

        // 1. FILTRO POR TIPO DE MOVIMIENTO
        if (filterType !== 'ALL') {
            list = list.filter(m => m.movementType === filterType);
        }

        // 2. FILTRO POR BARRA DE BÚSQUEDA
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            list = list.filter(m =>
                (m.productName && m.productName.toLowerCase().includes(term)) ||
                (m.warehouseName && m.warehouseName.toLowerCase().includes(term)) ||
                (m.userName && m.userName.toLowerCase().includes(term)) ||
                (m.motive && m.motive.toLowerCase().includes(term))
            );
        }

        return list;
    }, [movements, filterType, searchTerm]);


    // FUNCIONES DE MODAL se mantienen igual
    const handleNewMovement = () => {
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        // Volver a cargar la lista para ver el nuevo movimiento
        fetchMovements();
    };

    if (!hasAccess) {
        return (
            <div className="main-content" style={{ textAlign: 'center', paddingTop: '50px' }}>
                <h1 style={{ color: '#dc3545' }}>Acceso denegado.</h1>
                <p>No tienes los permisos necesarios para ver el historial de movimientos de stock.</p>
            </div>
        );
    }

    // RENDERIZADO
    return (
        <div className="main-content">

            {/* Header y botón "Nuevo Movimiento" */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Historial de Movimientos</h1>
                    <p className="page-subtitle">Registro y búsqueda de entradas y salidas de stock.</p>
                </div>
                <button className="add-new-button-orange" onClick={handleNewMovement}>
                    <FontAwesomeIcon icon={faPlus} />
                    Nuevo Movimiento
                </button>
            </div>

            <div className="summary-cards-container">
                {DYNAMIC_METRICS.map((metric, index) => (
                    <SummaryCard
                        key={index}
                        title={metric.title}
                        value={isLoading ? 'Cargando...' : metric.value}
                        colorClass={metric.colorClass}
                    />
                ))}
            </div>


            {/* Barra de Búsqueda y Filtro */}
            <div className="search-filter-container">
                {/* 2. Barra de Búsqueda */}
                <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por producto, almacén, usuario o motivo..."
                        className="movement-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* 3. Menú Desplegable de Filtro */}
                <FilterDropdown filterType={filterType} setFilterType={setFilterType} />
            </div>

            {/* Lista de Movimientos (4. Tabla) */}
            <div className="movement-list-card">
                <div className="table-info">
                    Historial de Movimientos
                    <p className="movement-count">{filteredMovements.length} de {movements.length} movimientos</p>
                </div>

                {/* Manejo de Estados (Cargando, Error, No Data) */}
                {isLoading ? (
                    <p className="loading-message">Cargando historial...</p>
                ) : error ? (
                    <div className="error-message api-error">{error}</div>
                ) : filteredMovements.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo de Movimiento</th>
                            <th>Producto</th>
                            <th>Almacén</th>
                            <th>Cantidad</th>
                            <th>Motivo</th>
                            <th>Usuario</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredMovements.map((movement, index) => (
                            <tr key={movement.id || index}>
                                <td>{movement.movementDate}</td>
                                <td>
                                    <span className={`type-badge type-${movement.movementType}`}>
                                            {movement.movementType}
                                        </span>
                                </td>
                                <td>{movement.productName}</td>
                                <td>{movement.warehouseName}</td>
                                <td>{movement.quantity}</td>
                                <td>{movement.motive}</td>
                                <td>{movement.userName}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No se encontraron movimientos que coincidan con los filtros.</p>
                )}
            </div>

            {/* MODAL DE FORMULARIO DE MOVIMIENTO (HU 8 y 9) */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <StockMovementForm
                        onComplete={handleCloseForm}
                        onCancel={handleCloseForm}
                    />
                </div>
            )}
        </div>
    );
};


// Componente auxiliar para el menú desplegable de filtro (HU 3) - Se mantiene sin cambios
const FilterDropdown = ({ filterType, setFilterType }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (type) => {
        setFilterType(type);
        setIsOpen(false);
    };

    const typeDisplay = {
        'ALL': 'Todos los movimientos',
        'ENTRADA': 'Solo Entradas',
        'SALIDA': 'Solo Salidas',
    };

    return (
        <div className="filter-dropdown">
            <button className="filter-button" onClick={() => setIsOpen(!isOpen)}>
                <FontAwesomeIcon icon={faFilter} style={{ marginRight: '8px' }} />
                {typeDisplay[filterType]}
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {Object.entries(typeDisplay).map(([type, label]) => (
                        <button
                            key={type}
                            onClick={() => handleSelect(type)}
                            className={filterType === type ? 'active' : ''}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


export default StockMovementList;