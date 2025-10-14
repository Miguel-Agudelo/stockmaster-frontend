//UserForm.js
import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import './UserForm.css';

const UserForm = ({ onSave, onCancel, currentUser }) => {

    const isEditing = !!currentUser;
    const MIN_PASSWORD_LENGTH = 6; // 🎯 Nuevo: Definimos el mínimo aquí

    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        password: '',
        role: currentUser?.role || 'OPERADOR',
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData({
            name: currentUser?.name || '',
            email: currentUser?.email || '',
            password: '',
            role: currentUser?.role || 'OPERADOR',
        });
        setErrors({});
        setMessage(null);
    }, [currentUser]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // 🎯 FUNCIÓN DE VALIDACIÓN MANUAL
    const validate = () => {
        let formErrors = {};
        let isValid = true;

        // Validación de Contraseña (Solo en modo creación)
        if (!isEditing && formData.password.length < MIN_PASSWORD_LENGTH) {
            formErrors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
            isValid = false;
        }

        // Podrías añadir validación para name y email aquí también
        if (!formData.name.trim()) {
            formErrors.name = 'El nombre es obligatorio.';
            isValid = false;
        }

        setErrors(formErrors);
        return isValid;
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🎯 CLAVE: Ejecutamos la validación del Frontend antes de hacer el envío
        if (!validate()) {
            // Si la validación falla, detenemos el proceso aquí.
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        setErrors({}); // Limpiamos errores generales antes de enviar

        try {
            if (isEditing) {
                // MODO EDICIÓN
                const dataToSend = {
                    name: formData.name,
                    role: formData.role,
                    email: formData.email
                };
                await userService.updateUser(currentUser.id, dataToSend);
            } else {
                // MODO CREACIÓN
                await userService.createUser(formData);
            }

            setMessage('Usuario guardado con éxito');

            // Usamos un timeout para que el usuario vea el mensaje de éxito antes de cerrar
            setTimeout(() => {
                onSave();
            }, 1000);

        } catch (error) {
            console.error("Error al guardar usuario:", error.response?.data || error.message);

            // Asumimos que el backend devuelve un mensaje útil
            const errorMessage = error.response?.data?.message || 'Error de conexión o datos inválidos.';

            // Si el error viene específicamente del campo de contraseña, podemos mostrarlo ahí
            if (errorMessage.toLowerCase().includes('password')) {
                setErrors({ password: errorMessage });
            } else {
                setErrors({ general: errorMessage });
            }
            setMessage(null); // Ocultamos el mensaje de éxito si hay error

        } finally {
            setIsSubmitting(false);
        }
    };


    // --- TEXTOS DINÁMICOS y JSX ---
    const modalTitle = isEditing ? 'Editar Usuario' : 'Nuevo Usuario';
    const modalSubtitle = isEditing ? 'Modifique los datos del usuario' : 'Ingrese la información del nuevo usuario';
    const submitButtonText = isEditing ? 'Guardar Cambios' : 'Crear Usuario';


    return (
        <div className="form-modal-container">
            <form className="form-modal-content" onSubmit={handleSubmit}>

                <div className="modal-header-edit">
                    <h3>{modalTitle}</h3>
                    <p>{modalSubtitle}</p>
                    <button type="button" onClick={onCancel} className="close-x-button">
                        &times;
                    </button>
                </div>

                <div className="modal-body-form">
                    {/* Mensajes de feedback */}
                    {message && <div className="form-message">{message}</div>}
                    {errors.general && <div className="error-message">{errors.general}</div>}

                    {/* Campo Nombre */}
                    <label htmlFor="name">Nombre</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                        required
                        disabled={isSubmitting}
                    />
                    {errors.name && <div className="error-message">{errors.name}</div>} {/* Mostrar error de nombre */}

                    {/* Campo Email (deshabilitado en edición) */}
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        required
                        disabled={isEditing || isSubmitting}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}

                    {/* Campo Rol (Select) */}
                    <label htmlFor="role">Rol</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-select"
                        required
                        disabled={isSubmitting}
                    >
                        <option value="OPERADOR">Operador</option>
                        <option value="ADMINISTRADOR">Administrador</option>
                    </select>

                    {/* Campo Contraseña (Solo en Creación) */}
                    {!isEditing && (
                        <>
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input"
                                required
                                disabled={isSubmitting}
                            />
                            <small className="form-hint-text">
                                Debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.
                            </small>
                            {errors.password && <div className="error-message">{errors.password}</div>} {/* Mostrar error de contraseña */}
                        </>
                    )}

                </div>

                {/* Footer/Acciones */}
                <div className="modal-footer-actions">
                    <button type="button" className="cancel-button-white" onClick={onCancel} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button type="submit" className="save-button-orange" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : submitButtonText}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default UserForm;