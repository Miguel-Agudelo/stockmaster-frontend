import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import './InventoryDashboard.css';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const PALETTE = {
    entradas : '#2B6CB0',
    salidas  : '#FF7B00',
    topBar   : '#2C7A7B',
    dona     : ['#1E3A5F','#2B6CB0','#FF7B00','#276749','#6B46C1','#C05621','#2C7A7B','#9B2335'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCOP = (v) =>
    new Intl.NumberFormat('es-CO', {
        style: 'currency', currency: 'COP',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v ?? 0);

const formatNum = (v) =>
    new Intl.NumberFormat('es-CO').format(v ?? 0);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, hint, icon, accentColor }) => (
    <div className="kpi-card" style={{ borderTopColor: accentColor }}>
        <div className="kpi-card__left">
            <p className="kpi-card__label">{label}</p>
            <p className="kpi-card__value" style={{ color: accentColor }}>{value}</p>
            {hint && <p className="kpi-card__hint">{hint}</p>}
        </div>
        <div className="kpi-card__icon-wrap" style={{ backgroundColor: accentColor + '18' }}>
            <i className={`fas ${icon} kpi-card__icon`} style={{ color: accentColor }} />
        </div>
    </div>
);

// ─── Tooltip genérico ─────────────────────────────────────────────────────────
const GenTooltip = ({ active, payload, label, money }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="dash-tooltip">
            {label && <p className="dash-tooltip__title">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} className="dash-tooltip__row">
                    <span className="dash-tooltip__dot" style={{ background: p.fill || p.color }} />
                    <span className="dash-tooltip__name">{p.name}:</span>
                    <span className="dash-tooltip__val">
                        {money ? formatCOP(p.value) : formatNum(p.value)}
                    </span>
                </p>
            ))}
        </div>
    );
};

// ─── Error banner ─────────────────────────────────────────────────────────────
const ErrBanner = ({ msg }) => (
    <div className="dash-err-banner">
        <i className="fas fa-exclamation-circle" />
        <span>{msg}</span>
    </div>
);

// ─── Panel de gráfico ─────────────────────────────────────────────────────────
const ChartPanel = ({ icon, title, subtitle, children }) => (
    <div className="dash-chart-panel">
        <div className="dash-chart-panel__header">
            <i className={`fas ${icon} dash-chart-panel__icon`} />
            <div>
                <h3 className="dash-chart-panel__title">{title}</h3>
                <p className="dash-chart-panel__subtitle">{subtitle}</p>
            </div>
        </div>
        {children}
    </div>
);

/**
 * @typedef {Object} DashboardProps
 * @property {Array} [categoryStockChart]
 * @property {number} [totalInventoryValue]
 * @property {number} [totalRevenue]
 * @property {number} [lowStockCount]
 * @property {number} [totalMovements]
 * @property {Array} [movimientosMensuales]
 * @property {Array} [topProductosByStock]
 */

// ─── Componente principal ─────────────────────────────────────────────────────
/**
 * Tablero de control de inventario con analíticas de Recharts.
 * @param {DashboardProps} props
 */
const InventoryDashboard = ({
                                categoryStockChart  = [],
                                totalInventoryValue = 0,
                                totalRevenue        = 0,
                                lowStockCount       = 0,
                                totalMovements      = 0,
                                movimientosMensuales = [],
                                topProductosByStock  = [],
                            }) => {

    // Movimientos mensuales → array de 12 meses
    const movData = useMemo(() => {
        const base = MESES.map((m, i) => ({ mes: m, entradas: 0, salidas: 0, idx: i + 1 }));
        movimientosMensuales.forEach(d => {
            const slot = base.find(b => b.idx === d.mes);
            if (slot) { slot.entradas = d.entradas; slot.salidas = d.salidas; }
        });
        return base;
    }, [movimientosMensuales]);

    // Top productos
    const topData = useMemo(() => {
        if (!Array.isArray(topProductosByStock) || !topProductosByStock.length) return null;
        return topProductosByStock.map(p => ({
            name: p.productName,
            stock: Number(p.totalStock) || 0,
        }));
    }, [topProductosByStock]);

    // Categorías para dona
    const donaData = useMemo(() => {
        if (!Array.isArray(categoryStockChart) || !categoryStockChart.length) return null;
        return categoryStockChart.map(c => ({
            name: c.categoryName,
            value: Number(c.totalProducts) || 0,
        }));
    }, [categoryStockChart]);

    const topBarHeight = topData ? Math.max(260, topData.length * 46) : 260;

    return (
        <section className="inv-dashboard">

            {/* ── Título ── */}
            <div className="inv-dashboard__header">
                <h2 className="inv-dashboard__title">
                    <i className="fas fa-tachometer-alt inv-dashboard__title-icon" />
                    Tablero de Control
                </h2>
                <p className="inv-dashboard__subtitle">
                    Visión global del inventario en tiempo real
                </p>
            </div>

            {/* ── KPIs ── */}
            <div className="kpi-row">
                <KpiCard
                    label="Valor del Inventario"
                    value={formatCOP(totalInventoryValue)}
                    hint="precio × stock disponible"
                    accentColor="#1E3A5F"
                />
                <KpiCard
                    label="Ingresos por Salidas"
                    value={formatCOP(totalRevenue)}
                    hint="suma de todas las salidas"
                    accentColor="#276749"
                />
                <KpiCard
                    label="Alertas de Stock Bajo"
                    value={formatNum(lowStockCount)}
                    hint="productos bajo el mínimo"
                    accentColor="#C05621"
                />
                <KpiCard
                    label="Total Movimientos"
                    value={formatNum(totalMovements)}
                    hint="entradas y salidas registradas"
                    accentColor="#6B46C1"
                />
            </div>

            {/* ── Fila 1: Movimientos mensuales (ancho completo) ── */}
            <ChartPanel
                icon="fa-chart-bar"
                title="Movimientos Mensuales"
                subtitle={`Entradas y salidas registradas en ${new Date().getFullYear()}`}
            >
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={movData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" vertical={false} />
                        <XAxis
                            dataKey="mes"
                            tick={{ fontSize: 11, fill: '#4A5568' }}
                            axisLine={{ stroke: '#E2E8F0' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#4A5568' }}
                            tickFormatter={formatNum}
                            axisLine={false} tickLine={false}
                        />
                        <Tooltip content={<GenTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                        <Legend
                            iconType="circle" iconSize={9}
                            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                        <Bar dataKey="entradas" name="Entradas" fill={PALETTE.entradas}
                             radius={[4,4,0,0]} maxBarSize={28} />
                        <Bar dataKey="salidas"  name="Salidas"  fill={PALETTE.salidas}
                             radius={[4,4,0,0]} maxBarSize={28} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartPanel>

            {/* ── Fila 2: Top productos + Categorías ── */}
            <div className="inv-dashboard__charts-row">

                {/* Top productos por stock */}
                <ChartPanel
                    icon="fa-box-open"
                    title="Top Productos por Stock"
                    subtitle="Productos con mayor disponibilidad"
                >
                    {topData ? (
                        <ResponsiveContainer width="100%" height={topBarHeight}>
                            <BarChart
                                data={topData}
                                layout="vertical"
                                margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" horizontal={false} />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 10, fill: '#4A5568' }}
                                    tickFormatter={formatNum}
                                    axisLine={false} tickLine={false}
                                />
                                <YAxis
                                    type="category" dataKey="name" width={120}
                                    tick={{ fontSize: 10, fill: '#2D3748' }}
                                    axisLine={false} tickLine={false}
                                />
                                <Tooltip
                                    content={<GenTooltip />}
                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                />
                                <Bar
                                    dataKey="stock" name="Stock disponible"
                                    fill={PALETTE.topBar}
                                    radius={[0,5,5,0]} maxBarSize={28}
                                    label={{
                                        position: 'right', fontSize: 10,
                                        fill: '#718096',
                                        formatter: formatNum,
                                    }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <ErrBanner msg="No se pudo cargar el ranking de productos." />
                    )}
                </ChartPanel>

                {/* Distribución por categoría — dona */}
                <ChartPanel
                    icon="fa-layer-group"
                    title="Distribución por Categoría"
                    subtitle="Proporción de productos activos"
                >
                    {donaData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={donaData}
                                    cx="50%" cy="45%"
                                    innerRadius={68}
                                    outerRadius={108}
                                    dataKey="value"
                                    paddingAngle={3}
                                >
                                    {donaData.map((entry, i) => (
                                        <Cell
                                            key={`cell-${i}`}
                                            fill={PALETTE.dona[i % PALETTE.dona.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<GenTooltip />} />
                                <Legend
                                    layout="horizontal" verticalAlign="bottom" align="center"
                                    iconType="circle" iconSize={9}
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <ErrBanner msg="No se pudo cargar la distribución por categoría." />
                    )}
                </ChartPanel>

            </div>
        </section>
    );
};

export default InventoryDashboard;