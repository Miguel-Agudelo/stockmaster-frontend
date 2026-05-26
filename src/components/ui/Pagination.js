import React from 'react';
import './Pagination.css';

/**
 * Componente de paginación reutilizable — HU-PI2-07
 *
 * Props:
 *   currentPage  : número de página actual (base 1)
 *   totalItems   : total de registros disponibles
 *   pageSize     : registros por página (default 10)
 *   onPageChange : función (nuevaPagina) => void
 *   onSizeChange : función (nuevoTamaño) => void (opcional)
 */
const Pagination = ({ currentPage, totalItems, pageSize = 10, onPageChange, onSizeChange }) => {
    const totalPages = Math.ceil(totalItems / pageSize);

    // No renderizar si hay una sola página o no hay datos
    if (totalPages <= 1 && totalItems <= pageSize) return null;

    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end   = Math.min(currentPage * pageSize, totalItems);

    // Generar números de página visibles (máximo 5)
    const buildPages = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 3) return [1, 2, 3, 4, 5];
        if (currentPage >= totalPages - 2) {
            return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    };

    return (
        <div className="pagination-wrapper">
            {/* Criterio HU-PI2-07: indicar cuántos registros hay y en qué página está */}
            <span className="pagination-info">
                Mostrando <strong>{start}–{end}</strong> de <strong>{totalItems}</strong> registros
                &nbsp;·&nbsp; Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
            </span>

            {/* Controles de navegación */}
            <div className="pagination-controls">
                {/* Anterior */}
                <button
                    className="page-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    ← Anterior
                </button>

                {/* Números de página */}
                {buildPages().map(page => (
                    <button
                        key={page}
                        className={`page-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ))}

                {/* Siguiente */}
                <button
                    className="page-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Siguiente →
                </button>
            </div>

            {/* Selector de registros por página */}
            {onSizeChange && (
                <div className="pagination-size">
                    <span>Registros por página:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { onSizeChange(Number(e.target.value)); onPageChange(1); }}
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            )}
        </div>
    );
};

export default Pagination;
