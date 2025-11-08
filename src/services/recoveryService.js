import axios from 'axios';
import authService from './authService'; // 🟢 CORRECCIÓN CLAVE: Importamos el servicio completo

const API_URL = 'http://localhost:8080/api'; // URL base

// Definir la función authHeader para simplificar el código
const authHeader = () => authService.getAuthHeader();

// ===================================================================
// 1. CONFIGURACIÓN DE ENDPOINTS POR ENTIDAD
// ===================================================================

/**
 * Objeto que mapea las funciones CRUD de recuperación a sus respectivos
 * endpoints y servicios. Este objeto se pasará como prop al RecoveryList.js.
 */
const RecoveryService = {
    // ------------------------------------
    // HU17: PRODUCTOS
    // ------------------------------------
    product: {
        // GET /api/products/inactive
        getAllInactive: () => {
            return axios.get(API_URL + '/products/inactive', { headers: authHeader() });
        },
        // PUT /api/products/{id}/restore
        restoreItems: (ids) => {
            // Usamos Promise.all para manejar la restauración múltiple.
            const restorePromises = ids.map(id =>
                axios.put(API_URL + `/products/${id}/restore`, {}, { headers: authHeader() })
            );
            return Promise.all(restorePromises);
        }
    },

    // ------------------------------------
    // HU18: ALMACENES
    // ------------------------------------
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

    // ------------------------------------
    // HU19: USUARIOS
    // ------------------------------------
    user: {
        // GET /api/users/inactive
        getAllInactive: () => {
            // Nota: El backend devuelve una lista de objetos User directamente
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