import React from 'react';

/**
 * Componente simple para mostrar un indicador de carga.
 * @param {object} props
 * @param {string} props.message - Mensaje opcional para mostrar junto al spinner.
 */
const Spinner = ({ message = "Cargando..." }) => {
    const spinnerStyle = {
        display: 'inline-block',
        width: '20px',
        height: '20px',
        border: '3px solid rgba(0, 0, 0, .1)',
        borderRadius: '50%',
        borderTopColor: '#3498db',
        animation: 'spin 1s ease-in-out infinite',
        marginRight: '10px'
    };

    const containerStyle = {
        textAlign: 'center',
        padding: '20px',
        fontSize: '1.1rem',
        color: '#6c757d'
    };

    return (
        <div style={containerStyle}>
            <div style={spinnerStyle}></div>
            {message}
        </div>
    );
};

export default Spinner;