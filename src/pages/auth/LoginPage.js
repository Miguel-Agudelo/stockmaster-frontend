import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './LoginPage.css';
import {ReactComponent as StockMasterLogo} from "../../assets/LogoStockMaster.svg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await authService.login(email, password);
            navigate('/dashboard');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error de conexión. Inténtelo de nuevo.';
            setMessage(errorMessage);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
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
                            <span className="password-toggle" onClick={togglePasswordVisibility}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
                        </div>
                    </div>

                    <button type="submit" className="login-button">
                        Iniciar Sesión
                    </button>

                    {message && <div className="error-message">{message}</div>}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;