import React from 'react';

/**
 * Tarjeta de métrica reutilizable.
 * @param {string}  title      - Etiqueta de la métrica
 * @param {*}       value      - Valor a mostrar (número o string)
 * @param {string}  colorClass - Clase CSS de color (metric-orange, metric-green, etc.)
 */
const SummaryCard = ({ title, value, colorClass }) => {
    const displayValue =
        typeof value === 'number'
            ? value.toLocaleString('es-CO')
            : value ?? '—';

    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value">{displayValue}</h2>
            </div>
        </div>
    );
};

export default SummaryCard;