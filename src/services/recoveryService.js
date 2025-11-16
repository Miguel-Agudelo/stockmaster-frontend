import axios from 'axios';
import authService from './authService';

const API_URL = 'http://localhost:8080/api';


const authHeader = () => authService.getAuthHeader();

/**
 * Objeto que mapea las funciones CRUD de recuperación a sus respectivos
 * endpoints y servicios. Este objeto se pasará como prop al RecoveryList.js.
 */
const RecoveryService = {

    product: {
        // GET /api/products/inactive
        getAllInactive: () => {
            return axios.get(API_URL + '/products/inactive', { headers: authHeader() });
        },
        // PUT /api/products/{id}/restore
        restoreItems: (ids) => {
            const restorePromises = ids.map(id =>
                axios.put(API_URL + `/products/${id}/restore`, {}, { headers: authHeader() })
            );
            return Promise.all(restorePromises);
        }
    },

    warehouse: {
        // GET /api/warehouses/inactive
        getAllInactive: () => {
            return axios.get(API_URL + '/warehouses/inactive', { headers: authHeader() });
        },
        // PUT /api/warehouses/{id}/restore
        restoreItems: (ids) => {
            const restorePromises = ids.map(id =>
                axios.put(API_URL + `/warehouses/${id}/restore`, {}, { headers: authHeader() })
            );
            return Promise.all(restorePromises);
        }
    },

    user: {
        // GET /api/users/inactive
        getAllInactive: () => {
            return axios.get(API_URL + '/users/inactive', { headers: authHeader() });
        },
        // PUT /api/users/{id}/restore
        restoreItems: (ids) => {
            const restorePromises = ids.map(id =>
                axios.put(API_URL + `/users/${id}/restore`, {}, { headers: authHeader() })
            );
            return Promise.all(restorePromises);
        }
    }
};

export default RecoveryService;