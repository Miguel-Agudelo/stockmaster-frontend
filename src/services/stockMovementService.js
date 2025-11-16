import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Función auxiliar para obtener los headers con el token
const authHeader = () => {

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
        return axios.get(`${API_URL}/products`, { headers: authHeader() });
    },

    /**
     * Obtiene la lista de todos los almacenes para el selector.
     * @returns {Promise<AxiosResponse<Array<Warehouse>>>}
     */
    getWarehousesList: () => {
        return axios.get(`${API_URL}/warehouses`, { headers: authHeader() });
    },

    /**
     * Registra un nuevo movimiento de stock (Entrada o Salida).
     * @param {Object} movementData - Datos del movimiento.
     * @returns {Promise<AxiosResponse<Movement>>}
     */
    registerEntry: (movementData) => {

        return axios.post(`${API_URL}/movements/entry`, movementData, { headers: authHeader() });
    },
    registerExit: (movementData) => {
        return axios.post(`${API_URL}/movements/exit`, movementData, { headers: authHeader() });
    },

    /**
     * Realiza la transferencia de stock entre dos almacenes.
     * @param {Object} transferData - Objeto TransferDto: { productId, originWarehouseId, destinationWarehouseId, quantity, userId }
     * @returns {Promise<AxiosResponse<TransferResult>>}
     */
    transferStock: (transferData) => {
        // Endpoint definido en InventoryMovementController.java: @PostMapping("/transfer")
        return axios.post(`${API_URL}/movements/transfer`, transferData, { headers: authHeader() });
    },


    // Función para la tabla principal (Historial de Movimientos)
    getMovementHistory: () => {
        return axios.get(`${API_URL}/movements`, { headers: authHeader() });
    }
};

export default stockMovementService;