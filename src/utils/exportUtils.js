/**
 * Función genérica para exportar datos a un archivo CSV.
 * * @param {string[]} headers - Array de strings para las cabeceras del CSV (ej: ['ID', 'Nombre']).
 * @param {string[]} accessors - Array de strings con los nombres de las propiedades del objeto (ej: ['id', 'name']).
 * @param {object[]} data - Array de objetos a exportar.
 * @param {string} fileName - Nombre del archivo a descargar (sin extensión).
 */
export const exportToCsv = (headers, accessors, data, fileName) => {
    if (!data || data.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // 1. Crear la Fila de Cabeceras
    const csvHeaders = headers.join(',') + '\n';

    // 2. Crear las Filas de Datos
    const csvData = data.map(item => {
        return accessors.map(accessor => {
            let value = item[accessor];

            // Tratamiento especial para objetos anidados y formatos
            // Si el valor es null, undefined, o un objeto, lo convertimos a string vacío o manejamos la anidación
            if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'object' && accessor === 'movementDate') {
                // Manejo de fechas (asumiendo que vienen como ISO string)
                try {
                    const date = new Date(value);
                    // Formato DD/MM/AAAA HH:MM
                    value = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
                } catch (e) {
                    value = value.toString();
                }
            } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                // Escapar comillas dobles y encerrar valores que contienen comas o saltos de línea
                value = `"${value.replace(/"/g, '""')}"`;
            } else if (typeof value === 'number') {
                // Convertir números a string y reemplazar el separador decimal (',' por '.') si es necesario
                value = value.toString().replace('.', ',');
            }

            return value;
        }).join(',');
    }).join('\n');

    // 3. Combinar Cabeceras y Datos
    const csvContent = csvHeaders + csvData;

    // 4. Crear el Blob y forzar la descarga
    // Usamos 'text/csv;charset=utf-8' para que soporte caracteres especiales y sea reconocido como CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    // Configuración del enlace de descarga
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);

    // Simular el clic en el enlace
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};