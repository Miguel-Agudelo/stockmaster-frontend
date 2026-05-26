import React, { useState, useEffect, useCallback, useRef } from "react";
import profileService from "../profileService";
import authService from "../../auth/authService";
import {
  initGoogleGsi,
  renderGoogleButton,
  googleClientId,
} from "../../auth/googleGsiService";
import "./ProfilePage.css";

/* ── Subcomponentes ─────────────────────────────────────────────────────── */

const PasswordInput = ({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  error,
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="profile-field-group">
      <label htmlFor={id} className="profile-field-label">
        {label}
      </label>
      <div className="profile-password-wrapper">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`profile-input${error ? " profile-input--error" : ""}`}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="profile-toggle-visibility"
          onClick={() => setVisible((v) => !v)}
          title={visible ? "Ocultar" : "Mostrar"}
        >
          {visible ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <span className="profile-field-error">{error}</span>}
    </div>
  );
};

const IconUser = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconShield = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLock = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconGoogle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

/* ── Componente principal ────────────────────────────────────────────────── */

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitMsg, setSubmitMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleMsg, setGoogleMsg] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleBtnRendered, setGoogleBtnRendered] = useState(false);

  const googleBtnRef = useRef(null);

  /* ── Carga perfil + estado de vinculación ──────────────────────────── */
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [profileRes, googleStatusRes] = await Promise.all([
          profileService.getMyProfile(),
          authService.getGoogleLinkStatus(),
        ]);
        if (!cancelled) {
          setProfile(profileRes.data);
          setGoogleLinked(googleStatusRes.data.googleLinked);
        }
      } catch (err) {
        if (!cancelled) {
          const detail = err.response
            ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
            : err.message;
          setFetchError(
            `No se pudo cargar la información del perfil. Detalle: ${detail}`,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Inicializar Google y renderizar botón ─────────────────────────── */
  const handleGoogleLinkResponse = useCallback(async (response) => {
    setGoogleLoading(true);
    setGoogleMsg(null);
    try {
      await authService.linkGoogleAccount(response.credential);
      setGoogleLinked(true);
      setGoogleBtnRendered(false);
      setGoogleMsg({
        type: "success",
        text: "Cuenta de Google vinculada exitosamente.",
      });
    } catch (err) {
      const serverMsg =
        err.response?.data?.message || "Error al vincular la cuenta de Google.";
      setGoogleMsg({ type: "error", text: serverMsg });
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  // EFECTO 1: Inicializar Google GSI una sola vez
  const [googleReady, setGoogleReady] = useState(false);
  useEffect(() => {
    if (!googleClientId) return;
    initGoogleGsi(handleGoogleLinkResponse)
      .then(() => setGoogleReady(true))
      .catch(() => setGoogleMsg({
        type: "error",
        text: "No se pudo cargar el servicio de Google. Verifica tu conexión.",
      }));
  }, [handleGoogleLinkResponse]);

  // EFECTO 2: Renderizar botón cuando el div esté en el DOM y tenga ancho
  // Se usa un callback ref para detectar exactamente cuando el div se monta
  const googleBtnCallbackRef = useCallback((node) => {
    googleBtnRef.current = node;
    if (!node || !googleReady || googleLinked) return;

    // El nodo acaba de montarse — esperar al siguiente frame para que el layout calcule el ancho
    requestAnimationFrame(() => {
      if (!node) return;
      const width = node.offsetWidth || node.parentElement?.offsetWidth || 400;
      node.innerHTML = '';
      renderGoogleButton(node, { text: "continue_with", width });
      setGoogleBtnRendered(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleReady, googleLinked]);

  /* ── Desvincular ───────────────────────────────────────────────────── */
  const handleUnlinkGoogle = async () => {
    setGoogleLoading(true);
    setGoogleMsg(null);
    try {
      await authService.unlinkGoogleAccount();
      setGoogleLinked(false);
      setGoogleMsg({
        type: "success",
        text: "Cuenta de Google desvinculada. Ahora solo puedes acceder con correo y contraseña.",
      });
    } catch (err) {
      const serverMsg =
        err.response?.data?.message ||
        "Error al desvincular la cuenta de Google.";
      setGoogleMsg({ type: "error", text: serverMsg });
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ── Contraseña ─────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name])
      setFormErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    if (submitMsg) setSubmitMsg(null);
  };

  const validate = () => {
    const errors = {};
    if (!form.currentPassword)
      errors.currentPassword = "Debes ingresar tu contraseña actual.";
    if (!form.newPassword || form.newPassword.length < 6)
      errors.newPassword =
        "La nueva contraseña debe tener al menos 6 caracteres.";
    if (!form.confirmPassword)
      errors.confirmPassword = "Debes confirmar la nueva contraseña.";
    else if (form.newPassword !== form.confirmPassword)
      errors.confirmPassword =
        "La nueva contraseña y su confirmación no coinciden.";
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
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setSubmitMsg({
        type: "success",
        text: "Contraseña actualizada exitosamente.",
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setFormErrors({});
    } catch (err) {
      const serverMsg =
        err.response?.data?.message || "Error al cambiar la contraseña.";
      setSubmitMsg({ type: "error", text: serverMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRole = (role) => {
    const map = { ADMINISTRADOR: "Administrador", OPERADOR: "Operador" };
    return map[role] || role || "—";
  };

  if (loading)
    return (
      <div className="main-content">
        <div className="profile-loading-state">Cargando perfil…</div>
      </div>
    );

  if (fetchError)
    return (
      <div className="main-content">
        <div className="profile-alert profile-alert--error">{fetchError}</div>
      </div>
    );

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "??";

  return (
    <div className="main-content">
      <div className="page-header">
        <div className="title-group">
          <h1>Mi Perfil</h1>
          <p className="page-subtitle">
            Consulta tu información y gestiona la seguridad de tu cuenta
          </p>
        </div>
      </div>

      <div className="summary-cards-container">
        <div className="summary-card metric-orange">
          <div className="card-content">
            <p className="card-title">Nombre completo</p>
            <h2 className="card-value profile-kpi-text">
              {profile?.name || "—"}
            </h2>
          </div>
          <div className="card-icon">
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FF7B00"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        </div>
        <div className="summary-card metric-green">
          <div className="card-content">
            <p className="card-title">Correo electrónico</p>
            <h2 className="card-value profile-kpi-text">
              {profile?.email || "—"}
            </h2>
          </div>
          <div className="card-icon">
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>
        <div className="summary-card metric-yellow">
          <div className="card-content">
            <p className="card-title">Rol asignado</p>
            <h2 className="card-value profile-kpi-text">
              {formatRole(profile?.role)}
            </h2>
          </div>
          <div className="card-icon">
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="profile-main-grid">
        <div className="profile-detail-card">
          <div className="profile-card-header-bar">
            <div className="profile-card-avatar">{initials}</div>
            <div>
              <h2 className="profile-card-title">Información de la cuenta</h2>
              <p className="profile-card-subtitle">
                Datos asociados a tu usuario en el sistema
              </p>
            </div>
          </div>
          <div className="profile-info-list">
            <div className="profile-info-row">
              <span className="profile-info-label">
                <IconUser /> Nombre completo
              </span>
              <span className="profile-info-value">{profile?.name || "—"}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">
                <IconMail /> Correo electrónico
              </span>
              <span className="profile-info-value">
                {profile?.email || "—"}
              </span>
            </div>
            <div className="profile-info-row" style={{ borderBottom: "none" }}>
              <span className="profile-info-label">
                <IconShield /> Rol asignado
              </span>
              <span
                className={`profile-role-badge profile-role-badge--${profile?.role?.toLowerCase()}`}
              >
                {formatRole(profile?.role)}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-detail-card">
          <div className="profile-card-header-bar">
            <div className="profile-card-icon-box">
              <IconLock />
            </div>
            <div>
              <h2 className="profile-card-title">Cambiar contraseña</h2>
              <p className="profile-card-subtitle">
                Elige una contraseña segura de al menos 6 caracteres
              </p>
            </div>
          </div>
          {submitMsg && (
            <div className={`profile-alert profile-alert--${submitMsg.type}`}>
              {submitMsg.type === "success" ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
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
              error={formErrors.currentPassword}
            />
            <PasswordInput
              id="newPassword"
              name="newPassword"
              label="Nueva contraseña"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              error={formErrors.newPassword}
            />
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar nueva contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repite la nueva contraseña"
              error={formErrors.confirmPassword}
            />
            <button
              type="submit"
              className="add-new-button-orange profile-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>

      {/* ── HU-PI2-06: Tarjeta Google ──────────────────────────────────── */}
      {googleClientId && (
        <div className="profile-google-card">
          <div className="profile-card-header-bar">
            <div className="profile-card-icon-box profile-google-icon-box">
              <IconGoogle />
            </div>
            <div>
              <h2 className="profile-card-title">Cuenta de Google</h2>
              <p className="profile-card-subtitle">
                {googleLinked
                  ? "Tu cuenta de Google está vinculada. Puedes iniciar sesión con Google o con tu correo y contraseña."
                  : "Vincula tu cuenta de Google para iniciar sesión más rápido sin ingresar tu contraseña."}
              </p>
            </div>
            <div className="profile-google-status-badge">
              {googleLinked ? (
                <span className="profile-google-badge profile-google-badge--linked">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Vinculado
                </span>
              ) : (
                <span className="profile-google-badge profile-google-badge--unlinked">
                  No vinculado
                </span>
              )}
            </div>
          </div>

          <div className="profile-google-body">
            {googleMsg && (
              <div
                className={`profile-alert profile-alert--${googleMsg.type}`}
                style={{ margin: "0 0 16px 0" }}
              >
                {googleMsg.type === "success" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {googleMsg.text}
              </div>
            )}

            {!googleLinked ? (
              <div className="profile-google-action">
                <p className="profile-google-hint">
                  El correo de tu cuenta de Google debe coincidir con{" "}
                  <strong>{profile?.email}</strong>.
                </p>

                <div
                  ref={googleBtnCallbackRef}
                  style={{
                    minHeight: 44,
                    width: "100%",
                    pointerEvents: googleLoading ? "none" : "auto",
                  }}
                />

                {!googleBtnRendered && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "#aaa",
                      marginTop: 4,
                    }}
                  >
                    Cargando botón de Google…
                  </p>
                )}
              </div>
            ) : (
              <div className="profile-google-action">
                <p className="profile-google-hint">
                  Si desvincula su cuenta de Google, solo podrá acceder mediante
                  correo y contraseña.
                </p>
                <button
                  type="button"
                  className="profile-google-btn profile-google-btn--unlink"
                  onClick={handleUnlinkGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading
                    ? "Desvinculando..."
                    : "Desvincular cuenta de Google"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
