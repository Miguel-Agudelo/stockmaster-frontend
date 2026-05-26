import api from '../../core/api/api';

const DASHBOARD_API_URL = '/dashboard';

/**
 * @typedef {Object} DashboardMetricDto
 * @property {number} [totalProducts] - Cantidad total de productos en inventario
 * @property {number} [lowStockAlerts] - Cantidad de productos con stock bajo
 * @property {Array} [recentMovements] - Historial de los últimos movimientos
 */

const dashboardService = {
    /**
     * Obtiene todas las métricas, alertas y movimientos recientes para el Dashboard.
     * @returns {Promise<DashboardMetricDto>}
     */
    getDashboardSummary: async () => {
        try {
            const response = await api.get(`${DASHBOARD_API_URL}/summary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            throw error;
        }
    },
};

export default dashboardService;