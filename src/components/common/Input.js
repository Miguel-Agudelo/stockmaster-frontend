import React from 'react';

const Input = ({ label, id, type = 'text', value, onChange, placeholder, required = false, ...props }) => {
    return (
        <div className="input-group">
            {label && <label htmlFor={id} className="input-label">{label}</label>}
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder || ''}
                required={required}
                className="custom-input"
                {...props}
            />
        </div>
    );
};

export default Input;