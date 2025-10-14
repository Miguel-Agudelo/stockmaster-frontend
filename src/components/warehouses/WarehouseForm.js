//WarehouseForm.js
import React, { useState, useEffect } from 'react';
// RUTA CORREGIDA: Asumiendo que services está un nivel arriba de warehouses
import warehouseService from '../../services/warehouseService';
import './WarehouseForm.css';

const WarehouseForm = ({ onSave, onCancel, currentWarehouse }) => {
    const isEditing = !!currentWarehouse;

    const [formData, setFormData] = useState({
        name: currentWarehouse?.name || '',
        address: currentWarehouse?.address || '',
        city: currentWarehouse?.city || '',
        description: currentWarehouse?.description || '',
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData({
            name: currentWarehouse?.name || '',
            address: currentWarehouse?.address || '',
            city: currentWarehouse?.city || '',
            description: currentWarehouse?.description || '',
        });
        setErrors({});
        setMessage(null);
    }, [currentWarehouse]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) { setErrors(prev => { const newErrors = { ...prev }; delete newErrors[name]; return newErrors; }); }
    };

    const validateForm = () => {
        let formErrors = {};
        if (!formData.name.trim()) formErrors.name = 'El nombre es obligatorio.';
        setErrors(formErrors);
        return Object.keys(formErrors).length === 0;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setErrors({});

        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            if (isEditing) {
                // HU 11: Actualización
                await warehouseService.updateWarehouse(currentWarehouse.id, formData);
                setMessage('Almacén actualizado con éxito.');
            } else {
                // HU 12: Creación
                await warehouseService.createWarehouse(formData);
                setMessage('Almacén creado con éxito.');
            }

            setTimeout(() => { onSave(); }, 1000);

        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error de conexión o datos inválidos.';
            setErrors({ general: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalTitle = isEditing ? 'Editar Almacén' : 'Crear Nuevo Almacén';

    return (
        <div className="form-modal-container">
            <form className="form-modal-content" onSubmit={handleSubmit}>

                <div className="modal-header-edit">
                    <h3>{modalTitle}</h3>
                    <button type="button" onClick={onCancel} className="close-x-button">&times;</button>
                </div>

                {message && !errors.general && <div className="form-message success">{message}</div>}
                {errors.general && <div className="error-message">{errors.general}</div>}

                <div className="modal-body-form">
                    <label htmlFor="name">Nombre *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="form-input" required disabled={isSubmitting}/>
                    {errors.name && <div className="error-message">{errors.name}</div>}

                    <label htmlFor="address">Dirección</label>
                    <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} className="form-input" disabled={isSubmitting}/>

                    <label htmlFor="city">Ciudad</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} className="form-input" disabled={isSubmitting}/>

                    <label htmlFor="description">Descripción</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="form-input" disabled={isSubmitting}/>
                </div>

                <div className="modal-footer-actions">
                    <button type="button" className="cancel-button" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
                    <button type="submit" className="save-button" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Almacén')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WarehouseForm;
