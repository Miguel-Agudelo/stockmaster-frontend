import api from './api';

const DISMISSED_KEY = 'stockmaster_dismissed_alerts';

const alertService = {

    // Obtiene las alertas de stock bajo desde el backend
    getLowStockAlerts: async () => {
        const response = await api.get('/alerts/low-stock');
        return response.data;
    },

    // Guarda en localStorage los IDs de alertas que el admin ya marcó como "visto"
    getDismissedIds: () => {
        try {
            const raw = localStorage.getItem(DISMISSED_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },

    // Marca una alerta como vista (la agrega a la lista de descartadas)
    dismissAlert: (inventoryId) => {
        const current = alertService.getDismissedIds();
        if (!current.includes(inventoryId)) {
            current.push(inventoryId);
            localStorage.setItem(DISMISSED_KEY, JSON.stringify(current));
        }
    },

    // Limpia los IDs descartados que ya no están en la lista actual de alertas
    // (porque el stock subió, por ejemplo). Así si vuelve a bajar, reaparece.
    syncDismissed: (activeAlerts) => {
        const activeIds = activeAlerts.map(a => a.inventoryId);
        const dismissed = alertService.getDismissedIds();
        const stillRelevant = dismissed.filter(id => activeIds.includes(id));
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(stillRelevant));
        return stillRelevant;
    },
};

export default alertService;