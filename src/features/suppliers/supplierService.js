import api from '../../core/api/api';

const getAllSuppliers  = ()         => api.get('/suppliers');
const createSupplier  = (data)      => api.post('/suppliers', data);
const updateSupplier  = (id, data)  => api.put(`/suppliers/${id}`, data);
const deactivateSupplier = (id)     => api.delete(`/suppliers/${id}`);

// Asignamos el objeto a una constante para quitar el warning de ESLint
const supplierService = {
    getAllSuppliers,
    createSupplier,
    updateSupplier,
    deactivateSupplier
};

export default supplierService;