import api from '../../core/api/api';

const ReportService = {
    // ─────────────────────────────────────────────────────────────────────────
    // CONSULTAS (sin cambios)
    // ─────────────────────────────────────────────────────────────────────────

    getLowStockReport: () => {
        return api.get(`/reports/low-stock`);
    },

    getMovementReportByDate: (startDate, endDate) => {
        return api.get(`/reports/movements`, {
            params: { startDate, endDate }
        });
    },

    getTopSellingReport: () => {
        return api.get(`/reports/sales`);
    },

    // HU-PI2-09
    getSupplierTraceabilityReport: (supplierId) => {
        return api.get(`/reports/supplier-traceability`, { params: { supplierId } });
    },

    // ─────────────────────────────────────────────────────────────────────────
    // EXPORTACIÓN EXCEL — HU-PI2-05 (genera el backend, descarga el frontend)
    // ─────────────────────────────────────────────────────────────────────────

    // HU-PI2-05 | HU14: Stock Bajo → Excel
    exportLowStockExcel: () => {
        return api.get(`/reports/low-stock/export/excel`, {
            responseType: 'blob',
        });
    },

    // HU-PI2-05 | HU15: Movimientos → Excel (respeta filtro de fechas)
    exportMovementsExcel: (startDate, endDate) => {
        return api.get(`/reports/movements/export/excel`, {
            params: { startDate, endDate },
            responseType: 'blob',
        });
    },

    // HU-PI2-05 | HU16: Más Vendidos → Excel
    exportTopSellingExcel: () => {
        return api.get(`/reports/sales/export/excel`, {
            responseType: 'blob',
        });
    },

    // HU-PI2-09 (mejorado) + HU-PI2-05: Trazabilidad Proveedor → Excel
    exportSupplierTraceabilityExcel: (supplierId, supplierName = '') => {
        return api.get(`/reports/supplier-traceability/export/excel`, {
            params: { supplierId, supplierName },
            responseType: 'blob',
        });
    },
};

export default ReportService;
