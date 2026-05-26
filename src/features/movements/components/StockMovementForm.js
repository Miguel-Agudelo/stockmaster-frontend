import React, { useState, useEffect } from 'react';
import stockMovementService from '../stockMovementService';
import './StockMovementForm.css';
import authService from "../../auth/authService";

const StockMovementForm = ({ onComplete, onCancel }) => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [formData, setFormData] = useState({
        type: 'ENTRADA',
        productId: '',
        warehouseId: '',
        quantity: '', // usar cadena vacía para evitar controlled/uncontrolled
        reason: ''
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStock, setCurrentStock] = useState(null);
    const [loadingStock, setLoadingStock] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const loadData = async () => {
            try {
                const [prodsResponse, whsResponse] = await Promise.all([
                    stockMovementService.getProductsList(),
                    stockMovementService.getWarehousesList()
                ]);
                if (!isMounted) return;
                setProducts(prodsResponse.data);
                setWarehouses(whsResponse.data);
                setLoading(false);
            } catch (error) {
                if (!isMounted) return;
                console.error("Error al cargar datos de selects:", error);
                setMessage({ type: 'error', text: 'Error al cargar productos o almacenes.' });
                setLoading(false);
            }
        };
        loadData();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const { productId, warehouseId } = formData;

        if (!productId || !warehouseId) {
            setCurrentStock(null);
            return;
        }

        let isMounted = true;

        const fetchStock = async () => {
            if (productId === '' || warehouseId === '') return;
            setLoadingStock(true);
            try {
                const response = await stockMovementService.getCurrentStock(productId, warehouseId);
                if (isMounted) setCurrentStock(response.data.currentStock);
            } catch (error) {
                if (isMounted) setCurrentStock(null);
                console.error("Error al obtener stock actual:", error);
            } finally {
                if (isMounted) setLoadingStock(false);
            }
        };

        fetchStock();
        return () => { isMounted = false; };
    }, [formData, formData.productId, formData.warehouseId]);

    const handleChange = (e) => {
        const { name } = e.target;
        let value = e.target.value;

        if (name === 'quantity') {
            // mantener "" cuando esté vacío, convertir a número sólo en submit
            value = value === '' ? '' : Number(value);
        }

        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validateForm = () => {
        let formErrors = {};
        if (!formData.type) formErrors.type = 'Seleccione el tipo de movimiento.';
        if (!formData.productId) formErrors.productId = 'Seleccione un producto.';
        if (!formData.warehouseId) formErrors.warehouseId = 'Seleccione un almacén.';
        if (formData.quantity === '' || Number(formData.quantity) <= 0) formErrors.quantity = 'Ingrese una cantidad válida.';
        if (!formData.reason.trim()) formErrors.reason = 'El motivo es obligatorio.';
        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setErrors({});

        if (!validateForm()) return;
        setIsSubmitting(true);

        const currentUser = authService.getCurrentUser();
        const userId = currentUser ? currentUser.id : null;

        if (!userId) {
            console.error("Error de autenticación: No se encontró el ID del usuario.");
            setMessage({ type: 'error', text: 'Error de autenticación: ID de usuario no disponible.' });
            setIsSubmitting(false);
            return;
        }

        const movementData = {
            productId: Number(formData.productId),
            warehouseId: Number(formData.warehouseId),
            quantity: Number(formData.quantity),
            userId: userId,
            motive: formData.reason,
        };

        try {
            if (formData.type === 'ENTRADA') {
                await stockMovementService.registerEntry(movementData);
            } else if (formData.type === 'SALIDA') {
                await stockMovementService.registerExit(movementData);
            } else {
                setMessage({ type: 'error', text: 'Tipo de movimiento no válido.' });
                setIsSubmitting(false);
                return;
            }

            setMessage({ type: 'success', text: `Movimiento de ${formData.type.toLowerCase()} registrado exitosamente.` });
            setTimeout(() => {
                setFormData(prev => ({ ...prev, quantity: '', reason: '' }));
                if (onComplete) onComplete();
            }, 1500);

        } catch (error) {
            const apiErrorMessage = error.response?.data?.message || 'Error de conexión al registrar el movimiento.';
            setMessage({ type: 'error', text: apiErrorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-state">Cargando datos...</div>;

    return (
        <div className="movement-form-container">
            <div className="form-header">
                <div>
                    <h2>Registrar Movimiento</h2>
                    <p>Complete los datos del nuevo movimiento</p>
                </div>
                <button type="button" className="close-button" onClick={onCancel}>
                    &times;
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-body">
                    {message && <div className={`form-message ${message.type}`}>{message.text}</div>}

                    <div className="form-group">
                        <label htmlFor="type">Tipo de Movimiento *</label>
                        <select id="type" name="type" value={formData.type} onChange={handleChange} disabled={isSubmitting}>
                            <option value="ENTRADA">Entrada</option>
                            <option value="SALIDA">Salida</option>
                        </select>
                        {errors.type && <p className="error-message">{errors.type}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="productId">Producto *</label>
                        <select id="productId" name="productId" value={formData.productId} onChange={handleChange} disabled={isSubmitting}>
                            <option value="">Seleccionar producto</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku || p.id})
                                </option>
                            ))}
                        </select>
                        {errors.productId && <p className="error-message">{errors.productId}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="warehouseId">Almacén *</label>
                        <select id="warehouseId" name="warehouseId" value={formData.warehouseId} onChange={handleChange} disabled={isSubmitting}>
                            <option value="">Seleccionar almacén</option>
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                        {errors.warehouseId && <p className="error-message">{errors.warehouseId}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="quantity">Cantidad *</label>
                        <input
                            type="number"
                            id="quantity"
                            name="quantity"
                            value={formData.quantity}
                            onChange={handleChange}
                            min="1"
                            disabled={isSubmitting}
                        />
                        {formData.productId && formData.warehouseId && (
                            <p className="stock-info">
                                Stock actual: <strong>
                                {loadingStock ? '...' : currentStock !== null ? `${currentStock}` : 'No disponible'}
                            </strong> unidades.
                            </p>
                        )}
                        {errors.quantity && <p className="error-message">{errors.quantity}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="reason">Motivo *</label>
                        <input
                            type="text"
                            id="reason"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Describa el motivo del movimiento"
                            disabled={isSubmitting}
                        />
                        {errors.reason && <p className="error-message">{errors.reason}</p>}
                    </div>
                </div>

                <div className="modal-footer-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockMovementForm;
