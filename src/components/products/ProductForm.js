import React, { useState, useEffect } from 'react';
import './ProductForm.css';
import productService from '../../services/productService';
import warehouseService from '../../services/warehouseService';
import categoryService from '../../services/categoryService';
import supplierService from '../../services/supplierService';

const ProductForm = ({ onSave, onCancel, currentProduct }) => {
    const isEditing = !!currentProduct;

    const initialState = {
        name: '', description: '', price: '',
        categoryId: '',  // HU-PI2-02: ahora usamos ID en lugar de nombre libre
        warehouseId: '', initialQuantity: '', minStock: '',
        supplierIds: [],  // HU-PI2-01: IDs de proveedores asociados
    };

    const [formData, setFormData]       = useState(initialState);
    const [errors, setErrors]           = useState({});
    const [message, setMessage]         = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeWarehouses, setActiveWarehouses] = useState([]);
    const [categories, setCategories]   = useState([]);  // HU-PI2-02
    const [allSuppliers, setAllSuppliers] = useState([]);   // HU-PI2-01
    const [warehouseLoadMessage, setWarehouseLoadMessage] = useState('Cargando almacenes...');

    useEffect(() => {
        if (currentProduct) {
            setFormData({
                name:        currentProduct.name || '',
                description: currentProduct.description || '',
                price:       currentProduct.price !== undefined ? currentProduct.price.toString() : '',
                categoryId:  currentProduct.categoryId ? currentProduct.categoryId.toString() : '',
                warehouseId: '', initialQuantity: '', minStock: '',
                supplierIds: currentProduct.suppliers ? currentProduct.suppliers.map(s => s.id) : [],
            });
        } else {
            setFormData(initialState);
        }
        setErrors({});
        setMessage('');

        // Cargar categorías para el selector
        categoryService.getAllCategories()
            .then(res => setCategories(res.data))
            .catch(() => setCategories([]));

        // HU-PI2-01: cargar proveedores activos para el selector
        supplierService.getAllSuppliers()
            .then(res => setAllSuppliers(res.data.filter(s => s.active)))
            .catch(() => setAllSuppliers([]));

        // Cargar almacenes activos (solo en creación)
        const fetchActiveWarehouses = async () => {
            if (isEditing) return;
            try {
                const warehouses = await warehouseService.getActiveWarehousesList();
                setActiveWarehouses(warehouses);
                if (warehouses.length > 0) {
                    setFormData(prev => ({ ...prev, warehouseId: warehouses[0].id.toString() }));
                    setWarehouseLoadMessage(null);
                } else {
                    setWarehouseLoadMessage('No hay almacenes activos disponibles.');
                }
            } catch {
                setWarehouseLoadMessage('Error al cargar almacenes.');
                setActiveWarehouses([]);
            }
        };
        fetchActiveWarehouses();
    }, [currentProduct]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        setMessage('');
    };

    const validate = () => {
        const errs = {};
        if (!formData.name)       errs.name = 'El nombre es obligatorio.';
        if (!formData.categoryId) errs.categoryId = 'La categoría es obligatoria.';
        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) errs.price = 'El precio debe ser mayor a 0.';
        if (!isEditing) {
            if (activeWarehouses.length === 0) errs.warehouseId = 'No hay almacenes activos.';
            else if (!formData.warehouseId)    errs.warehouseId = 'Selecciona un almacén.';
            const qty = parseInt(formData.initialQuantity);
            if (isNaN(qty) || qty < 0) errs.initialQuantity = 'Cantidad inicial inválida.';
            const min = parseInt(formData.minStock);
            if (isNaN(min) || min < 0)   errs.minStock = 'Stock mínimo inválido.';
            if (!isNaN(qty) && !isNaN(min) && qty < min)
                errs.minStock = 'El stock mínimo no puede ser mayor que la cantidad inicial.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) { setMessage('Corrija los errores del formulario.'); return; }
        setIsSubmitting(true);
        try {
            const productData = {
                name:        formData.name,
                description: formData.description,
                price:       parseFloat(formData.price),
                categoryId:  parseInt(formData.categoryId),
                supplierIds: formData.supplierIds,  // HU-PI2-01
            };
            if (isEditing) {
                if (!currentProduct?.id) {
                    setErrors({ general: 'ID de producto inválido. Recarga la página.' });
                    return;
                }
                await productService.updateProduct(currentProduct.id, productData);
                setMessage('Producto actualizado exitosamente.');
            } else {
                await productService.createProduct({
                    ...productData,
                    warehouseId:     parseInt(formData.warehouseId),
                    initialQuantity: parseInt(formData.initialQuantity),
                    minStock:        parseInt(formData.minStock),
                });
                setMessage('Producto creado exitosamente.');
            }
            setTimeout(() => onSave(), 900);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar el producto.';
            setErrors({ general: msg });
            setMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // HU-PI2-01: toggle de proveedor seleccionado
    const toggleSupplier = (supplierId) => {
        setFormData(prev => {
            const ids = prev.supplierIds.includes(supplierId)
                ? prev.supplierIds.filter(id => id !== supplierId)
                : [...prev.supplierIds, supplierId];
            return { ...prev, supplierIds: ids };
        });
    };

    // Construir opciones del selector mostrando jerarquía: "Tecnología > Periféricos"
    const buildCategoryOptions = () => {
        const roots = categories.filter(c => !c.parentCategoryId);
        const subs  = categories.filter(c =>  c.parentCategoryId);
        const opts  = [];
        roots.forEach(root => {
            opts.push(<option key={root.id} value={root.id}>{root.name}</option>);
            subs.filter(s => s.parentCategoryId === root.id).forEach(sub => {
                opts.push(<option key={sub.id} value={sub.id}>&nbsp;&nbsp;&nbsp;↳ {sub.name}</option>);
            });
        });
        return opts;
    };

    return (
        <div className="form-modal-container">
            <form className="form-modal-content" onSubmit={handleSubmit}>
                <div className="modal-header-edit">
                    <h3>{isEditing ? 'Editar Producto' : 'Crear Producto'}</h3>
                    <p>{isEditing ? 'Modifique la información del producto' : 'Complete los datos del nuevo producto'}</p>
                    <button type="button" onClick={onCancel} className="close-x-button">&times;</button>
                </div>

                <div className="modal-body-form">
                    {message && !errors.general && <div className="form-message">{message}</div>}
                    {errors.general && <div className="error-message">{errors.general}</div>}

                    <label htmlFor="name">Nombre *</label>
                    <input type="text" id="name" name="name" value={formData.name}
                           onChange={handleChange} className="form-input" placeholder="Nombre del producto"
                           disabled={isSubmitting} />
                    {errors.name && <div className="error-message">{errors.name}</div>}

                    <label htmlFor="description">Descripción</label>
                    <input type="text" id="description" name="description" value={formData.description}
                           onChange={handleChange} className="form-input" placeholder="Descripción del producto"
                           disabled={isSubmitting} />

                    <label htmlFor="price">Precio *</label>
                    <input type="number" id="price" name="price" value={formData.price}
                           onChange={handleChange} className="form-input" placeholder="0.00"
                           min="0" step="0.01" disabled={isSubmitting} />
                    {errors.price && <div className="error-message">{errors.price}</div>}

                    {/* HU-PI2-02: selector de categoría por ID */}
                    <label htmlFor="categoryId">Categoría *</label>
                    <select id="categoryId" name="categoryId" value={formData.categoryId}
                            onChange={handleChange} className="form-input" disabled={isSubmitting}>
                        <option value="" disabled>Seleccionar categoría...</option>
                        {buildCategoryOptions()}
                    </select>
                    {errors.categoryId && <div className="error-message">{errors.categoryId}</div>}

                    {/* HU-PI2-01: Proveedores asociados */}
                    {allSuppliers.length > 0 && (
                        <>
                            <label>Proveedores asociados</label>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', padding:'8px 0' }}>
                                {allSuppliers.map(s => {
                                    const selected = formData.supplierIds.includes(s.id);
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleSupplier(s.id)}
                                            disabled={isSubmitting}
                                            style={{
                                                padding:'5px 12px', borderRadius:'20px',
                                                fontSize:'0.82rem', fontFamily:'inherit',
                                                cursor:'pointer', transition:'all 0.15s',
                                                border: selected ? '1px solid #F97316' : '1px solid #D1D5DB',
                                                background: selected ? '#FFF7ED' : '#fff',
                                                color: selected ? '#C2410C' : '#6B7280',
                                                fontWeight: selected ? '600' : '400',
                                            }}
                                        >
                                            {s.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ fontSize:'0.78rem', color:'#9CA3AF' }}>
                                Selecciona uno o varios proveedores que suministran este producto.
                            </div>
                        </>
                    )}

                    {!isEditing && (
                        <>
                            <label htmlFor="warehouseId">Almacén de Asignación *</label>
                            {warehouseLoadMessage ? (
                                <p style={{ margin:'8px 0', fontSize:'0.88rem', color:'gray' }}>{warehouseLoadMessage}</p>
                            ) : (
                                <select id="warehouseId" name="warehouseId" value={formData.warehouseId}
                                        onChange={handleChange} className="form-input"
                                        disabled={isSubmitting || activeWarehouses.length === 0}>
                                    <option value="" disabled>Seleccione un almacén activo</option>
                                    {activeWarehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name} (ID: {wh.id})</option>
                                    ))}
                                </select>
                            )}
                            {errors.warehouseId && <div className="error-message">{errors.warehouseId}</div>}

                            <label htmlFor="initialQuantity">Cantidad Inicial *</label>
                            <input type="number" id="initialQuantity" name="initialQuantity"
                                   value={formData.initialQuantity} onChange={handleChange}
                                   className="form-input" placeholder="Stock inicial" min="0"
                                   disabled={isSubmitting} />
                            {errors.initialQuantity && <div className="error-message">{errors.initialQuantity}</div>}

                            <label htmlFor="minStock">Stock Mínimo *</label>
                            <input type="number" id="minStock" name="minStock"
                                   value={formData.minStock} onChange={handleChange}
                                   className="form-input" placeholder="Nivel de alerta" min="0"
                                   disabled={isSubmitting} />
                            {errors.minStock && <div className="error-message">{errors.minStock}</div>}
                        </>
                    )}
                </div>

                <div className="modal-footer-actions">
                    <button type="button" className="cancel-button-white" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="save-button-orange"
                            disabled={isSubmitting || (!isEditing && activeWarehouses.length === 0)}>
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
