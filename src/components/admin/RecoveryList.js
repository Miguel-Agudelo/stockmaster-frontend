import React, { useState, useEffect, useCallback } from 'react';
// Importaciones de Common Components
import Table from '../common/Table';
import Alert from '../common/Alert';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal'; // 🟢 1. IMPORTACIÓN DEL MODAL
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndoAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

// Importamos el CSS donde está definido el estilo de la tabla y botones
import '../../pages/users/UserList.css';

/**
 * Componente genérico para listar y restaurar elementos eliminados lógicamente (is_active=false).
 * Este componente usa el diseño de acción individual en cada fila.
 * @param {object} props
 * @param {string} props.title - Título de la tarjeta (ej: "Papelera de Usuarios")
 * @param {array} props.columns - Definición de las columnas de la tabla.
 * @param {object} props.apiConfig - Objeto con funciones de servicio { getAllInactive, restoreItems }.
 */
const RecoveryList = ({ title, columns, apiConfig }) => {
    // 1. ESTADOS
    const [inactiveItems, setInactiveItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToRestore, setItemToRestore] = useState(null); // Almacena el ítem completo

    // 2. FUNCIÓN DE CARGA
    const fetchInactiveItems = useCallback(async () => {
        setLoading(true);
        setAlert(null);
        try {
            const response = await apiConfig.getAllInactive();
            setInactiveItems(response.data.map(item => ({
                ...item,
                id: Number(item.id)
            })));
        } catch (err) {
            console.error("Error al cargar lista de inactivos:", err);
            setAlert({ type: 'error', message: 'No se pudo cargar la lista de elementos inactivos.' });
        } finally {
            setLoading(false);
        }
    }, [apiConfig]);

    useEffect(() => {
        fetchInactiveItems();
    }, [fetchInactiveItems]);

    // FUNCIONES DE CONTROL DEL MODAL
    const openRestoreModal = (item) => {
        setItemToRestore(item);
        setIsModalOpen(true);
    };

    const closeRestoreModal = () => {
        setIsModalOpen(false);
        setItemToRestore(null);
    };

    // 3. HANDLER DE RESTAURACIÓN (Ahora ejecuta la acción después de la confirmación del modal)
    const executeRestore = async () => {
        closeRestoreModal(); // Cierra el modal inmediatamente

        if (!itemToRestore || !itemToRestore.id) return;

        const idsArray = [itemToRestore.id]; // Usamos array para el servicio
        const itemName = itemToRestore.name || 'el elemento'; // Obtener nombre para el mensaje

        setLoading(true);
        setAlert(null);
        try {
            // El servicio debe ser capaz de manejar un array de IDs, incluso si solo hay uno.
            await apiConfig.restoreItems(idsArray);

            setAlert({
                type: 'success',
                message: `${itemName} restaurado exitosamente.`
            });

            // Recargar la lista
            fetchInactiveItems();

        } catch (err) {
            console.error("Error al restaurar elemento:", err);
            const errorMessage = err.response && err.response.data.message ?
                err.response.data.message :
                'Hubo un error al intentar restaurar el elemento seleccionado.';
            setAlert({ type: 'error', message: errorMessage });

        } finally {
            setLoading(false);
            setItemToRestore(null); // Limpiar el estado del ítem
        }
    };


    // 4. COLUMNAS (Llamada al modal)
    const actionRestoreColumn = {
        header: 'Acciones',
        accessor: 'actions',
        render: (item) => (
            // 🟢 CORRECCIÓN: Llamamos a openRestoreModal con el ITEM completo
            <button
                className="restore-single-button"
                onClick={() => openRestoreModal(item)}
                disabled={loading}
            >
                <FontAwesomeIcon icon={faUndoAlt} /> Restaurar
            </button>
        )
    };

    const finalColumns = [...columns, actionRestoreColumn];


    // 5. RENDERIZADO
    const content = loading ? (
        <div className="text-center p-5">
            <Spinner message={`Cargando ${title}...`} />
        </div>
    ) : inactiveItems.length === 0 ? (
        <Alert type="info" message={`No hay ${title.toLowerCase()} para recuperar.`} />
    ) : (
        <Table data={inactiveItems} columns={finalColumns} tableClassName="user-list-card table" />
    );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return date.toLocaleString('es-CO', options);
    };

    return (
        <div className="recovery-list-content">
            <div className="section-header-recovery">
                <h2 className="table-info">{title}</h2>
            </div>

            {/* Mostrar Alerta */}
            {alert && <Alert type={alert.type} message={alert.message} />}

            {/* Contenido Dinámico (Tabla o Mensajes) */}
            <div className="data-area mt-3">
                {content}
            </div>

            {/* NOTA DE ADVERTENCIA */}
            <p className="text-muted small mt-4">
                <FontAwesomeIcon icon={faInfoCircle} /> Al restaurar, los elementos vuelven a estar activos en el sistema.
            </p>

            {/* 🟢 RENDERIZADO DEL MODAL DE CONFIRMACIÓN */}
            {isModalOpen && itemToRestore && (
                <ConfirmationModal
                    title={`¿Restaurar ${title.replace('Papelera de ', '').slice(0, -1)}?`} // Ej: ¿Restaurar Usuario? (quitando la 's')
                    message={`¿Está seguro de que desea restaurar "${itemToRestore.name}"? El elemento será reactivado en el sistema.`}
                    confirmText="Restaurar"
                    cancelText="Cancelar"
                    onConfirm={executeRestore} // Llama a la lógica de restauración
                    onCancel={closeRestoreModal} // Cierra el modal
                    type="restore" // Usa el tipo 'restore' para el estilo de botón verde/principal
                />
            )}
        </div>
    );
};

export default RecoveryList;