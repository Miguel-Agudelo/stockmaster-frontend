import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import '../../pages/users/UserList.css';
import './RecoveryView.css';

const RecoveryView = ({ title, subtitle, children }) => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        // Navega a la ruta anterior o a la ruta principal de administración
        navigate(-1);
    };

    return (
        // 1. Usamos el main-content para el layout general y el padding
        <div className="main-content">

            {/* 2. Header Superior con botón Volver */}
            <div className="recovery-header">
                <button className="back-button" onClick={handleGoBack}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Volver
                </button>
                <div className="title-group">
                    <h1>{title}</h1>
                    <p className="page-subtitle">{subtitle}</p>
                </div>
            </div>

            {/* 3. Contenedor del contenido (Aquí se renderiza RecoveryList) */}
            <div className="recovery-card-container">
                {children}
            </div>
        </div>
    );
};

export default RecoveryView;