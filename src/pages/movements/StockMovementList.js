// src/pages/stock/StockMovementList.js
import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Íconos adaptados para movimientos/métricas:
import { faPlus, faSearch, faFilter, faClipboardList, faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons';
// Importamos el formulario que creamos para registrar movimientos (HU 8 y 9)
import StockMovementForm from '../../components/movements/StockMovementForm';
// Importamos el servicio
import stockMovementService from '../../services/stockMovementService';
// 🟢 Importamos el nuevo CSS
import './StockMovementList.css';


// 🟢 Reutilizamos MetricCard (componente local, como en ProductList)
const MetricCard = ({ title, value, icon, color }) => (
    <div className="metric-card">
        <div className="card-header">
            <span className="card-title">{title}</span>
            <FontAwesomeIcon icon={icon} style={{ color: color, opacity: 0.8 }} />
        </div>
        <div className="card-value">{value}</div>
    </div>
);


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
            // Llama al servicio para obtener el historial (HU 10)
            const response = await stockMovementService.getMovementHistory();
            // Aseguramos que la cantidad sea numérica para los cálculos
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


    // 🟢 CÁLCULO DE MÉTRICAS DINÁMICAS (CORREGIDO: Usando movementType)
    const DYNAMIC_METRICS = useMemo(() => {
        if (movements.length === 0) {
            return [
                { title: "Total Movimientos", value: 0, icon: faClipboardList, color: "#FF7B00" },
                { title: "Unidades de Entrada", value: 0, icon: faArrowDown, color: "#10B981" },
                { title: "Unidades de Salida", value: 0, icon: faArrowUp, color: "#EF4444" },
            ];
        }

        const totalMovements = movements.length;
        const totalEntries = movements
            // 🟢 CORRECCIÓN: Usar movementType
            .filter(m => m.movementType === 'ENTRADA')
            .reduce((sum, m) => sum + m.quantity, 0);
        const totalExits = movements
            // 🟢 CORRECCIÓN: Usar movementType
            .filter(m => m.movementType === 'SALIDA')
            .reduce((sum, m) => sum + m.quantity, 0);

        return [
            { title: "Total Movimientos", value: totalMovements, icon: faClipboardList, color: "#FF7B00" },
            { title: "Unidades de Entrada", value: totalEntries, icon: faArrowDown, color: "#10B981" },
            { title: "Unidades de Salida", value: totalExits, icon: faArrowUp, color: "#EF4444" },
        ];
    }, [movements]);


    // FUNCIONALIDAD DE FILTRADO (CORREGIDO: Usando nombres de campos del DTO)
    const filteredMovements = useMemo(() => {
        let list = movements;

        // 3. FILTRO POR TIPO DE MOVIMIENTO
        if (filterType !== 'ALL') {
            // 🟢 CORRECCIÓN: Usar movementType
            list = list.filter(m => m.movementType === filterType);
        }

        // 2. FILTRO POR BARRA DE BÚSQUEDA
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            list = list.filter(m =>
                // 🟢 CORRECCIÓN: Usar productName, warehouseName, userName y motive
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

            {/* 🟢 MÉTRICAS */}
            <div className="metrics-grid">
                {DYNAMIC_METRICS.map((metric, index) => (
                    <MetricCard
                        key={index}
                        title={metric.title}
                        value={isLoading ? 'Cargando...' : metric.value}
                        icon={metric.icon}
                        color={metric.color}
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
                        {/* 🟢 CORRECCIÓN: Eliminar espacios y saltos de línea innecesarios alrededor del map para evitar advertencias */}
                        <tbody>
                        {filteredMovements.map((movement, index) => (
                            // 🟢 CORRECCIÓN: Usar index como respaldo si movement.id es null (para evitar la advertencia de key=null)
                            <tr key={movement.id || index}>
                                <td>{movement.movementDate}</td>      {/* 🟢 CORREGIDO: Usar movementDate */}
                                <td>
                                    {/* 🟢 CORREGIDO: Usar movementType */}
                                    <span className={`type-badge type-${movement.movementType}`}>
                                            {movement.movementType}
                                        </span>
                                </td>
                                <td>{movement.productName}</td>      {/* 🟢 CORREGIDO: Usar productName */}
                                <td>{movement.warehouseName}</td>    {/* 🟢 CORREGIDO: Usar warehouseName */}
                                <td>{movement.quantity}</td>
                                <td>{movement.motive}</td>          {/* 🟢 CORREGIDO: Usar motive */}
                                <td>{movement.userName}</td>        {/* 🟢 CORREGIDO: Usar userName */}
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
// ... (código del componente auxiliar)
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