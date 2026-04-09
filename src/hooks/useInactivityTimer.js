import { useEffect, useRef, useCallback } from 'react';
import authService from '../services/authService';
import api from '../services/api';

/**
 * Hook de inactividad — HU de sesión
 *
 * Problema que resuelve:
 *   El JWT expira en 30 min desde que se emitió (tiempo absoluto).
 *   El backend también tiene un timer de inactividad de 30 min.
 *   Si el usuario tiene actividad en la UI pero NO hace peticiones al backend,
 *   el backend no sabe que está activo y el token expira igual.
 *
 * Solución:
 *   1. Detectar actividad del usuario en el navegador (mousemove, click, keydown, scroll, touchstart).
 *   2. Si hay actividad y han pasado al menos PING_INTERVAL ms desde el último ping,
 *      hacer GET /api/auth/ping al backend. Esto tiene dos efectos:
 *        a) El SessionInactivityFilter actualiza el lastAccessMap → reinicia el timer del backend.
 *        b) El SessionRenewalFilter detecta que el token está próximo a expirar y
 *           devuelve un X-New-Token → el interceptor de api.js lo guarda automáticamente.
 *   3. Si pasan INACTIVITY_TIME ms sin ninguna actividad del usuario, cerrar sesión localmente.
 */

const INACTIVITY_TIME = 30 * 60 * 1000;   // 30 minutos → cierre local por inactividad
const PING_INTERVAL   =  4 * 60 * 1000;   // Ping al backend cada 4 min si hay actividad

const useInactivityTimer = () => {

    const inactivityRef = useRef(null);   // timer para cierre por inactividad
    const lastPingRef   = useRef(0);      // timestamp del último ping al backend
    const isAuthenticated = authService.isUserAuthenticated();

    // ── Ping silencioso al backend ────────────────────────────────────────────
    const pingBackend = useCallback(async () => {
        try {
            // Cualquier endpoint protegido sirve para renovar el lastAccessMap.
            // Usamos el dashboard porque es muy ligero.
            await api.get('/auth/ping');
        } catch {
            // Si falla (401 = sesión expirada en el backend), el interceptor de api.js
            // NO hace nada automático, pero isUserAuthenticated() lo detectará
            // en la próxima comprobación y redirigirá al login.
        }
    }, []);

    // ── Cierre de sesión por inactividad ──────────────────────────────────────
    const forceLogout = useCallback(() => {
        authService.logout();
        console.warn('Sesión cerrada por inactividad (30 min sin actividad).');
        window.location.replace('/login');
    }, []);

    // ── Reinicio del timer y ping condicional ─────────────────────────────────
    const resetTimer = useCallback(() => {
        // 1. Reiniciar el temporizador local de inactividad
        if (inactivityRef.current) clearTimeout(inactivityRef.current);
        inactivityRef.current = setTimeout(forceLogout, INACTIVITY_TIME);

        // 2. Ping al backend si han pasado más de PING_INTERVAL desde el último ping
        const now = Date.now();
        if (now - lastPingRef.current >= PING_INTERVAL) {
            lastPingRef.current = now;
            pingBackend();
        }
    }, [forceLogout, pingBackend]);

    // ── Configuración de listeners ────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated) return;

        // Hacer un ping inmediato al montar para registrar actividad inicial
        lastPingRef.current = Date.now();
        pingBackend();

        // Arrancar el timer local
        resetTimer();

        // Eventos que consideramos "actividad del usuario"
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(ev => window.addEventListener(ev, resetTimer, { passive: true }));

        return () => {
            if (inactivityRef.current) clearTimeout(inactivityRef.current);
            events.forEach(ev => window.removeEventListener(ev, resetTimer));
        };
    }, [isAuthenticated, resetTimer, pingBackend]);
};

export default useInactivityTimer;
