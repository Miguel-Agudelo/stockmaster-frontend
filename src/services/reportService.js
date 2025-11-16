import api from './api';

const ReportService = {
    // HU14: Obtiene el reporte de productos con stock bajo
    getLowStockReport: () => {
        // Usamos api.get(). La ruta completa es /api/reports/low-stock
        return api.get(`/reports/low-stock`);
    },

    // HU15: Obtiene el reporte de movimientos filtrado por rango de fechas
    getMovementReportByDate: (startDate, endDate) => {
        // Usamos api.get(). La ruta completa es /api/reports/movements
        return api.get(`/reports/movements`, {
            params: {
                startDate: startDate, // Enviamos los strings ISO al backend
                endDate: endDate
            }

        });
    },

    // HU16: Obtiene el reporte de productos más vendidos
    getTopSellingReport: () => {
        // Usamos api.get(). La ruta completa es /api/reports/sales
        return api.get(`/reports/sales`);
    },
};

export default ReportService;