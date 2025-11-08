// No necesitamos importar axios directamente, ya que usaremos nuestra instancia configurada 'api'.
// import axios from 'axios';

// Importamos la instancia de Axios que ya tiene el interceptor de autenticación
import api from './api';

// Ya no necesitamos la API_URL base, ya que 'api' tiene la baseURL configurada como /api
// const API_URL = 'http://localhost:8080/api/reports';
// En su lugar, usaremos rutas relativas a la baseURL de /api

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
            // NOTA: El interceptor en api.js añade automáticamente el token (Authorization: Bearer <token>)
        });
    },

    // HU16: Obtiene el reporte de productos más vendidos
    getTopSellingReport: () => {
        // Usamos api.get(). La ruta completa es /api/reports/sales
        return api.get(`/reports/sales`);
    },
};

export default ReportService;