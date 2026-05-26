import api from '../../core/api/api';

const WAREHOUSE_URL = '/warehouses';

const warehouseService = {

    /**
     * @description Obtiene la lista de todos los almacenes activos (completa).
     * @endpoint GET /api/warehouses
     */
    async getAllWarehouses() {
        try {
            // Usa la instancia 'api' para que el interceptor añada el token JWT
            const response = await api.get(WAREHOUSE_URL);
            return response.data;
        } catch (error) {
            console.error("Error al obtener la lista de almacenes:", error);
            // Re-lanzar el error para que la vista pueda manejarlo
            throw error;
        }
    },

    /**
     * 🟢 NUEVO METODO
     * @description Obtiene la lista simplificada de almacenes activos para selectores.
     * @endpoint GET /api/warehouses/active-list
     * Asume que este endpoint devuelve: [{id: 1, name: "Almacén Principal"}, ...]
     */
    async getActiveWarehousesList() {
        try {
            const response = await api.get(`${WAREHOUSE_URL}/active-list`);
            return response.data;
        } catch (error) {
            console.error("Error al obtener la lista de almacenes activos:", error);
            throw error;
        }
    },

    /**
     * @description Crea un nuevo almacén en el sistema.
     * @endpoint POST /api/warehouses
     * @param {Object} warehouseData - Datos del almacén a crear.
     */
    async createWarehouse(warehouseData) {
        try {
            const response = await api.post(WAREHOUSE_URL, warehouseData);
            return response.data;
        } catch (error) {
            console.error("Error al crear almacén:", error);
            throw error;
        }
    },

    /**
     * @description Actualiza la información de un almacén existente.
     * @endpoint PUT /api/warehouses/{id}
     * @param {number} id - ID del almacén a actualizar.
     * @param {Object} warehouseData - Nuevos datos del almacén.
     */
    async updateWarehouse(id, warehouseData) {
        try {
            const response = await api.put(`${WAREHOUSE_URL}/${id}`, warehouseData);
            return response.data;
        } catch (error) {
            console.error(`Error al actualizar almacén con ID ${id}:`, error);
            throw error;
        }
    },

    /**
     * @description Elimina lógicamente un almacén (lo desactiva).
     * @endpoint DELETE /api/warehouses/{id}
     * @param {number} id - ID del almacén a eliminar.
     */
    async deleteWarehouse(id) {
        try {
            // Asumiendo que DELETE /api/warehouses/{id} maneja el borrado lógico en el backend
            const response = await api.delete(`${WAREHOUSE_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error al eliminar almacén con ID ${id}:`, error);
            throw error;
        }
    },
};

export default warehouseService;
