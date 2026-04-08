import React, { useState, useEffect } from 'react';
import './SupplierForm.css';
import supplierService from '../../services/supplierService';

const SupplierForm = ({ onSave, onCancel, currentSupplier }) => {
    const isEditing = !!currentSupplier;

    const emptyForm = { name: '', nit: '', phone: '', email: '', address: '' };
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors]     = useState({});
    const [message, setMessage]   = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentSupplier) {
            setFormData({
                name:    currentSupplier.name    || '',
                nit:     currentSupplier.nit     || '',
                phone:   currentSupplier.phone   || '',
                email:   currentSupplier.email   || '',
                address: currentSupplier.address || '',
            });
        } else {
            setFormData(emptyForm);
        }
        setErrors({});
        setMessage('');
    }, [currentSupplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        setMessage('');
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'El nombre es obligatorio.';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errs.email = 'El correo electrónico no tiene un formato válido.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const payload = {
                name:    formData.name.trim(),
                nit:     formData.nit.trim()  || null,
                phone:   formData.phone.trim()|| null,
                email:   formData.email.trim()|| null,
                address: formData.address.trim() || null,
            };
            if (isEditing) {
                await supplierService.updateSupplier(currentSupplier.id, payload);
                setMessage('Proveedor actualizado exitosamente.');
            } else {
                await supplierService.createSupplier(payload);
                setMessage('Proveedor creado exitosamente.');
            }
            setTimeout(() => onSave(), 800);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar el proveedor.';
            setErrors({ general: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="supplier-form-modal">
            <div className="supplier-form-header">
                <div>
                    <h3>{isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                    <p>{isEditing ? 'Modifica la información del proveedor' : 'Registra un nuevo proveedor en el catálogo'}</p>
                </div>
                <button type="button" onClick={onCancel}
                        style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#9CA3AF' }}>
                    &times;
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="supplier-form-body">
                    {errors.general && <div className="form-error-sup">{errors.general}</div>}
                    {message && !errors.general && <div className="form-success-sup">{message}</div>}

                    {/* Nombre — campo obligatorio */}
                    <div>
                        <label>Nombre del proveedor *</label>
                        <input className="form-input" type="text" name="name"
                               value={formData.name} onChange={handleChange}
                               placeholder="Ej: TechDistrib S.A.S" disabled={isSubmitting} />
                        {errors.name && <div className="form-error-sup">{errors.name}</div>}
                    </div>

                    <div className="supplier-form-grid">
                        {/* NIT */}
                        <div>
                            <label>NIT / Identificación</label>
                            <input className="form-input" type="text" name="nit"
                                   value={formData.nit} onChange={handleChange}
                                   placeholder="Ej: 900.123.456-1" disabled={isSubmitting} />
                            {errors.nit && <div className="form-error-sup">{errors.nit}</div>}
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label>Teléfono</label>
                            <input className="form-input" type="text" name="phone"
                                   value={formData.phone} onChange={handleChange}
                                   placeholder="Ej: 314 567 8901" disabled={isSubmitting} />
                        </div>
                    </div>

                    {/* Correo */}
                    <div>
                        <label>Correo electrónico</label>
                        <input className="form-input" type="email" name="email"
                               value={formData.email} onChange={handleChange}
                               placeholder="Ej: ventas@proveedor.com" disabled={isSubmitting} />
                        {errors.email && <div className="form-error-sup">{errors.email}</div>}
                    </div>

                    {/* Dirección */}
                    <div>
                        <label>Dirección</label>
                        <input className="form-input" type="text" name="address"
                               value={formData.address} onChange={handleChange}
                               placeholder="Ej: Calle 80 #45-32, Bogotá" disabled={isSubmitting} />
                    </div>
                </div>

                <div className="supplier-form-footer">
                    <button type="button" className="btn-cancel-sup" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-save-sup" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SupplierForm;
