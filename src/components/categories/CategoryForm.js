import React, { useState, useEffect } from 'react';
import './CategoryForm.css';
import categoryService from '../../services/categoryService';

const CategoryForm = ({ onSave, onCancel, currentCategory }) => {
    const isEditing = !!currentCategory;

    const [formData, setFormData] = useState({ name: '', parentCategoryId: null });
    const [isSubcategory, setIsSubcategory] = useState(false);
    const [rootCategories, setRootCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentCategory) {
            setFormData({
                name: currentCategory.name || '',
                parentCategoryId: currentCategory.parentCategoryId || null,
            });
            setIsSubcategory(!!currentCategory.parentCategoryId);
        } else {
            setFormData({ name: '', parentCategoryId: null });
            setIsSubcategory(false);
        }
        setErrors({});
        setMessage('');

        // Cargar raíces para el selector de padre
        categoryService.getRootCategories()
            .then(res => setRootCategories(res.data))
            .catch(() => setRootCategories([]));
    }, [currentCategory]);

    const handleToggleType = (type) => {
        setIsSubcategory(type === 'sub');
        setFormData(prev => ({ ...prev, parentCategoryId: null }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'parentCategoryId' ? (value ? parseInt(value) : null) : value,
        }));
        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        setMessage('');
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'El nombre es obligatorio.';
        if (isSubcategory && !formData.parentCategoryId) errs.parentCategoryId = 'Debes seleccionar la categoría padre.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                parentCategoryId: isSubcategory ? formData.parentCategoryId : null,
            };
            if (isEditing) {
                await categoryService.updateCategory(currentCategory.id, payload);
                setMessage('Categoría actualizada exitosamente.');
            } else {
                await categoryService.createCategory(payload);
                setMessage('Categoría creada exitosamente.');
            }
            setTimeout(() => onSave(), 800);
        } catch (err) {
            const msg = err.response?.data?.message || 'Error al guardar la categoría.';
            setErrors({ general: msg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtrar la propia categoría del selector de padres (al editar)
    const parentOptions = rootCategories.filter(c => !currentCategory || c.id !== currentCategory.id);

    return (
        <div className="category-form-modal">
            <div className="category-form-header">
                <div>
                    <h3>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                    <p>{isEditing ? 'Modifica el nombre o jerarquía de la categoría' : 'Crea una categoría principal o subcategoría'}</p>
                </div>
                <button type="button" onClick={onCancel} style={{ background:'none', border:'none', fontSize:'1.3rem', cursor:'pointer', color:'#9CA3AF' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="category-form-body">
                    {errors.general && <div className="form-error-msg">{errors.general}</div>}
                    {message && !errors.general && <div className="form-success-msg">{message}</div>}

                    <div>
                        <label>Nombre de la categoría *</label>
                        <input
                            className="form-input"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Ej: Electrónica, Periféricos..."
                            disabled={isSubmitting}
                        />
                        {errors.name && <div className="form-error-msg">{errors.name}</div>}
                    </div>

                    <div>
                        <label>Tipo de categoría</label>
                        <div className="type-toggle">
                            <button
                                type="button"
                                className={!isSubcategory ? 'active-root' : ''}
                                onClick={() => handleToggleType('root')}
                                disabled={isSubmitting}
                            >
                                Categoría raíz
                            </button>
                            <button
                                type="button"
                                className={isSubcategory ? 'active-sub' : ''}
                                onClick={() => handleToggleType('sub')}
                                disabled={isSubmitting}
                            >
                                Subcategoría
                            </button>
                        </div>
                        <div className="form-hint">
                            {isSubcategory
                                ? 'Pertenece a una categoría principal existente.'
                                : 'Nivel principal del catálogo (ej: Tecnología, Papelería).'}
                        </div>
                    </div>

                    {isSubcategory && (
                        <div>
                            <label>Categoría padre *</label>
                            <select
                                className="form-select"
                                name="parentCategoryId"
                                value={formData.parentCategoryId || ''}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            >
                                <option value="" disabled>Seleccionar categoría padre...</option>
                                {parentOptions.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {errors.parentCategoryId && <div className="form-error-msg">{errors.parentCategoryId}</div>}
                            {parentOptions.length === 0 && (
                                <div className="form-hint" style={{ color: '#F97316' }}>
                                    No hay categorías raíz disponibles. Crea primero una categoría principal.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="category-form-footer">
                    <button type="button" className="btn-cancel-cat" onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
                    <button type="submit" className="btn-save-cat" disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;
