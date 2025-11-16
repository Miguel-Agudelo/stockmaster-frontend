import React from 'react';
import RecoveryList from './RecoveryList';
import RecoveryService from '../../services/recoveryService';
import '../../pages/users/UserList.css';
import RecoveryView from './RecoveryView';

/**
 * Función auxiliar para formatear una cadena de fecha ISO 8601 a un formato legible.
 * (Definida localmente, idealmente se importaría de un archivo de utilidades).
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


// Definición de las columnas específicas para Usuarios
const userColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Rol', accessor: 'role' },
    {
        header: 'Fecha Eliminación',
        accessor: 'deletedAt',
        render: (item) => formatDate(item.deletedAt)
    }
];

const UserRecovery = () => {
    return (
        <RecoveryView
            title="Usuarios Eliminados"
            subtitle="Restaura cuentas de usuarios marcados como inactivos"
        >
            <RecoveryList
                title="Papelera de Usuarios" // Título de la tarjeta interna
                columns={userColumns}
                apiConfig={RecoveryService.user}
            />
        </RecoveryView>
    );
};

export default UserRecovery;