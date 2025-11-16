import React, { useState, useEffect } from 'react';
import './ProductForm.css';
import productService from '../../services/productService';
import warehouseService from '../../services/warehouseService';


const ProductForm = ({ onSave, onCancel, currentProduct }) => {

    const isEditing = !!currentProduct;
    const initialState = {
        name: '',
        description: '',
        price: '',
        categoryName: '',
        warehouseId: '',
        initialQuantity: '',
        minStock: '',
    };

    const [formData, setFormData] = useState(initialState);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeWarehouses, setActiveWarehouses] = useState([]);
    const [warehouseLoadMessage, setWarehouseLoadMessage] = useState('Cargando almacenes...');


    // 1. Efecto para cargar datos y almacenes
    useEffect(() => {
        // Lógica de carga de datos de edición/creación
        if (currentProduct) {
            setFormData({
                name: currentProduct.name || '',
                description: currentProduct.description || '',
                price: currentProduct.price !== undefined ? currentProduct.price.toString() : '',
                categoryName: currentProduct.categoryName || '',
                warehouseId: '',
                initialQuantity: '',
                minStock: '',
            });
        } else {
            setFormData(initialState);
        }

        setErrors({});
        setMessage('');


        const fetchActiveWarehouses = async () => {
            if (isEditing) return;

            try {
                const warehouses = await warehouseService.getActiveWarehousesList();

                setActiveWarehouses(warehouses);

                if (warehouses.length > 0) {
                    setFormData(prev => ({ ...prev, warehouseId: warehouses[0].id.toString() }));
                    setWarehouseLoadMessage(null);
                } else {
                    setWarehouseLoadMessage('No hay almacenes activos disponibles para asignar productos.');
                }

            } catch (err) {
                console.error("Error al cargar almacenes:", err);
                setWarehouseLoadMessage('Error al cargar la lista de almacenes.');
                setActiveWarehouses([]);
            }
        };

        fetchActiveWarehouses();

    }, [currentProduct, isEditing]);


    // 2. Manejo de cambios
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; });
        setMessage('');
    };

    // 3. Validación
    const validate = () => {
        let tempErrors = {};
        let isValid = true;

        if (!formData.name) { tempErrors.name = "El nombre es obligatorio."; isValid = false; }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            tempErrors.price = "El precio debe ser un número mayor a 0.";
            isValid = false;
        }

        if (!formData.categoryName) { tempErrors.categoryName = "La categoría es obligatoria."; isValid = false; }

        if (!isEditing) {

            if (activeWarehouses.length === 0) {
                tempErrors.warehouseId = "No hay almacenes activos disponibles para la creación.";
                isValid = false;
            } else if (!formData.warehouseId || isNaN(parseInt(formData.warehouseId))) {
                tempErrors.warehouseId = "Debe seleccionar un almacén activo.";
                isValid = false;
            }

            const initialQuantity = parseInt(formData.initialQuantity);
            if (isNaN(initialQuantity) || initialQuantity < 0) {
                tempErrors.initialQuantity = "La cantidad inicial debe ser un número positivo (o 0).";
                isValid = false;
            }

            const minStock = parseInt(formData.minStock);
            if (isNaN(minStock) || minStock < 0) {
                tempErrors.minStock = "El stock mínimo debe ser un número positivo (o 0).";
                isValid = false;
            }
            if (initialQuantity < minStock) {
                tempErrors.minStock = "El stock mínimo no debe ser mayor que la cantidad inicial.";
                isValid = false;
            }
        }

        setErrors(tempErrors);
        return isValid;
    };

    // 4. Envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            setMessage('Por favor, corrija los errores del formulario.');
            return;
        }

        setIsSubmitting(true);

        try {
            const productData = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                categoryName: formData.categoryName,
            };

            let responseMessage = '';

            if (isEditing) {
                // MODO EDICIÓN: Solo datos básicos
                await productService.updateProduct(currentProduct.id, productData);
                responseMessage = 'Producto actualizado exitosamente.';
            } else {
                // MODO CREACIÓN: Todos los campos requeridos
                const fullProductData = {
                    ...productData,
                    warehouseId: parseInt(formData.warehouseId),
                    initialQuantity: parseInt(formData.initialQuantity),
                    minStock: parseInt(formData.minStock),
                };
                await productService.createProduct(fullProductData);
                responseMessage = 'Producto creado exitosamente.';
            }

            setMessage(responseMessage);
            setTimeout(() => { onSave(); }, 1000);

        } catch (error) {
            console.error("Error al guardar producto:", error.response?.data);
            const apiErrorMessage = error.response?.data?.message || 'Error de conexión o datos inválidos.';
            setMessage(apiErrorMessage);
            setErrors({ general: apiErrorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 5. Textos dinámicos
    const modalTitle = isEditing ? 'Editar Producto' : 'Crear Producto';
    const modalSubtitle = isEditing ? 'Modifique la información del producto' : 'Complete los datos del nuevo producto';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Crear Producto';


    // 6. JSX del Formulario
    return (
        <div className="form-modal-container">
            <form className="form-modal-content" onSubmit={handleSubmit}>

                {/* Encabezado... */}
                <div className="modal-header-edit">
                    <h3>{modalTitle}</h3>
                    <p>{modalSubtitle}</p>
                    <button type="button" onClick={onCancel} className="close-x-button">
                        &times;
                    </button>
                </div>

                {/* Cuerpo del Formulario */}
                <div className="modal-body-form">
                    {/* Mensajes de error... */}
                    {message && !errors.general && <div className="form-message">{message}</div>}
                    {errors.general && <div className="error-message">{errors.general}</div>}

                    {/* Campos de Información General: Nombre, Descripción, Precio, Categoría... */}
                    <label htmlFor="name">Nombre *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="form-input" required placeholder="Nombre del producto" disabled={isSubmitting}/>
                    {errors.name && <div className="error-message">{errors.name}</div>}

                    <label htmlFor="description">Descripción</label>
                    <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} className="form-input" placeholder="Descripción del producto" disabled={isSubmitting}/>

                    <label htmlFor="price">Precio *</label>
                    <input type="number" id="price" name="price" value={formData.price} onChange={handleChange} className="form-input" required placeholder="0.00" min="0" step="0.01" disabled={isSubmitting}/>
                    {errors.price && <div className="error-message">{errors.price}</div>}

                    <label htmlFor="categoryName">Categoría *</label>
                    <input type="text" id="categoryName" name="categoryName" value={formData.categoryName} onChange={handleChange} className="form-input" required placeholder="Categoría del producto" disabled={isSubmitting}/>
                    {errors.categoryName && <div className="error-message">{errors.categoryName}</div>}

                    {/* SECCIÓN DE INVENTARIO INICIAL */}
                    {!isEditing && (
                        <>
                            {/* 1. SELECTOR DEL ALMACÉN ACTIVO */}
                            <label htmlFor="warehouseId">Almacén de Asignación *</label>

                            {warehouseLoadMessage ? (
                                <p className="loading-message" style={{ margin: '10px 0', fontSize: '0.9em', color: 'gray' }}>{warehouseLoadMessage}</p>
                            ) : (
                                <select
                                    id="warehouseId" name="warehouseId"
                                    value={formData.warehouseId} onChange={handleChange}
                                    className="form-input" required
                                    disabled={isSubmitting || activeWarehouses.length === 0}
                                >
                                    {/* Opción por defecto para asegurar que se seleccione algo */}
                                    <option value="" disabled>Seleccione un almacén activo</option>

                                    {activeWarehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>
                                            {wh.name} (ID: {wh.id})
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.warehouseId && <div className="error-message">{errors.warehouseId}</div>}


                            {/* 2. CANTIDAD INICIAL */}
                            <label htmlFor="initialQuantity">Cantidad Inicial *</label>
                            <input
                                type="number" id="initialQuantity" name="initialQuantity"
                                value={formData.initialQuantity} onChange={handleChange}
                                className="form-input" required
                                placeholder="Stock inicial al registrar" min="0"
                                disabled={isSubmitting}
                            />
                            {errors.initialQuantity && <div className="error-message">{errors.initialQuantity}</div>}

                            {/* 3. STOCK MÍNIMO */}
                            <label htmlFor="minStock">Stock Mínimo *</label>
                            <input
                                type="number" id="minStock" name="minStock"
                                value={formData.minStock} onChange={handleChange}
                                className="form-input" required
                                placeholder="Nivel de alerta de inventario" min="0"
                                disabled={isSubmitting}
                            />
                            {errors.minStock && <div className="error-message">{errors.minStock}</div>}
                        </>
                    )}
                </div>

                {/* Footer/Acciones... */}
                <div className="modal-footer-actions">
                    <button type="button" className="cancel-button-white" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="save-button-orange" disabled={isSubmitting || (!isEditing && activeWarehouses.length === 0)}>
                        {isSubmitting ? 'Guardando...' : submitButtonText}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ProductForm;
