import api from './api';

const getAllSuppliers  = ()         => api.get('/suppliers');
const createSupplier  = (data)      => api.post('/suppliers', data);
const updateSupplier  = (id, data)  => api.put(`/suppliers/${id}`, data);
const deactivateSupplier = (id)     => api.delete(`/suppliers/${id}`);

export default { getAllSuppliers, createSupplier, updateSupplier, deactivateSupplier };
