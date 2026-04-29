import api from './api';

const ReportService = {
    getLowStockReport: () => {
        return api.get(`/reports/low-stock`);
    },

    getMovementReportByDate: (startDate, endDate) => {
        return api.get(`/reports/movements`, {
            params: {
                startDate: startDate,
                endDate: endDate
            }
        });
    },

    getTopSellingReport: () => {
        return api.get(`/reports/sales`);
    },

    // HU-PI2-09
    getSupplierTraceabilityReport: (supplierId) => {
        return api.get(`/reports/supplier-traceability`, { params: { supplierId } });
    },

    // HU-PI2-09
    exportSupplierTraceabilityExcel: (supplierId) => {
        return api.get(`/reports/supplier-traceability/export/excel`, {
            params: { supplierId },
            responseType: 'blob',
        });
    },
};

export default ReportService;
