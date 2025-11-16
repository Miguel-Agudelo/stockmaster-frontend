import React from 'react';
import RecoveryList from './RecoveryList';
import RecoveryService from '../../services/recoveryService';
import '../../pages/users/UserList.css';
import RecoveryView from './RecoveryView';

/**
 * Función auxiliar para formatear una cadena de fecha ISO 8601 a un formato legible.
 */
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Opciones de formato de fecha y hora local (DD/MM/YYYY hh:mm AM/PM)
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };

    // Usar toLocaleString para obtener el formato local deseado
    return date.toLocaleString('es-CO', options);
};


// Definición de las columnas específicas para Almacenes
const warehouseColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'Dirección', accessor: 'address' },
    { header: 'Ciudad', accessor: 'city' },

    {
        header: 'Fecha Eliminación',
        accessor: 'deletedAt',

        render: (item) => formatDate(item.deletedAt)
    }
];

const WarehouseRecovery = () => {
    return (
        <RecoveryView
            title="Almacenes Eliminados"
            subtitle="Restaura almacenes marcados como inactivos"
        >
            <RecoveryList
                title="Papelera de Almacenes" // Título de la tarjeta interna
                columns={warehouseColumns}
                apiConfig={RecoveryService.warehouse}
            />
        </RecoveryView>
    );
};

export default WarehouseRecovery;