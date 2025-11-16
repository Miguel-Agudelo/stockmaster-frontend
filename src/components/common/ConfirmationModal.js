import React from 'react';
import './ConfirmationModal.css';

/**
 * Componente genérico para modales de confirmación (Eliminar, Restaurar, etc.).
 * @param {object} props
 * @param {string} props.title - Título del modal (Ej: "¿Restaurar Usuario?")
 * @param {string} props.message - Mensaje de descripción
 * @param {string} props.confirmText - Texto del botón de acción principal (Ej: "Restaurar" o "Eliminar")
 * @param {string} props.cancelText - Texto del botón de cancelación (Ej: "Cancelar")
 * @param {function} props.onConfirm - Función a ejecutar al confirmar.
 * @param {function} props.onCancel - Función a ejecutar al cancelar/cerrar.
 * @param {string} props.type - Define el estilo del botón principal ('delete' para rojo, 'restore' o 'default' para color principal).
 */
const ConfirmationModal = ({
                               title,
                               message,
                               confirmText = 'Aceptar',
                               cancelText = 'Cancelar',
                               onConfirm,
                               onCancel,
                               type = 'default'
                           }) => {

    const confirmButtonClass = type === 'delete' ? 'modal-button-delete' : 'modal-button-confirm';

    // Manejador para evitar que el clic dentro del modal cierre todo
    const handleModalClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Overlay (cierra el modal si se hace clic fuera)
        <div className="modal-overlay" onClick={onCancel}>

            {/* Contenedor principal del modal */}
            <div className="modal-container" onClick={handleModalClick}>

                {/* Cabecera / Título */}
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                </div>

                {/* Cuerpo / Mensaje */}
                <div className="modal-body">
                    <p>{message}</p>
                </div>

                {/* Pie / Botones de acción */}
                <div className="modal-footer">
                    {/* Botón de Cancelar (usa el estilo secundario) */}
                    <button
                        className="modal-button modal-button-cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>

                    {/* Botón de Confirmación (usa el estilo definido por 'type') */}
                    <button
                        className={`modal-button ${confirmButtonClass}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;