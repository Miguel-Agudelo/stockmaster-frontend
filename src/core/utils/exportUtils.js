/**
 * HU-PI2-05 — Utilidades de exportación de reportes
 * Soporta: CSV, Excel (.xlsx) y PDF (jsPDF + autoTable)
 */

const isClient = typeof window !== "undefined" && typeof document !== "undefined" && typeof URL !== "undefined";

// ─────────────────────────────────────────────────────────────────────────────
// TOAST DE NOTIFICACIÓN (reemplaza el alert nativo del navegador)
// ─────────────────────────────────────────────────────────────────────────────

export const showToast = (message, type = "warning") => {
    if (!isClient) return;

    const existing = document.getElementById("sm-export-toast");
    if (existing) existing.remove();

    const colors = {
        warning: { bg: "#fff8f0", border: "#FF7B00", text: "#7a3b00", icon: "⚠️" },
        error: { bg: "#f8d7da", border: "#dc3545", text: "#721c24", icon: "❌" },
    };
    const c = colors[type] || colors.warning;

    // Inyectar animación una sola vez
    if (!document.getElementById("sm-toast-style")) {
        const style = document.createElement("style");
        style.id = "sm-toast-style";
        style.textContent = `
      @keyframes smSlideIn {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
        document.head.appendChild(style);
    }

    const toast = document.createElement("div");
    toast.id = "sm-export-toast";
    toast.innerHTML = `
    <span style="font-size:1.2rem;line-height:1">${c.icon}</span>
    <span style="flex:1">${message}</span>
  `;
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "32px",
        right: "32px",
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        color: c.text,
        padding: "14px 18px",
        borderRadius: "10px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.13)",
        fontSize: "0.92rem",
        fontWeight: "600",
        fontFamily: "inherit",
        zIndex: "99999",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        maxWidth: "360px",
        animation: "smSlideIn 0.28s ease",
        cursor: "pointer",
    });

    toast.addEventListener("click", () => toast.remove());

    document.body.appendChild(toast);

    setTimeout(() => {
        if (!document.getElementById("sm-export-toast")) return;
        toast.style.transition = "opacity 0.4s ease";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
    }, 3500);
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PRIVADOS
// ─────────────────────────────────────────────────────────────────────────────

const formatDateValue = (value) => {
    try {
        const date = new Date(value);
        const datePart = date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
        const timePart = date.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        return `${datePart} ${timePart}`;
    } catch {
        return String(value);
    }
};

const extractValue = (item, accessor) => {
    // soportar accessors simples (propiedad directa)
    let value = item == null ? undefined : item[accessor];
    if (value === null || value === undefined) return "";
    if (accessor === "movementDate" || accessor === "fecha") {
        return formatDateValue(value);
    }
    return value;
};

const buildFileName = (baseName, ext) => {
    const date = new Date().toISOString().split("T")[0];
    return `${baseName}_${date}.${ext}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. EXPORTAR CSV
// ─────────────────────────────────────────────────────────────────────────────

export const exportToCsv = (headers, accessors, data, fileName) => {
    if (!isClient) {
        showToast("Exportación no disponible en este entorno.", "error");
        return;
    }
    if (!data || data.length === 0) {
        showToast("No hay datos disponibles para exportar.");
        return;
    }

    const csvHeaders = headers.join(",") + "\n";

    const csvData = data
        .map((item) =>
            accessors
                .map((accessor) => {
                    let value = extractValue(item, accessor);

                    if (typeof value === "number") {
                        value = value.toString().replace(".", ",");
                    } else if (
                        typeof value === "string" &&
                        (value.includes(",") || value.includes('"') || value.includes("\n"))
                    ) {
                        value = `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                })
                .join(","),
        )
        .join("\n");

    const csvContent = "\uFEFF" + csvHeaders + csvData; // BOM para Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", buildFileName(fileName, "csv"));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXPORTAR EXCEL (.xlsx)  — generado en el BACKEND
// ─────────────────────────────────────────────────────────────────────────────

export const downloadExcelFromBackend = async (apiCall, fileName) => {
    if (!isClient) {
        showToast("Descarga no disponible en este entorno.", "error");
        return;
    }
    try {
        const response = await apiCall;
        const blob = new Blob([response.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", buildFileName(fileName, "xlsx"));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        showToast("No se pudo generar el archivo Excel. Intente nuevamente.", "error");
    }
};

// ───────────────────────────��─────────────────────────────────────────────────
// 3. EXPORTAR PDF — generado en el FRONTEND con jsPDF + autoTable
// (carga dinámica para evitar problemas en SSR/tests)
// ─────────────────────────────────────────────────────────────────────────────

const BRAND = {
    orange: [255, 123, 0],
    darkOrange: [204, 98, 0],
    lightOrange: [255, 243, 229],
    white: [255, 255, 255],
    lightGray: [245, 245, 245],
    darkGray: [51, 51, 51],
    medGray: [120, 120, 120],
    danger: [185, 28, 28],
    lightRed: [254, 226, 226],
    success: [21, 128, 61],
    lightGreen: [220, 252, 231],
};

export const exportToPdf = async (config) => {
    if (!isClient) {
        showToast("Exportación a PDF no disponible en este entorno.", "error");
        return;
    }

    const {
        title,
        subtitle = "",
        meta = "",
        headers,
        accessors,
        data,
        fileName,
        rowStyleFn,
    } = config;

    if (!data || data.length === 0) {
        showToast("No hay datos disponibles para exportar.");
        return;
    }

    // Carga dinámica de dependencias para evitar errores en SSR/tests
    try {
        const jsPDFModule = await import("jspdf");
        const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule;
        const autoTableModule = await import("jspdf-autotable");
        const autoTable = autoTableModule.default || autoTableModule;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
        });
        const pageW = doc.internal.pageSize.getWidth();
        const margin = 14;

        // Encabezado naranja
        doc.setFillColor(...BRAND.orange);
        doc.rect(0, 0, pageW, 22, "F");

        doc.setFillColor(...BRAND.white);
        doc.roundedRect(margin, 4, 30, 14, 2, 2, "F");
        doc.setTextColor(...BRAND.darkOrange);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("StockMaster", margin + 15, 12.5, { align: "center" });

        doc.setTextColor(...BRAND.white);
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin + 35, 13);

        // Franja de metadatos
        doc.setFillColor(...BRAND.lightGray);
        doc.rect(0, 22, pageW, 10, "F");
        doc.setTextColor(...BRAND.medGray);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.text(
            meta || `Generado: ${new Date().toLocaleDateString("es-ES")}`,
            margin,
            28.5,
        );
        if (subtitle) {
            doc.text(subtitle, pageW - margin, 28.5, { align: "right" });
        }

        // Tabla de datos
        const tableRows = data.map((item) =>
            accessors.map((acc) => {
                const val = extractValue(item, acc);
                return val !== null && val !== undefined ? String(val) : "";
            }),
        );

        autoTable(doc, {
            startY: 36,
            head: [headers],
            body: tableRows,
            margin: { left: margin, right: margin },
            styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 3,
                valign: "middle",
                textColor: BRAND.darkGray,
                lineColor: [220, 220, 220],
                lineWidth: 0.2,
            },
            headStyles: {
                fillColor: BRAND.darkOrange,
                textColor: BRAND.white,
                fontStyle: "bold",
                fontSize: 9,
                halign: "center",
            },
            alternateRowStyles: {
                fillColor: BRAND.lightGray,
            },
            rowStyles: {
                fillColor: BRAND.white,
            },
            didParseCell: (hookData) => {
                if (hookData.section === "body" && rowStyleFn) {
                    const item = data[hookData.row.index];
                    const custom = rowStyleFn(
                        item,
                        hookData.column.index,
                        hookData.row.index,
                    );
                    if (custom) {
                        Object.assign(hookData.cell.styles, custom);
                    }
                }
            },
            didDrawPage: (hookData) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(7);
                doc.setTextColor(...BRAND.medGray);
                doc.setFont("helvetica", "normal");
                doc.text(
                    `Página ${hookData.pageNumber} de ${pageCount}`,
                    pageW - margin,
                    doc.internal.pageSize.getHeight() - 6,
                    { align: "right" },
                );
                doc.text(
                    "StockMaster — Sistema de Gestión de Inventario",
                    margin,
                    doc.internal.pageSize.getHeight() - 6,
                );
            },
        });

        doc.save(buildFileName(fileName, "pdf"));
    } catch (err) {
        showToast("Error al generar PDF. Verifique dependencias.", "error");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. FUNCIONES ESPECÍFICAS POR REPORTE
// ─────────────────────────────────────────────────────────────────────────────

export const exportLowStockToPdf = (data, fileName = "Reporte_Stock_Bajo") => {
    return exportToPdf({
        title: "Reporte de Stock Bajo",
        subtitle: "Productos que requieren reabastecimiento",
        meta: `Generado: ${new Date().toLocaleDateString("es-ES")}`,
        headers: [
            "ID Producto",
            "Nombre Producto",
            "Almacén",
            "Stock Actual",
            "Stock Mínimo",
        ],
        accessors: [
            "productId",
            "productName",
            "warehouseName",
            "currentStock",
            "minimumStock",
        ],
        data,
        fileName,
        rowStyleFn: (item, colIndex) => {
            if (colIndex === 3 || colIndex === 4) {
                return {
                    textColor: BRAND.danger,
                    fillColor: BRAND.lightRed,
                    fontStyle: "bold",
                };
            }
        },
    });
};

export const exportMovementsToPdf = (
    data,
    startDate,
    endDate,
    fileName = "Reporte_Movimientos",
) => {
    const fmt = (d) =>
        d ? new Date(d + "T00:00:00").toLocaleDateString("es-ES") : "";
    return exportToPdf({
        title: "Reporte de Movimientos de Inventario",
        subtitle: "Historial de entradas y salidas",
        meta: `Período: ${fmt(startDate)} — ${fmt(endDate)}   |   Generado: ${new Date().toLocaleDateString("es-ES")}`,
        headers: ["Fecha", "Producto", "Tipo", "Cantidad", "Almacén", "Usuario"],
        accessors: [
            "movementDate",
            "productName",
            "movementType",
            "quantity",
            "warehouseName",
            "userName",
        ],
        data: data.map((item) => ({
            ...item,
            movementType: item.movementType === "SALIDA" ? "Salida" : "Entrada",
            quantity: (item.movementType === "SALIDA" ? "-" : "+") + item.quantity,
        })),
        fileName,
        rowStyleFn: (item, colIndex) => {
            const isExit =
                item.movementType === "Salida" || item.movementType === "SALIDA";
            if (colIndex === 2 || colIndex === 3) {
                return isExit
                    ? {
                        textColor: BRAND.danger,
                        fillColor: BRAND.lightRed,
                        fontStyle: "bold",
                        halign: "center",
                    }
                    : {
                        textColor: BRAND.success,
                        fillColor: BRAND.lightGreen,
                        fontStyle: "bold",
                        halign: "center",
                    };
            }
        },
    });
};

export const exportTopSellingToPdf = (
    data,
    fileName = "Reporte_Mas_Vendidos",
) => {
    const enriched = data.map((item, idx) => ({
        ...item,
        position: `#${idx + 1}`,
        unitsSold: `${item.unitsSold} unidades`,
        totalRevenue: `$${(item.totalRevenue || 0).toFixed(2)}`,
        averagePrice: `$${(item.averagePrice || (item.unitsSold > 0 ? item.totalRevenue / item.unitsSold : 0)).toFixed(2)}`,
    }));
    return exportToPdf({
        title: "Productos Más Vendidos",
        subtitle: "Ranking por cantidad vendida e ingresos",
        meta: `Generado: ${new Date().toLocaleDateString("es-ES")}`,
        headers: [
            "Posición",
            "Producto",
            "Unidades Vendidas",
            "Ingresos Generados",
            "Precio Promedio",
        ],
        accessors: [
            "position",
            "productName",
            "unitsSold",
            "totalRevenue",
            "averagePrice",
        ],
        data: enriched,
        fileName,
        rowStyleFn: (item, colIndex) => {
            if (colIndex === 0) {
                return {
                    textColor: BRAND.darkOrange,
                    fillColor: BRAND.lightOrange,
                    fontStyle: "bold",
                    halign: "center",
                };
            }
            if (colIndex === 2 || colIndex === 3) {
                return {
                    textColor: BRAND.success,
                    fillColor: BRAND.lightGreen,
                    fontStyle: "bold",
                    halign: "center",
                };
            }
        },
    });
};

export const exportSupplierToPdf = (
    data,
    supplierName = "",
    fileName = "Reporte_Trazabilidad_Proveedor",
) => {
    return exportToPdf({
        title: "Trazabilidad por Proveedor",
        subtitle: supplierName ? `Proveedor: ${supplierName}` : "",
        meta: `Proveedor: ${supplierName || "N/A"}   |   Generado: ${new Date().toLocaleDateString("es-ES")}`,
        headers: ["Producto", "Categoría", "Stock Total", "Almacén"],
        accessors: ["productName", "categoryName", "totalStock", "warehouseName"],
        data,
        fileName,
    });
};
