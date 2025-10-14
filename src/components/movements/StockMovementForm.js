import React, { useState, useEffect } from 'react';

import stockMovementService from '../../services/stockMovementService';

import './StockMovementForm.css';

import authService from "../../services/authService"; // Importado correctamente



const StockMovementForm = ({ onComplete, onCancel }) => {

    const [loading, setLoading] = useState(true);

    const [products, setProducts] = useState([]);

    const [warehouses, setWarehouses] = useState([]);



    const [formData, setFormData] = useState({

        type: 'ENTRADA',

        productId: '',

        warehouseId: '',

        quantity: 0,

        reason: '' // 🚨 Cambiado internamente a 'reason' para el formulario

    });

    const [errors, setErrors] = useState({});

    const [message, setMessage] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);



    const currentStock = 0;



    useEffect(() => {

        const loadData = async () => {

            try {

// Las peticiones GET ahora deberían funcionar gracias a las correcciones de ruta/seguridad en el servicio

                const [prodsResponse, whsResponse] = await Promise.all([

                    stockMovementService.getProductsList(),

                    stockMovementService.getWarehousesList()

                ]);



                setProducts(prodsResponse.data);

                setWarehouses(whsResponse.data);

                setLoading(false);

            } catch (error) {

                console.error("Error al cargar datos de selects:", error);

// Si la carga falla por 403 o similar, el mensaje de error es relevante

                setMessage({ type: 'error', text: 'Error al cargar productos o almacenes.' });

                setLoading(false);

            }

        };

        loadData();

    }, []);



    const handleChange = (e) => {

        let { name, value } = e.target;

        if (name === 'productId' || name === 'warehouseId' || name === 'quantity') {

            value = parseInt(value) || (value === "" ? "" : value);

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

        if (!formData.quantity || formData.quantity <= 0) formErrors.quantity = 'Ingrese una cantidad válida.';

        if (!formData.reason.trim()) formErrors.reason = 'El motivo es obligatorio.'; // 'reason' usado en el formulario

        setErrors(formErrors);

        return Object.keys(formErrors).length === 0;

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        setMessage(null);

        setErrors({});



        if (!validateForm()) return;

        setIsSubmitting(true);



// 1. Obtener el ID del usuario

        const currentUser = authService.getCurrentUser();

        const userId = currentUser ? currentUser.id : null;



        if (!userId) {

            console.error("Error de autenticación: No se encontró el ID del usuario.");

            setMessage({ type: 'error', text: 'Error de autenticación: ID de usuario no disponible.' });

            setIsSubmitting(false);

            return;

        }



// 2. Preparar los datos con los nombres que el backend espera

        const movementData = {

            productId: parseInt(formData.productId),

            warehouseId: parseInt(formData.warehouseId),

            quantity: parseInt(formData.quantity),

// 🚨 CORRECCIÓN CLAVE: Usar el userId dinámico

            userId: userId,

// 🚨 CORRECCIÓN CLAVE: Si el backend espera 'motive', ajustamos el nombre aquí.

// Si el backend lo ignora, puedes dejarlo o renombrarlo.

            motive: formData.reason,

// Asumimos que el tipo de movimiento (ENTRADA/SALIDA) se maneja con rutas separadas en el servicio.

        };



        try {
            let response;

            // 🟢 AGREGAR LÓGICA CONDICIONAL: Llama a la ruta correcta
            if (formData.type === 'ENTRADA') {
                response = await stockMovementService.registerEntry(movementData);
            } else if (formData.type === 'SALIDA') {
                response = await stockMovementService.registerExit(movementData);
            } else {
                throw new Error("Tipo de movimiento no válido.");
            }

            // Manejo de éxito
            setMessage({ type: 'success', text: `Movimiento de ${formData.type.toLowerCase()} registrado exitosamente.` });
            setTimeout(() => {
                setFormData(prev => ({ ...prev, quantity: 0, reason: '' }));
                if (onComplete) onComplete();
            }, 1500);
            // ... (Resto de la lógica de éxito)

        } catch (error) {
            // ... (Asegúrese de que el manejo de errores siga siendo así para capturar la respuesta del backend)
            const apiErrorMessage = error.response?.data?.message || 'Error de conexión al registrar el movimiento.';
            setMessage({ type: 'error', text: apiErrorMessage });
        } finally {
            setIsSubmitting(false);
        }

    };



    if (loading) return <div className="loading-state">Cargando datos...</div>;



    return (

        <div className="form-modal-container" onClick={onCancel}>

            <div className="form-modal" onClick={(e) => e.stopPropagation()}>

                <div className="form-header">

                    <h2>Registrar Movimiento</h2>

                    <button type="button" className="close-button" onClick={onCancel}>

                        &times;

                    </button>

                </div>



                <form onSubmit={handleSubmit}>

                    <div className="form-body">

                        {message && <div className={`form-message ${message.type}`}>{message.text}</div>}



                        {/* Tipo de Movimiento */}

                        <div className="form-group">

                            <label htmlFor="type">Tipo de Movimiento *</label>

                            <select

                                id="type"

                                name="type"

                                value={formData.type}

                                onChange={handleChange}

                                disabled={isSubmitting}

                            >

                                <option value="ENTRADA">Entrada</option>

                                <option value="SALIDA">Salida</option>

                            </select>

                            {errors.type && <p className="error-message">{errors.type}</p>}

                        </div>



                        {/* Producto */}

                        <div className="form-group">

                            <label htmlFor="productId">Producto *</label>

                            <select

                                id="productId"

                                name="productId"

                                value={formData.productId}

                                onChange={handleChange}

                                disabled={isSubmitting}

                            >

                                <option value="">Seleccionar producto</option>

                                {products.map(p => (

                                    <option key={p.id} value={p.id}>

                                        {p.name} ({p.sku || p.id})

                                    </option>

                                ))}

                            </select>

                            {errors.productId && <p className="error-message">{errors.productId}</p>}

                        </div>



                        {/* Almacén */}

                        <div className="form-group">

                            <label htmlFor="warehouseId">Almacén *</label>

                            <select

                                id="warehouseId"

                                name="warehouseId"

                                value={formData.warehouseId}

                                onChange={handleChange}

                                disabled={isSubmitting}

                            >

                                <option value="">Seleccionar almacén</option>

                                {warehouses.map(w => (

                                    <option key={w.id} value={w.id}>{w.name}</option>

                                ))}

                            </select>

                            {errors.warehouseId && <p className="error-message">{errors.warehouseId}</p>}

                        </div>



                        {/* Cantidad */}

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

                                <p className="stock-info">Stock actual: <strong>{currentStock}</strong> unidades.</p>

                            )}

                            {errors.quantity && <p className="error-message">{errors.quantity}</p>}

                        </div>



                        {/* Motivo (reason) */}

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

                        <button

                            type="button"

                            className="btn-cancel"

                            onClick={onCancel}

                            disabled={isSubmitting}

                        >

                            Cancelar

                        </button>

                        <button

                            type="submit"

                            className="btn-save"

                            disabled={isSubmitting}

                        >

                            {isSubmitting ? 'Registrando...' : 'Registrar Movimiento'}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

};



export default StockMovementForm;