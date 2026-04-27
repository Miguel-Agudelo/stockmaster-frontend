import api from './api';

/**
 * HU-PI2-10 — Servicio para consultar el historial de cambios de un producto.
 */
const productChangeLogService = {

    /**
     * Obtiene el historial de modificaciones de un producto.
     * GET /api/products/{productId}/changelog
     * @param {number} productId
     */
    getChangeLog: (productId) => api.get(`/products/${productId}/changelog`),
};

export default productChangeLogService;