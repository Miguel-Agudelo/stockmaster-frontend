import React, { useState, useEffect } from 'react';
import profileService from '../../services/profileService';
import './ProfilePage.css';

// ─── Componente de input de contraseña con toggle de visibilidad ──────────────
const PasswordInput = ({ id, name, label, value, onChange, placeholder }) => {
    const [visible, setVisible] = useState(false);
    return (
        <div className="profile-field-group">
            <label htmlFor={id} className="profile-field-label">{label}</label>
            <div className="profile-password-wrapper">
                <input
                    id={id}
                    name={name}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="profile-input"
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    className="profile-toggle-visibility"
                    onClick={() => setVisible(v => !v)}
                    title={visible ? 'Ocultar' : 'Mostrar'}
                >
                    {visible ? '🙈' : '👁'}
                </button>
            </div>
        </div>
    );
};

// ─── Página de Perfil principal ───────────────────────────────────────────────
const ProfilePage = () => {
    // ── Estado del perfil
    const [profile, setProfile]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // ── Estado del formulario de cambio de contraseña
    const [form, setForm] = useState({
        currentPassword:  '',
        newPassword:      '',
        confirmPassword:  '',
    });
    const [formErrors, setFormErrors]     = useState({});
    const [submitMsg, setSubmitMsg]       = useState(null); // { type: 'success'|'error', text: '' }
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Cargar perfil al montar
    useEffect(() => {
        let cancelled = false;

        const fetchProfile = async () => {
            try {
                const response = await profileService.getMyProfile();
                if (!cancelled) setProfile(response.data);
            } catch (err) {
                if (!cancelled) {
                    console.error('Error al cargar perfil:', err);
                    const detail = err.response
                        ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
                        : err.message;
                    setFetchError(`No se pudo cargar la información del perfil. Detalle: ${detail}`);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProfile();
        return () => { cancelled = true; };
    }, []);

    // ── Manejar cambios en el formulario (lee e.target.name)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        }
        if (submitMsg) setSubmitMsg(null);
    };

    // ── Validación del formulario en el cliente
    const validate = () => {
        const errors = {};
        if (!form.currentPassword)
            errors.currentPassword = 'Debes ingresar tu contraseña actual.';
        if (!form.newPassword || form.newPassword.length < 6)
            errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
        if (!form.confirmPassword)
            errors.confirmPassword = 'Debes confirmar la nueva contraseña.';
        else if (form.newPassword !== form.confirmPassword)
            errors.confirmPassword = 'La nueva contraseña y su confirmación no coinciden.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // ── Envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        setSubmitMsg(null);

        try {
            await profileService.changePassword({
                currentPassword: form.currentPassword,
                newPassword:     form.newPassword,
                confirmPassword: form.confirmPassword,
            });
            setSubmitMsg({ type: 'success', text: '✅ Contraseña actualizada exitosamente.' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setFormErrors({});
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Error al cambiar la contraseña.';
            setSubmitMsg({ type: 'error', text: serverMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Helper de presentación del rol
    const formatRole = (role) => {
        const map = { ADMINISTRADOR: 'Administrador', OPERADOR: 'Operador' };
        return map[role] || role || '—';
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-loading">Cargando perfil…</div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="profile-page">
                <div className="profile-alert profile-alert--error">{fetchError}</div>
            </div>
        );
    }

    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??';

    return (
        <div className="profile-page">

            {/* ── Encabezado de la página ── */}
            <div className="profile-page-header">
                <h1 className="profile-page-title">Mi Perfil</h1>
                <p className="profile-page-subtitle">
                    Consulta tu información y gestiona la seguridad de tu cuenta.
                </p>
            </div>

            <div className="profile-cards-container">

                {/* ── Tarjeta: Información del usuario ── */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-avatar">{initials}</div>
                        <div>
                            <h2 className="profile-card-title">Información de la cuenta</h2>
                            <p className="profile-card-subtitle">Datos asociados a tu usuario</p>
                        </div>
                    </div>

                    <div className="profile-info-list">
                        <div className="profile-info-row">
                            <span className="profile-info-label">👤 Nombre</span>
                            <span className="profile-info-value">{profile?.name || '—'}</span>
                        </div>
                        <div className="profile-info-row">
                            <span className="profile-info-label">✉️ Correo electrónico</span>
                            <span className="profile-info-value">{profile?.email || '—'}</span>
                        </div>
                        <div className="profile-info-row">
                            <span className="profile-info-label">🛡️ Rol asignado</span>
                            <span className={`profile-role-badge profile-role-badge--${profile?.role?.toLowerCase()}`}>
                                {formatRole(profile?.role)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Tarjeta: Cambio de contraseña ── */}
                <div className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-card-icon-box">🔒</div>
                        <div>
                            <h2 className="profile-card-title">Cambiar contraseña</h2>
                            <p className="profile-card-subtitle">
                                Elige una contraseña segura de al menos 6 caracteres
                            </p>
                        </div>
                    </div>

                    {/* Mensaje de resultado */}
                    {submitMsg && (
                        <div className={`profile-alert profile-alert--${submitMsg.type}`}>
                            {submitMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="profile-form">

                        <PasswordInput
                            id="currentPassword"
                            name="currentPassword"
                            label="Contraseña actual"
                            value={form.currentPassword}
                            onChange={handleChange}
                            placeholder="Ingresa tu contraseña actual"
                        />
                        {formErrors.currentPassword && (
                            <span className="profile-field-error">{formErrors.currentPassword}</span>
                        )}

                        <PasswordInput
                            id="newPassword"
                            name="newPassword"
                            label="Nueva contraseña"
                            value={form.newPassword}
                            onChange={handleChange}
                            placeholder="Mínimo 6 caracteres"
                        />
                        {formErrors.newPassword && (
                            <span className="profile-field-error">{formErrors.newPassword}</span>
                        )}

                        <PasswordInput
                            id="confirmPassword"
                            name="confirmPassword"
                            label="Confirmar nueva contraseña"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Repite la nueva contraseña"
                        />
                        {formErrors.confirmPassword && (
                            <span className="profile-field-error">{formErrors.confirmPassword}</span>
                        )}

                        <button
                            type="submit"
                            className="profile-submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
                        </button>

                    </form>
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;