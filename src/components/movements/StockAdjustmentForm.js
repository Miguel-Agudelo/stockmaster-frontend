import React, { useState, useEffect } from 'react';
import stockMovementService from '../../services/stockMovementService';
import authService from '../../services/authService';
import './StockAdjustmentForm.css';

// ─── Constantes ──────────────────────────────────────────────────────────────

const REASONS = [
    { key: 'CONTEO_FISICO',   label: 'Conteo físico' },
    { key: 'PRODUCTO_DANADO', label: 'Producto dañado' },
    { key: 'PERDIDA',         label: 'Pérdida' },
    { key: 'ERROR_REGISTRO',  label: 'Error de registro' },
    { key: 'OTRA_RAZON',      label: 'Otra razón' },
];

// ─── Componente principal ────────────────────────────────────────────────────

const StockAdjustmentForm = ({ onComplete, onCancel }) => {

    // Datos de selects
    const [products,   setProducts]   = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Formulario
    const [productId,      setProductId]      = useState('');
    const [warehouseId,    setWarehouseId]     = useState('');
    const [adjustmentType, setAdjustmentType] = useState('POSITIVO');
    const [quantity,       setQuantity]        = useState('');
    const [reason,         setReason]          = useState('');
    const [notes,          setNotes]           = useState('');

    // Estado del stock en tiempo real
    const [currentStock,    setCurrentStock]    = useState(null);
    const [loadingStock,    setLoadingStock]     = useState(false);

    // UI feedback
    const [errors,       setErrors]       = useState({});
    const [message,      setMessage]      = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Carga inicial de productos y almacenes ────────────────────────────────
    useEffect(() => {
        const loadSelects = async () => {
            try {
                const [prodsRes, whRes] = await Promise.all([
                    stockMovementService.getProductsList(),
                    stockMovementService.getWarehousesList(),
                ]);
                setProducts(prodsRes.data.filter(p => p.active !== false));
                setWarehouses(whRes.data);
            } catch {
                setMessage({ type: 'error', text: 'No se pudieron cargar productos o almacenes.' });
            } finally {
                setLoadingData(false);
            }
        };
        loadSelects();
    }, []);

    // ── Stock en tiempo real cuando cambia producto + almacén ─────────────────
    useEffect(() => {
        if (!productId || !warehouseId) {
            setCurrentStock(null);
            return;
        }
        let cancelled = false;
        const fetch = async () => {
            setLoadingStock(true);
            try {
                const res = await stockMovementService.getCurrentStock(productId, warehouseId);
                if (!cancelled) setCurrentStock(res.data.currentStock);
            } catch {
                if (!cancelled) setCurrentStock(null);
            } finally {
                if (!cancelled) setLoadingStock(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, [productId, warehouseId]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const stockResultante = () => {
        const qty = parseInt(quantity) || 0;
        if (currentStock === null || qty <= 0) return null;
        return adjustmentType === 'POSITIVO'
            ? currentStock + qty
            : currentStock - qty;
    };

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
        if (!reason)      errs.reason      = 'Seleccione una razón de ajuste.';
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

    // ── Render ────────────────────────────────────────────────────────────────

    if (loadingData) {
        return (
            <div className="adj-modal">
                <p className="adj-loading">Cargando datos...</p>
            </div>
        );
    }

    const resultante = stockResultante();

    return (
        <div className="adj-modal">
            {/* Header */}
            <div className="adj-header">
                <div>
                    <h3>Ajuste de inventario</h3>
                    <p>Corregir discrepancias de stock de forma manual y justificada</p>
                </div>
                <button type="button" className="adj-close" onClick={onCancel} disabled={isSubmitting}>
                    ×
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="adj-body">

                    {/* Mensaje global */}
                    {message && (
                        <div className={`adj-alert adj-alert--${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Título sección */}
                    <div className="adj-section-title">Registrar ajuste de stock</div>

                    {/* Fila: Producto + Almacén */}
                    <div className="adj-grid-2">
                        <div className="adj-field">
                            <label>Producto <span className="adj-req">*</span></label>
                            <select
                                value={productId}
                                onChange={e => { setProductId(e.target.value); clearError('productId'); }}
                                disabled={isSubmitting}
                            >
                                <option value="">Seleccionar producto...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                        {currentStock !== null && String(p.id) === String(productId)
                                            ? ` (Stock: ${currentStock} Uds)`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.productId && <span className="adj-err">{errors.productId}</span>}
                        </div>
                        <div className="adj-field">
                            <label>Almacén <span className="adj-req">*</span></label>
                            <select
                                value={warehouseId}
                                onChange={e => { setWarehouseId(e.target.value); clearError('warehouseId'); }}
                                disabled={isSubmitting}
                            >
                                <option value="">Seleccionar almacén...</option>
                                {warehouses.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                        {currentStock !== null && String(w.id) === String(warehouseId)
                                            ? ` (${currentStock} Uds de este producto)`
                                            : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.warehouseId && <span className="adj-err">{errors.warehouseId}</span>}
                        </div>
                    </div>

                    {/* Stock actual (feedback visual) */}
                    {productId && warehouseId && (
                        <div className="adj-stock-info">
                            {loadingStock
                                ? 'Consultando stock actual...'
                                : currentStock !== null
                                    ? <>Stock actual en este almacén: <strong>{currentStock} unidades</strong></>
                                    : 'Sin inventario registrado en este almacén.'
                            }
                        </div>
                    )}

                    {/* Tipo de ajuste */}
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
                                onClick={() => setAdjustmentType('NEGATIVO')}
                                disabled={isSubmitting}
                            >
                                − Ajuste negativo
                            </button>
                        </div>
                        <p className="adj-type-hint">
                            {adjustmentType === 'POSITIVO'
                                ? 'Positivo: Incrementa el stock. Úsalo cuando el conteo físico supera el sistema.'
                                : 'Negativo: Reduce el stock. Úsalo cuando el conteo físico es menor al sistema.'}
                        </p>
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
                        {/* Preview stock resultante */}
                        {resultante !== null && (
                            <p className={`adj-resultante ${resultante < 0 ? 'adj-resultante--neg' : ''}`}>
                                Stock resultante: {currentStock} {adjustmentType === 'POSITIVO' ? '+' : '−'} {quantity || 0}
                                {' = '}<strong>{resultante} unidades</strong>
                                {resultante < 0 && ' ⚠ Stock insuficiente'}
                            </p>
                        )}
                        {errors.quantity && <span className="adj-err">{errors.quantity}</span>}
                    </div>

                    {/* Razón de ajuste (chips) */}
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

                    {/* Notas adicionales */}
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

                {/* Footer */}
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
