import React from 'react';

/**
 * Componente genérico para mostrar mensajes de alerta.
 * @param {object} props
 * @param {string} props.type - Tipo de alerta: 'success', 'error', 'info', 'warning'.
 * @param {string} props.message - Mensaje a mostrar.
 */
const Alert = ({ type = 'info', message }) => {
    if (!message) return null;

    // Estilos básicos para las alertas
    const baseStyle = {
        padding: '10px 15px',
        borderRadius: '5px',
        marginBottom: '15px',
        border: '1px solid transparent',
        color: '#383d41'
    };

    const typeStyles = {
        success: {
            backgroundColor: '#d4edda',
            borderColor: '#c3e6cb',
            color: '#155724',
        },
        error: {
            backgroundColor: '#f8d7da',
            borderColor: '#f5c6cb',
            color: '#721c24',
        },
        info: {
            backgroundColor: '#d1ecf1',
            borderColor: '#bee5eb',
            color: '#0c5460',
        },
        warning: {
            backgroundColor: '#fff3cd',
            borderColor: '#ffeeba',
            color: '#856404',
        }
    };

    return (
        <div style={{ ...baseStyle, ...typeStyles[type] }}>
            {message}
        </div>
    );
};

export default Alert;