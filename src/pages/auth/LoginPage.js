import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { initGoogleGsi, renderGoogleButton, googleClientId } from '../../services/googleGsiService';
import './LoginPage.css';
import { ReactComponent as StockMasterLogo } from '../../assets/LogoStockMaster.svg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [message, setMessage]           = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [googleReady, setGoogleReady]   = useState(false);
    const googleBtnRef                    = useRef(null);
    const navigate                        = useNavigate();

    useEffect(() => {
        if (!googleClientId) return;

        let cancelled = false;

        const handleGoogleResponse = async (response) => {
            setMessage('');
            try {
                await authService.loginWithGoogle(response.credential);
                navigate('/dashboard');
            } catch (error) {
                const errorMessage =
                    error.response?.data?.message ||
                    'No se pudo iniciar sesión con Google. Verifica que tu cuenta esté vinculada al sistema.';
                setMessage(errorMessage);
            }
        };

        initGoogleGsi(handleGoogleResponse).then(() => {
            if (cancelled || !googleBtnRef.current) return;
            renderGoogleButton(googleBtnRef.current, {
                text:            'signin_with',
                logo_alignment:  'center',
                width:           googleBtnRef.current.offsetWidth || 340,
            });
            setGoogleReady(true);
        }).catch(() => {
            if (!cancelled) setMessage('No se pudo cargar el servicio de Google. Verifica tu conexión.');
        });

        return () => { cancelled = true; };
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                'Error de conexión. Inténtelo de nuevo.';
            setMessage(errorMessage);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-logo">
                <StockMasterLogo />
            </div>
            <h1 className="login-title">StockMaster</h1>
            <p className="login-subtitle">Sistema de Gestión de Inventario</p>

            <div className="login-card">
                <h2 className="card-title">Iniciar Sesión</h2>
                <p className="card-subtitle">Ingrese sus credenciales para acceder al sistema</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-container">
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <div className="input-container">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <span
                                className="password-toggle"
                                onClick={() => setShowPassword(v => !v)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="login-button">
                        Iniciar Sesión
                    </button>

                    {message && <div className="error-message">{message}</div>}
                </form>

                {googleClientId && (
                    <>
                        <div className="login-divider">
                            <span className="login-divider-text">o</span>
                        </div>

                        <div
                            ref={googleBtnRef}
                            className="google-btn-container"
                            style={{
                                minHeight:  44,
                                display:    'flex',
                                justifyContent: 'center',
                                opacity:    googleReady ? 1 : 0.4,
                                transition: 'opacity 0.3s',
                            }}
                        />

                        {!googleReady && (
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa', marginTop: 6 }}>
                                Cargando Google…
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
