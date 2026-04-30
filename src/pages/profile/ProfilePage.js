import React, { useState, useEffect } from 'react';
import profileService from '../../services/profileService';
import './ProfilePage.css';

const PasswordInput = ({ id, name, label, value, onChange, placeholder, error }) => {
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
                    className={`profile-input${error ? ' profile-input--error' : ''}`}
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    className="profile-toggle-visibility"
                    onClick={() => setVisible(v => !v)}
                    title={visible ? 'Ocultar' : 'Mostrar'}
                >
                    {visible ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    )}
                </button>
            </div>
            {error && <span className="profile-field-error">{error}</span>}
        </div>
    );
};

const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
);
const IconMail = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
);
const IconShield = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);
const IconLock = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const ProfilePage = () => {
    const [profile, setProfile]       = useState(null);
    const [loading, setLoading]       = useState(true);
    const [fetchError, setFetchError] = useState(null);

    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [formErrors, setFormErrors]     = useState({});
    const [submitMsg, setSubmitMsg]       = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const fetchProfile = async () => {
            try {
                const response = await profileService.getMyProfile();
                if (!cancelled) setProfile(response.data);
            } catch (err) {
                if (!cancelled) {
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
        if (submitMsg) setSubmitMsg(null);
    };

    const validate = () => {
        const errors = {};
        if (!form.currentPassword) errors.currentPassword = 'Debes ingresar tu contraseña actual.';
        if (!form.newPassword || form.newPassword.length < 6) errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
        if (!form.confirmPassword) errors.confirmPassword = 'Debes confirmar la nueva contraseña.';
        else if (form.newPassword !== form.confirmPassword) errors.confirmPassword = 'La nueva contraseña y su confirmación no coinciden.';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

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
            setSubmitMsg({ type: 'success', text: 'Contraseña actualizada exitosamente.' });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setFormErrors({});
        } catch (err) {
            const serverMsg = err.response?.data?.message || 'Error al cambiar la contraseña.';
            setSubmitMsg({ type: 'error', text: serverMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRole = (role) => {
        const map = { ADMINISTRADOR: 'Administrador', OPERADOR: 'Operador' };
        return map[role] || role || '—';
    };

    if (loading) {
        return (
            <div className="main-content">
                <div className="profile-loading-state">Cargando perfil…</div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="main-content">
                <div className="profile-alert profile-alert--error">{fetchError}</div>
            </div>
        );
    }

    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : '??';

    return (
        <div className="main-content">

            {/* Encabezado igual al resto del sistema */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Mi Perfil</h1>
                    <p className="page-subtitle">Consulta tu información y gestiona la seguridad de tu cuenta</p>
                </div>
            </div>

            {/* KPIs de resumen — mismo patrón que SupplierList, ProductList */}
            <div className="summary-cards-container">
                <div className="summary-card metric-orange">
                    <div className="card-content">
                        <p className="card-title">Nombre completo</p>
                        <h2 className="card-value profile-kpi-text">{profile?.name || '—'}</h2>
                    </div>
                    <div className="card-icon">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#FF7B00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                </div>

                <div className="summary-card metric-green">
                    <div className="card-content">
                        <p className="card-title">Correo electrónico</p>
                        <h2 className="card-value profile-kpi-text">{profile?.email || '—'}</h2>
                    </div>
                    <div className="card-icon">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                </div>

                <div className="summary-card metric-yellow">
                    <div className="card-content">
                        <p className="card-title">Rol asignado</p>
                        <h2 className="card-value profile-kpi-text">{formatRole(profile?.role)}</h2>
                    </div>
                    <div className="card-icon">
                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Grid de tarjetas detalladas */}
            <div className="profile-main-grid">

                {/* Tarjeta: información del usuario */}
                <div className="profile-detail-card">
                    <div className="profile-card-header-bar">
                        <div className="profile-card-avatar">{initials}</div>
                        <div>
                            <h2 className="profile-card-title">Información de la cuenta</h2>
                            <p className="profile-card-subtitle">Datos asociados a tu usuario en el sistema</p>
                        </div>
                    </div>

                    <div className="profile-info-list">
                        <div className="profile-info-row">
                            <span className="profile-info-label"><IconUser /> Nombre completo</span>
                            <span className="profile-info-value">{profile?.name || '—'}</span>
                        </div>
                        <div className="profile-info-row">
                            <span className="profile-info-label"><IconMail /> Correo electrónico</span>
                            <span className="profile-info-value">{profile?.email || '—'}</span>
                        </div>
                        <div className="profile-info-row" style={{ borderBottom: 'none' }}>
                            <span className="profile-info-label"><IconShield /> Rol asignado</span>
                            <span className={`profile-role-badge profile-role-badge--${profile?.role?.toLowerCase()}`}>
                                {formatRole(profile?.role)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tarjeta: cambio de contraseña */}
                <div className="profile-detail-card">
                    <div className="profile-card-header-bar">
                        <div className="profile-card-icon-box"><IconLock /></div>
                        <div>
                            <h2 className="profile-card-title">Cambiar contraseña</h2>
                            <p className="profile-card-subtitle">Elige una contraseña segura de al menos 6 caracteres</p>
                        </div>
                    </div>

                    {submitMsg && (
                        <div className={`profile-alert profile-alert--${submitMsg.type}`}>
                            {submitMsg.type === 'success' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            )}
                            {submitMsg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate className="profile-form">
                        <PasswordInput id="currentPassword" name="currentPassword" label="Contraseña actual"
                                       value={form.currentPassword} onChange={handleChange}
                                       placeholder="Ingresa tu contraseña actual" error={formErrors.currentPassword} />
                        <PasswordInput id="newPassword" name="newPassword" label="Nueva contraseña"
                                       value={form.newPassword} onChange={handleChange}
                                       placeholder="Mínimo 6 caracteres" error={formErrors.newPassword} />
                        <PasswordInput id="confirmPassword" name="confirmPassword" label="Confirmar nueva contraseña"
                                       value={form.confirmPassword} onChange={handleChange}
                                       placeholder="Repite la nueva contraseña" error={formErrors.confirmPassword} />

                        <button type="submit" className="add-new-button-orange profile-submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default ProfilePage;