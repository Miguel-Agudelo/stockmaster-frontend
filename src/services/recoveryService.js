import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8080/api';

const authHeader = () => authService.getAuthHeader();

const RecoveryService = {

    product: {
        getAllInactive: () => axios.get(API_URL + '/products/inactive', { headers: authHeader() }),
        restoreItems: (ids) => Promise.all(
            ids.map(id => axios.put(API_URL + `/products/${id}/restore`, {}, { headers: authHeader() }))
        )
    },

    warehouse: {
        getAllInactive: () => axios.get(API_URL + '/warehouses/inactive', { headers: authHeader() }),
        restoreItems: (ids) => Promise.all(
            ids.map(id => axios.put(API_URL + `/warehouses/${id}/restore`, {}, { headers: authHeader() }))
        )
    },

    user: {
        getAllInactive: () => axios.get(API_URL + '/users/inactive', { headers: authHeader() }),
        restoreItems: (ids) => Promise.all(
            ids.map(id => axios.put(API_URL + `/users/${id}/restore`, {}, { headers: authHeader() }))
        )
    },

    // HU-PI2-01: papelera de proveedores
    supplier: {
        getAllInactive: () => axios.get(API_URL + '/suppliers/inactive', { headers: authHeader() }),
        restoreItems: (ids) => Promise.all(
            ids.map(id => axios.put(API_URL + `/suppliers/${id}/restore`, {}, { headers: authHeader() }))
        )
    }
};

export default RecoveryService;
