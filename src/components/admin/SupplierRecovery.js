import React from 'react';
import RecoveryList from './RecoveryList';
import RecoveryService from '../../services/recoveryService';
import RecoveryView from './RecoveryView';
import '../../pages/users/UserList.css';

// Columnas específicas para la papelera de proveedores
const supplierColumns = [
    { header: 'ID',       accessor: 'id' },
    { header: 'Nombre',   accessor: 'name' },
    { header: 'NIT',      accessor: 'nit' },
    { header: 'Teléfono', accessor: 'phone' },
    { header: 'Correo',   accessor: 'email' },
];

const SupplierRecovery = () => {
    return (
        <RecoveryView
            title="Proveedores Desactivados"
            subtitle="Restaura proveedores que han sido desactivados del sistema"
        >
            <RecoveryList
                title="Papelera de Proveedores"
                columns={supplierColumns}
                apiConfig={RecoveryService.supplier}
            />
        </RecoveryView>
    );
};

export default SupplierRecovery;
