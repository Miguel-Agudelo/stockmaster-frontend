import api from './api';

const DASHBOARD_API_URL = '/dashboard';

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