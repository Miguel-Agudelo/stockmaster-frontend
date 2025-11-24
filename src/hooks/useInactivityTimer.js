import { useEffect, useRef, useCallback } from 'react';
import authService from '../services/authService';

const INACTIVITY_TIME = 110000;

const useInactivityTimer = () => {

    const timeoutRef = useRef(null);
    const isAuthenticated = authService.isUserAuthenticated();


    // Función para forzar el cierre de sesión y la redirección
    const forceLogout = useCallback(() => {
        authService.logout();
        console.warn("Sesión cerrada por INACTIVIDAD (Timer Local).");
        window.location.replace('/login');
    }, []);

    // Función para reiniciar el temporizador (Solo maneja el temporizador de inactividad)
    const resetTimer = useCallback(() => {
        // 1. Reiniciar el temporizador de Inactividad (Controla el logout por inactividad)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(forceLogout, INACTIVITY_TIME);

    }, [forceLogout]);

    // useEffect para configurar y limpiar los listeners
    useEffect(() => {
        if (!isAuthenticated) {
            // Si no está autenticado, no hacemos nada y el useEffect termina.
            return;
        }

        // Iniciar el temporizador tan pronto como se monta el componente
        resetTimer();

        // 3. Agregar listeners de eventos globales (actividad)
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        // 4. Función de limpieza (cleanup)
        return () => {
            // Limpiar el temporizador y los listeners
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };

    }, [isAuthenticated, resetTimer]);
};

export default useInactivityTimer;