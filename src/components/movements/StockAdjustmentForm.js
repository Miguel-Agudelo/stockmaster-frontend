import React, { useState, useEffect, useCallback } from 'react';
import stockMovementService from '../../services/stockMovementService';
import authService from '../../services/authService';
import './StockAdjustmentForm.css';

// ─── Constantes ───────────────────────────────────────────────────────────────

const REASONS = [
    { key: 'CONTEO_FISICO',   label: 'Conteo físico'    },
    { key: 'PRODUCTO_DANADO', label: 'Producto dañado'   },
    { key: 'PERDIDA',         label: 'Pérdida'           },
    { key: 'ERROR_REGISTRO',  label: 'Error de registro' },
    { key: 'OTRA_RAZON',      label: 'Otra razón'        },
];

// ─── Componente ───────────────────────────────────────────────────────────────

const StockAdjustmentForm = ({ onComplete, onCancel }) => {

    // Listas base
    const [products,      setProducts]      = useState([]);
    const [allWarehouses, setAllWarehouses] = useState([]);
    const [loadingData,   setLoadingData]   = useState(true);

    // Campos del formulario
    const [productId,      setProductId]      = useState('');
    const [warehouseId,    setWarehouseId]     = useState('');
    const [adjustmentType, setAdjustmentType] = useState('POSITIVO');
    const [quantity,       setQuantity]        = useState('');
    const [reason,         setReason]          = useState('');
    const [notes,          setNotes]           = useState('');

    // Stock por almacén para el producto seleccionado
    const [productStockDetails, setProductStockDetails] = useState([]);
    const [loadingStock,        setLoadingStock]         = useState(false);

    // Stock del par producto+almacén seleccionado
    const [currentStock, setCurrentStock] = useState(null);

    // Feedback
    const [errors,       setErrors]       = useState({});
    const [message,      setMessage]      = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── 1. Carga inicial ──────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const [prodsRes, whRes] = await Promise.all([
                    stockMovementService.getProductsList(),
                    stockMovementService.getWarehousesList(),
                ]);
                setProducts(prodsRes.data.filter(p => p.active !== false));
                setAllWarehouses(whRes.data.map(w => ({ ...w, id: Number(w.id) })));
            } catch {
                setMessage({ type: 'error', text: 'No se pudieron cargar productos o almacenes.' });
            } finally {
                setLoadingData(false);
            }
        };
        load();
    }, []);

    // ── 2. Al cambiar producto → cargar almacenes con stock ───────────────────
    const fetchProductStock = useCallback(async (pid) => {
        if (!pid) {
            setProductStockDetails([]);
            setCurrentStock(null);
            setWarehouseId('');
            return;
        }
        setLoadingStock(true);
        try {
            const res = await stockMovementService.getProductStockByWarehouses(pid);
            const details = res.data
                .map(item => ({
                    ...item,
                    warehouseId:  Number(item.warehouseId),
                    currentStock: Number(item.currentStock) || 0,
                }))
                .filter(item => item.currentStock > 0);
            setProductStockDetails(details);

            // Si el almacén ya seleccionado no tiene stock, resetearlo
            setWarehouseId(prev => {
                if (prev && !details.some(d => d.warehouseId === Number(prev))) {
                    setCurrentStock(null);
                    return '';
                }
                return prev;
            });
        } catch {
            setProductStockDetails([]);
        } finally {
            setLoadingStock(false);
        }
    }, []);

    useEffect(() => {
        fetchProductStock(productId ? Number(productId) : null);
    }, [productId, fetchProductStock]);

    // ── 3. Al cambiar almacén → actualizar currentStock ───────────────────────
    useEffect(() => {
        if (!productId || !warehouseId) { setCurrentStock(null); return; }
        const detail = productStockDetails.find(d => d.warehouseId === Number(warehouseId));
        setCurrentStock(detail ? detail.currentStock : 0);
    }, [warehouseId, productStockDetails, productId]);

    // ── Derivados ─────────────────────────────────────────────────────────────

    // POSITIVO → todos los almacenes | NEGATIVO → solo los que tienen stock
    const warehousesForSelector = (() => {
        if (!productId) return allWarehouses;
        if (adjustmentType === 'POSITIVO') return allWarehouses;
        const ids = new Set(productStockDetails.map(d => d.warehouseId));
        return allWarehouses.filter(w => ids.has(w.id));
    })();

    const getStockLabel = (wId) => {
        const detail = productStockDetails.find(d => d.warehouseId === Number(wId));
        return detail ? ` — ${detail.currentStock} uds` : '';
    };

    const resultante = (() => {
        const qty = parseInt(quantity) || 0;
        if (currentStock === null || qty <= 0) return null;
        return adjustmentType === 'POSITIVO' ? currentStock + qty : currentStock - qty;
    })();

    const clearError = (field) =>
        setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

    // ── Validación ────────────────────────────────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!productId)   errs.productId   = 'Seleccione un producto.';
        if (!warehouseId) errs.warehouseId = 'Seleccione un almacén.';
        if (!quantity || parseInt(quantity) <= 0)
            errs.quantity = 'Ingrese una cantidad mayor a cero.';
        if (adjustmentType === 'NEGATIVO' && currentStock !== null && parseInt(quantity) > currentStock)
            errs.quantity = `Stock insuficiente. Hay ${currentStock} unidades disponibles.`;
        if (!reason) errs.reason = 'Seleccione una razón de ajuste.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        const currentUser = authService.getCurrentUser();
        setIsSubmitting(true);
        setMessage(null);
        try {
            await stockMovementService.registerAdjustment({
                productId:      parseInt(productId),
                warehouseId:    parseInt(warehouseId),
                userId:         currentUser.id,
                adjustmentType,
                quantity:       parseInt(quantity),
                reason,
                notes:          notes.trim() || null,
            });
            setMessage({ type: 'success', text: 'Ajuste de inventario registrado exitosamente.' });
            setTimeout(() => onComplete(), 900);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al registrar el ajuste.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loadingData) {
        return (
            <div className="adj-modal">
                <p className="adj-loading">Cargando datos...</p>
            </div>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="adj-modal">

            {/* HEADER — altura fija, nunca se desplaza */}
            <div className="adj-header">
                <div>
                    <h3>Ajuste de inventario</h3>
                    <p>Corregir discrepancias de stock de forma manual y justificada</p>
                </div>
                <button type="button" className="adj-close" onClick={onCancel} disabled={isSubmitting}>
                    ×
                </button>
            </div>

            {/* FORM: columna flex — body con scroll, footer pegado */}
            <form className="adj-form" onSubmit={handleSubmit}>

                {/* BODY — zona con scroll interno */}
                <div className="adj-body">

                    {message && (
                        <div className={`adj-alert adj-alert--${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="adj-section-title">Registrar ajuste de stock</div>

                    {/* Producto */}
                    <div className="adj-field">
                        <label>Producto <span className="adj-req">*</span></label>
                        <select
                            value={productId}
                            onChange={e => {
                                setProductId(e.target.value);
                                setWarehouseId('');
                                setQuantity('');
                                setCurrentStock(null);
                                clearError('productId');
                            }}
                            disabled={isSubmitting}
                        >
                            <option value="">Seleccionar producto...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {errors.productId && <span className="adj-err">{errors.productId}</span>}
                    </div>

                    {/* Tipo de ajuste — antes del almacén para que el filtro sea inmediato */}
                    <div className="adj-field">
                        <label>Tipo de ajuste <span className="adj-req">*</span></label>
                        <div className="adj-type-group">
                            <button
                                type="button"
                                className={`adj-type-btn adj-type-btn--pos ${adjustmentType === 'POSITIVO' ? 'active' : ''}`}
                                onClick={() => setAdjustmentType('POSITIVO')}
                                disabled={isSubmitting}
                            >
                                + Ajuste positivo
                            </button>
                            <button
                                type="button"
                                className={`adj-type-btn adj-type-btn--neg ${adjustmentType === 'NEGATIVO' ? 'active' : ''}`}
                                onClick={() => {
                                    setAdjustmentType('NEGATIVO');
                                    // Si el almacén elegido no tiene stock, limpiarlo
                                    if (warehouseId) {
                                        const hasStock = productStockDetails.some(
                                            d => d.warehouseId === Number(warehouseId) && d.currentStock > 0
                                        );
                                        if (!hasStock) { setWarehouseId(''); setCurrentStock(null); }
                                    }
                                }}
                                disabled={isSubmitting}
                            >
                                − Ajuste negativo
                            </button>
                        </div>
                        <p className="adj-type-hint">
                            {adjustmentType === 'POSITIVO'
                                ? 'Incrementa el stock. Úsalo cuando el conteo físico supera lo registrado.'
                                : 'Reduce el stock. Solo muestra almacenes con stock disponible.'}
                        </p>
                    </div>

                    {/* Almacén — filtrado por producto y tipo */}
                    <div className="adj-field">
                        <label>Almacén <span className="adj-req">*</span></label>
                        <select
                            value={warehouseId}
                            onChange={e => { setWarehouseId(e.target.value); clearError('warehouseId'); }}
                            disabled={isSubmitting || !productId || loadingStock}
                        >
                            <option value="">
                                {!productId
                                    ? 'Primero seleccione un producto'
                                    : loadingStock
                                        ? 'Cargando almacenes...'
                                        : adjustmentType === 'NEGATIVO' && warehousesForSelector.length === 0
                                            ? 'Sin almacenes con stock'
                                            : 'Seleccionar almacén...'}
                            </option>
                            {warehousesForSelector.map(w => (
                                <option key={w.id} value={w.id}>
                                    {w.name}{getStockLabel(w.id)}
                                </option>
                            ))}
                        </select>
                        {errors.warehouseId && <span className="adj-err">{errors.warehouseId}</span>}
                        {productId && adjustmentType === 'NEGATIVO' && !loadingStock && warehousesForSelector.length === 0 && (
                            <span className="adj-hint">Este producto no tiene stock en ningún almacén.</span>
                        )}
                    </div>

                    {/* Banner de stock — altura reservada fija para que no desplace el layout */}
                    <div className={`adj-stock-banner ${productId && warehouseId ? 'adj-stock-banner--visible' : ''}`}>
                        {productId && warehouseId && (
                            <>
                                {loadingStock
                                    ? 'Consultando stock...'
                                    : currentStock !== null && currentStock > 0
                                        ? <>Stock actual: <strong>{currentStock} unidades</strong> en este almacén</>
                                        : <>Sin stock registrado. El ajuste positivo creará el inventario desde cero.</>
                                }
                            </>
                        )}
                    </div>

                    {/* Cantidad */}
                    <div className="adj-field">
                        <label>Cantidad a ajustar <span className="adj-req">*</span></label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Ej: 15"
                            value={quantity}
                            onChange={e => { setQuantity(e.target.value); clearError('quantity'); }}
                            disabled={isSubmitting}
                        />
                        {resultante !== null && (
                            <p className={`adj-resultante ${resultante < 0 ? 'adj-resultante--neg' : ''}`}>
                                Stock resultante:&nbsp;
                                <strong>
                                    {currentStock} {adjustmentType === 'POSITIVO' ? '+' : '−'} {quantity || 0} = {resultante} unidades
                                </strong>
                                {resultante < 0 && ' ⚠ Stock insuficiente'}
                            </p>
                        )}
                        {errors.quantity && <span className="adj-err">{errors.quantity}</span>}
                    </div>

                    {/* Razón de ajuste */}
                    <div className="adj-field">
                        <label>Razón de ajuste <span className="adj-req">*</span></label>
                        <div className="adj-reasons">
                            {REASONS.map(r => (
                                <button
                                    key={r.key}
                                    type="button"
                                    className={`adj-reason-chip ${reason === r.key ? 'active' : ''}`}
                                    onClick={() => { setReason(r.key); clearError('reason'); }}
                                    disabled={isSubmitting}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        {errors.reason && <span className="adj-err">{errors.reason}</span>}
                    </div>

                    {/* Notas */}
                    <div className="adj-field">
                        <label>Notas adicionales <span className="adj-opt">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Describe brevemente el ajuste..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            disabled={isSubmitting}
                            maxLength={200}
                        />
                    </div>

                </div>
                {/* fin adj-body */}

                {/* FOOTER — siempre pegado al fondo, nunca desaparece */}
                <div className="adj-footer">
                    <button type="button" className="adj-btn-cancel" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="adj-btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Registrando...' : '✓ Registrar ajuste'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default StockAdjustmentForm;
