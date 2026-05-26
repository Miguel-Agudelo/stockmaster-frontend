import { useState, useEffect, useCallback } from 'react';

/**
 * Hook genérico para ejecutar funciones async con estados de carga y error.
 *
 * @param {Function} asyncFn   - Función async a ejecutar (debe ser estable o estar envuelta en useCallback)
 * @param {boolean}  immediate - Si true, ejecuta automáticamente al montar (default: true)
 * @returns {{ data, isLoading, error, execute }}
 */
const useAsync = (asyncFn, immediate = true) => {
    const [data,      setData]      = useState(null);
    const [isLoading, setIsLoading] = useState(immediate);
    const [error,     setError]     = useState(null);

    const execute = useCallback(async (...args) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await asyncFn(...args);
            setData(result);
            return result;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [asyncFn]);

    useEffect(() => {
        if (immediate) execute();
    }, [immediate, execute]);

    return { data, isLoading, error, execute };
};

export default useAsync;