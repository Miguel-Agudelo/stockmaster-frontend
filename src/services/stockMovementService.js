import axios from 'axios';



// 🚨 IMPORTANTE: Reemplaza esta URL base con la URL real de tu backend

const API_URL = 'http://localhost:8080/api';



// -----------------------------------------------------------

// --- CONFIGURACIÓN DEL SERVICIO DE MOVIMIENTOS Y DATOS ---

// -----------------------------------------------------------



// Función auxiliar para obtener los headers con el token

const authHeader = () => {

// 🚨 Suponemos que el token JWT está guardado en localStorage.

    const userToken = localStorage.getItem('token');



    if (userToken) {

        return { Authorization: 'Bearer ' + userToken };

    } else {

        return {};

    }

};



const stockMovementService = {

    /**

     * Obtiene la lista de todos los productos para el selector.

     * @returns {Promise<AxiosResponse<Array<Product>>>}

     */

    getProductsList: () => {

// 🚨 VERIFICAR: Asegúrate de que esta ruta sea correcta en tu backend.

// Debe devolver un array de objetos { id, name, sku, ... }

        return axios.get(`${API_URL}/products`, { headers: authHeader() });

    },



    /**

     * Obtiene la lista de todos los almacenes para el selector.

     * @returns {Promise<AxiosResponse<Array<Warehouse>>>}

     */

    getWarehousesList: () => {

// 🚨 VERIFICAR: Asegúrate de que esta ruta sea correcta en tu backend.

// Debe devolver un array de objetos { id, name, ... }

        return axios.get(`${API_URL}/warehouses`, { headers: authHeader() });

    },



    /**

     * Registra un nuevo movimiento de stock (Entrada o Salida).

     * @param {Object} movementData - Datos del movimiento.

     * @returns {Promise<AxiosResponse<Movement>>}

     */

    registerEntry: (movementData) => {

// 🚨 VERIFICAR: Asegúrate de que esta ruta POST sea correcta en tu backend.

        return axios.post(`${API_URL}/movements/entry`, movementData, { headers: authHeader() });

    },
    registerExit: (movementData) => {
        return axios.post(`${API_URL}/movements/exit`, movementData, { headers: authHeader() });
    },



// Función para la tabla principal (Historial de Movimientos)

    getMovementHistory: () => {

// 🚨 VERIFICAR: Asegúrate de que esta ruta GET sea correcta en tu backend.

        return axios.get(`${API_URL}/movements`, { headers: authHeader() });

    }

};



export default stockMovementService;