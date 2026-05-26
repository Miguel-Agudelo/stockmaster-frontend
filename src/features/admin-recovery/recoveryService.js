import api from '../../core/api/api';

/**
 * Servicio de recuperación (papelera) para todas las entidades del sistema.
 * Usa la instancia `api` centralizada para beneficiarse de los interceptores
 * de autenticación y renovación automática de token.
 */
const RecoveryService = {

    product: {
        getAllInactive: ()         => api.get('/products/inactive'),
        restoreItems:  (ids) => Promise.all(
            ids.map(id => api.put(`/products/${id}/restore`))
        ),
    },

    warehouse: {
        getAllInactive: ()         => api.get('/warehouses/inactive'),
        restoreItems:  (ids) => Promise.all(
            ids.map(id => api.put(`/warehouses/${id}/restore`))
        ),
    },

    user: {
        getAllInactive: ()         => api.get('/users/inactive'),
        restoreItems:  (ids) => Promise.all(
            ids.map(id => api.put(`/users/${id}/restore`))
        ),
    },

    // HU-PI2-01: papelera de proveedores
    supplier: {
        getAllInactive: ()         => api.get('/suppliers/inactive'),
        restoreItems:  (ids) => Promise.all(
            ids.map(id => api.put(`/suppliers/${id}/restore`))
        ),
    },
};

export default RecoveryService;
