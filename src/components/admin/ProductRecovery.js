import React from 'react';
import RecoveryList from './RecoveryList';
import RecoveryService from '../../services/recoveryService';
import '../../pages/users/UserList.css';
import RecoveryView from './RecoveryView';


const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    // Opciones de formato de fecha y hora local (ej: DD/MM/YYYY hh:mm AM/PM)
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // Para mostrar AM/PM
    };

    return date.toLocaleString('es-CO', options);
};


// Definición de las columnas específicas para Productos
const productColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Categoría', accessor: 'categoryName' },
    {
        header: 'Fecha Eliminación',
        accessor: 'deletedAt',
        render: (item) => formatDate(item.deletedAt)
    }
];

const ProductRecovery = () => {
    return (
        <RecoveryView
            title="Productos Eliminados"
            subtitle="Restaura productos marcados como inactivos"
        >
            <RecoveryList
                title="Papelera de Productos" // Título de la tarjeta interna
                columns={productColumns}
                apiConfig={RecoveryService.product}
            />
        </RecoveryView>
    );
};

export default ProductRecovery;