import api from './api';

const stockMovementService = {

    /** Lista de productos activos para selectores */
    getProductsList: () => api.get('/products'),

    /** Lista de almacenes para selectores */
    getWarehousesList: () => api.get('/warehouses'),

    /** HU08 — Registra entrada de stock */
    registerEntry: (movementData) => api.post('/movements/entry', movementData),

    /** HU09 — Registra salida de stock */
    registerExit: (movementData) => api.post('/movements/exit', movementData),

    /** HU11 — Registra ajuste de inventario (positivo o negativo) */
    registerAdjustment: (adjustmentData) => api.post('/movements/adjust', adjustmentData),

    /**
     * HU11 — Obtiene el stock actual de un producto en un almacén concreto.
     * Devuelve { currentStock: number }
     */
    getCurrentStock: (productId, warehouseId) =>
        api.get('/inventory/current-stock', { params: { productId, warehouseId } }),

    /** Stock de un producto desglosado por almacén */
    getProductStockByWarehouses: (productId) =>
        api.get(`/inventory/stock-by-product/${productId}`),

    /** HU20 — Transferencia entre almacenes */
    transferStock: (transferData) => api.post('/movements/transfer', transferData),

    /** Historial completo de movimientos */
    getMovementHistory: () => api.get('/movements'),
};

export default stockMovementService;
