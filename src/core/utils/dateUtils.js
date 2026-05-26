/**
 * Utilidades de formato de fechas para toda la aplicación.
 * Centraliza la lógica para evitar duplicación entre componentes.
 */

/**
 * Formatea una fecha ISO a formato local colombiano (dd/mm/aaaa).
 * @param {string} dateString - Fecha en formato ISO o compatible con Date.
 * @returns {string} Fecha formateada, 'N/A' si es nula, o 'Inválida' si no parsea.
 */
export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year:  'numeric',
            month: '2-digit',
            day:   '2-digit',
        });
    } catch {
        return 'Inválida';
    }
};
