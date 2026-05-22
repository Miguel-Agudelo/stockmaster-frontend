import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import './InventoryDashboard.css';

// ─── Paleta de colores para el gráfico circular ───────────────────────────────
const PIE_COLORS = [
    '#0D0B61', '#294669', '#478B8D', '#E4D329',
    '#468432', '#9AD872', '#FFA02E', '#FFAC5C',
];

// ─── Formateador de moneda colombiana ─────────────────────────────────────────
const formatCOP = (value) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value ?? 0);

// ─── Tooltip personalizado para el gráfico de barras ──────────────────────────
const BarTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip__label">{label}</p>
            <p className="chart-tooltip__value">
                <span className="chart-tooltip__dot" style={{ backgroundColor: '#FF7B00' }} />
                {Number(payload[0].value).toLocaleString('es-CO')} unidades
            </p>
        </div>
    );
};

// ─── Tooltip personalizado para el gráfico circular ───────────────────────────
const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip__label">{payload[0].name}</p>
            <p className="chart-tooltip__value">
                <span className="chart-tooltip__dot" style={{ backgroundColor: payload[0].payload.fill }} />
                {Number(payload[0].value).toLocaleString('es-CO')} productos
            </p>
        </div>
    );
};

// ─── Etiqueta de porcentaje dentro del gráfico circular ───────────────────────
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // No mostrar si es muy pequeño
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
              fontSize={12} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// ─── Componente de error para un panel individual ─────────────────────────────
const ChartErrorBanner = ({ message }) => (
    <div className="chart-error-banner" role="alert">
        <i className="fas fa-exclamation-circle chart-error-banner__icon" />
        <span>{message}</span>
    </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const InventoryDashboard = ({ warehouseStockChart, categoryStockChart, totalInventoryValue }) => {

    // Normalizar datos de bodegas
    const barData = useMemo(() => {
        if (!Array.isArray(warehouseStockChart) || warehouseStockChart.length === 0) return null;
        return warehouseStockChart.map(w => ({
            name: w.warehouseName,
            stock: Number(w.totalStock) || 0,
        }));
    }, [warehouseStockChart]);

    // Normalizar datos de categorías
    const pieData = useMemo(() => {
        if (!Array.isArray(categoryStockChart) || categoryStockChart.length === 0) return null;
        return categoryStockChart.map(c => ({
            name: c.categoryName,
            value: Number(c.totalProducts) || 0,
        }));
    }, [categoryStockChart]);

    const inventoryValue = Number(totalInventoryValue) || 0;

    return (
        <section className="inv-dashboard">

            {/* ── Encabezado de sección ── */}
            <div className="inv-dashboard__header">
                <h2 className="inv-dashboard__title">
                    <i className="fas fa-tachometer-alt inv-dashboard__title-icon" />
                    Tablero de Control
                </h2>
                <p className="inv-dashboard__subtitle">
                    Visión global del inventario en tiempo real
                </p>
            </div>

            {/* ── Tarjeta: Valor total del inventario ── */}
            <div className="inv-dashboard__kpi-row">
                <div className="inv-kpi-card inv-kpi-card--primary">
                    <div className="inv-kpi-card__body">
                        <p className="inv-kpi-card__label">Valor Total del Inventario</p>
                        <p className="inv-kpi-card__value">{formatCOP(inventoryValue)}</p>
                        <p className="inv-kpi-card__hint">
                            Calculado en tiempo real: precio × stock disponible
                        </p>
                    </div>
                    <i className="fas fa-dollar-sign inv-kpi-card__icon" />
                </div>
            </div>

            {/* ── Fila de gráficos ── */}
            <div className="inv-dashboard__charts-row">

                {/* Gráfico de barras: stock por bodega */}
                <div className="inv-chart-panel">
                    <div className="inv-chart-panel__header">
                        <i className="fas fa-warehouse inv-chart-panel__icon" />
                        <div>
                            <h3 className="inv-chart-panel__title">Stock por Bodega</h3>
                            <p className="inv-chart-panel__subtitle">
                                Comparativa de unidades disponibles por almacén
                            </p>
                        </div>
                    </div>

                    {barData ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart
                                data={barData}
                                margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12, fill: '#555' }}
                                    angle={-35}
                                    textAnchor="end"
                                    interval={0}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#555' }}
                                    tickFormatter={v => v.toLocaleString('es-CO')}
                                />
                                <Tooltip content={<BarTooltip />} />
                                <Bar
                                    dataKey="stock"
                                    name="Stock total"
                                    fill="#FF7B00"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={60}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartErrorBanner message="No se pudo cargar el gráfico de stock por bodega. Verifica la conexión o intenta nuevamente." />
                    )}
                </div>

                {/* Gráfico circular: distribución por categoría */}
                <div className="inv-chart-panel">
                    <div className="inv-chart-panel__header">
                        <i className="fas fa-layer-group inv-chart-panel__icon" />
                        <div>
                            <h3 className="inv-chart-panel__title">Distribución por Categoría</h3>
                            <p className="inv-chart-panel__subtitle">
                                Proporción de productos activos por categoría
                            </p>
                        </div>
                    </div>

                    {pieData ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="48%"
                                    outerRadius={100}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderPieLabel}
                                >
                                    {pieData.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<PieTooltip />} />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <ChartErrorBanner message="No se pudo cargar el gráfico de categorías. Verifica la conexión o intenta nuevamente." />
                    )}
                </div>

            </div>
        </section>
    );
};

export default InventoryDashboard;