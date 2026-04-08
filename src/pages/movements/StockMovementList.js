import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faSlidersH } from '@fortawesome/free-solid-svg-icons';

import StockMovementForm   from '../../components/movements/StockMovementForm';
import StockAdjustmentForm from '../../components/movements/StockAdjustmentForm';
import stockMovementService from '../../services/stockMovementService';
import Pagination   from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import './StockMovementList.css';


// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
const SummaryCard = ({ title, value, colorClass }) => {
    const displayValue = isNaN(Number(value))
        ? value
        : Number(value).toLocaleString('es-CO');

    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value">{displayValue}</h2>
            </div>
        </div>
    );
};


// ─── Componente principal ─────────────────────────────────────────────────────
const StockMovementList = ({ userRole }) => {

    const [movements,  setMovements]  = useState([]);
    const [isLoading,  setIsLoading]  = useState(true);
    const [error,      setError]      = useState(null);
    const hasAccess = userRole === 'ADMINISTRADOR' || userRole === 'OPERADOR';

    const [searchTerm,  setSearchTerm]  = useState('');
    const [filterType,  setFilterType]  = useState('ALL');

    // HU08/09 — modal movimiento
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    // HU11 — modal ajuste
    const [isAdjustOpen, setIsAdjustOpen] = useState(false);

    // ── Carga de datos ────────────────────────────────────────────────────────
    const fetchMovements = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await stockMovementService.getMovementHistory();
            const data = response.data.map(m => ({
                ...m,
                quantity: parseInt(m.quantity) || 0,
            }));
            setMovements(data);
        } catch (err) {
            console.error('Error al cargar movimientos:', err);
            setError('No se pudo cargar el historial de movimientos.');
            setMovements([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchMovements(); }, []);

    // ── Métricas dinámicas ────────────────────────────────────────────────────
    const DYNAMIC_METRICS = useMemo(() => {
        const totalMovements = movements.length;
        const totalEntries   = movements
            .filter(m => m.movementType === 'ENTRADA')
            .reduce((s, m) => s + m.quantity, 0);
        const totalExits     = movements
            .filter(m => m.movementType === 'SALIDA')
            .reduce((s, m) => s + m.quantity, 0);

        return [
            { title: 'Total Movimientos',    value: totalMovements, colorClass: 'metric-orange' },
            { title: 'Unidades de Entrada',  value: totalEntries,   colorClass: 'metric-green'  },
            { title: 'Unidades de Salida',   value: totalExits,     colorClass: 'metric-red'    },
        ];
    }, [movements]);

    // ── Filtrado ──────────────────────────────────────────────────────────────
    const filteredMovements = useMemo(() => {
        let list = movements;

        if (filterType !== 'ALL') {
            if (filterType === 'AJUSTE') {
                list = list.filter(m =>
                    m.movementType === 'AJUSTE_POSITIVO' ||
                    m.movementType === 'AJUSTE_NEGATIVO'
                );
            } else {
                list = list.filter(m => m.movementType === filterType);
            }
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            list = list.filter(m =>
                (m.productName   && m.productName.toLowerCase().includes(term))   ||
                (m.warehouseName && m.warehouseName.toLowerCase().includes(term)) ||
                (m.userName      && m.userName.toLowerCase().includes(term))      ||
                (m.motive        && m.motive.toLowerCase().includes(term))
            );
        }
        return list;
    }, [movements, filterType, searchTerm]);

    // ── Paginación (HU07) ─────────────────────────────────────────────────────
    const { currentPage, pageSize, paginated: paginatedMovements, setPage, setPageSize } =
        usePagination(filteredMovements);

    // ── Handlers modales ──────────────────────────────────────────────────────
    const handleCloseMovement = () => { setIsMovementOpen(false); fetchMovements(); };
    const handleCloseAdjust   = () => { setIsAdjustOpen(false);   fetchMovements(); };

    if (!hasAccess) {
        return (
            <div className="main-content" style={{ textAlign: 'center', paddingTop: 50 }}>
                <h1 style={{ color: '#dc3545' }}>Acceso denegado.</h1>
                <p>No tienes los permisos necesarios para ver el historial de movimientos.</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="main-content">

            {/* Header */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Historial de Movimientos</h1>
                    <p className="page-subtitle">Registro de movimientos hechos en el sistema</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {/* HU11 — Botón Ajuste de inventario */}
                    <button
                        className="btn-adjust-inventory"
                        onClick={() => setIsAdjustOpen(true)}
                    >
                        <FontAwesomeIcon icon={faSlidersH} />
                        &nbsp;Ajuste de inventario
                    </button>
                    {/* HU08/09 — Botón Nuevo Movimiento */}
                    <button
                        className="add-new-button-orange"
                        onClick={() => setIsMovementOpen(true)}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        &nbsp;Nuevo Movimiento
                    </button>
                </div>
            </div>

            {/* Métricas */}
            <div className="summary-cards-container">
                {DYNAMIC_METRICS.map((metric, i) => (
                    <SummaryCard
                        key={i}
                        title={metric.title}
                        value={isLoading ? 'Cargando...' : metric.value}
                        colorClass={metric.colorClass}
                    />
                ))}
            </div>

            {/* Búsqueda + Filtro */}
            <div className="search-filter-container">
                <div className="search-input-group">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por producto, almacén, usuario o motivo..."
                        className="movement-search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <FilterDropdown filterType={filterType} setFilterType={setFilterType} />
            </div>

            {/* Tabla */}
            <div className="movement-list-card">
                <div className="table-info">
                    Historial de Movimientos
                    <p className="movement-count">
                        Mostrando {filteredMovements.length} de {movements.length} movimientos
                        &nbsp;·&nbsp; Página {currentPage}
                    </p>
                </div>

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
                        {paginatedMovements.map((m, i) => (
                            <tr key={m.id || i}>
                                <td>{m.movementDate}</td>
                                <td>
                                    <MovementBadge type={m.movementType} />
                                </td>
                                <td>{m.productName}</td>
                                <td>{m.warehouseName}</td>
                                <td>{m.quantity}</td>
                                <td>{m.motive}</td>
                                <td>{m.userName}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No se encontraron movimientos con los filtros aplicados.</p>
                )}

                {/* HU07 — Paginación */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredMovements.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onSizeChange={setPageSize}
                />
            </div>

            {/* Modal: Nuevo Movimiento (HU08/09) */}
            {isMovementOpen && (
                <div className="modal-backdrop">
                    <StockMovementForm
                        onComplete={handleCloseMovement}
                        onCancel={handleCloseMovement}
                    />
                </div>
            )}

            {/* Modal: Ajuste de Inventario (HU11) */}
            {isAdjustOpen && (
                <div className="modal-backdrop">
                    <StockAdjustmentForm
                        onComplete={handleCloseAdjust}
                        onCancel={() => setIsAdjustOpen(false)}
                    />
                </div>
            )}
        </div>
    );
};


// ─── Badge de tipo de movimiento ─────────────────────────────────────────────
const BADGE_CONFIG = {
    ENTRADA:          { label: 'Entrada',          cls: 'type-ENTRADA'          },
    SALIDA:           { label: 'Salida',            cls: 'type-SALIDA'           },
    AJUSTE_POSITIVO:  { label: 'Ajuste +',          cls: 'type-AJUSTE_POSITIVO'  },
    AJUSTE_NEGATIVO:  { label: 'Ajuste −',          cls: 'type-AJUSTE_NEGATIVO'  },
};

const MovementBadge = ({ type }) => {
    const cfg = BADGE_CONFIG[type] || { label: type, cls: '' };
    return <span className={`type-badge ${cfg.cls}`}>{cfg.label}</span>;
};


// ─── Dropdown de filtro ───────────────────────────────────────────────────────
const FilterDropdown = ({ filterType, setFilterType }) => {
    const [isOpen, setIsOpen] = useState(false);

    const OPTIONS = {
        ALL:    'Todos los movimientos',
        ENTRADA: 'Solo Entradas',
        SALIDA:  'Solo Salidas',
        AJUSTE:  'Solo Ajustes',
    };

    return (
        <div className="filter-dropdown">
            <button className="filter-button" onClick={() => setIsOpen(!isOpen)}>
                <FontAwesomeIcon icon={faFilter} style={{ marginRight: 8 }} />
                {OPTIONS[filterType]}
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {Object.entries(OPTIONS).map(([type, label]) => (
                        <button
                            key={type}
                            onClick={() => { setFilterType(type); setIsOpen(false); }}
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
