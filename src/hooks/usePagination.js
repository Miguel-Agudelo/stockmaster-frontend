import { useState, useMemo, useEffect } from 'react';

/**
 * Hook reutilizable de paginación — HU-PI2-07
 *
 * Criterio: al aplicar un filtro, la navegación debe reiniciarse desde la primera página.
 *
 * @param {Array}  items     - lista completa de elementos ya filtrada
 * @param {number} pageSize  - tamaño de página inicial (default 10)
 * @returns { currentPage, totalPages, pageSize, paginated, setPage, setPageSize }
 */
const usePagination = (items = [], initialPageSize = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    // Criterio HU-PI2-07: cada vez que cambia el listado filtrado, volvemos a página 1
    useEffect(() => {
        setCurrentPage(1);
    }, [items.length]);

    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

    // Slice de los elementos para la página actual
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return items.slice(start, start + pageSize);
    }, [items, currentPage, pageSize]);

    const setPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const handleSizeChange = (newSize) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    return {
        currentPage,
        totalPages,
        pageSize,
        paginated,
        setPage,
        setPageSize: handleSizeChange,
    };
};

export default usePagination;
