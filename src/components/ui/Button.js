import React from 'react';

const Button = ({ children, onClick, type = 'button', className = 'btn btn-primary', disabled = false, ...props }) => {
    return (
        <button
            type={type}
            className={`custom-button ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;