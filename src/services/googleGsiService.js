/**
 * googleGsiService.js
 * Singleton que centraliza la carga e inicialización del script de Google GSI.
 * Garantiza que initialize() se llame UNA SOLA VEZ en toda la app,
 * sin importar StrictMode ni cuántos componentes usen Google.
 */

const SCRIPT_ID = 'google-gsi-script';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

let scriptPromise = null;   // Promise de carga del script
let initialized   = false;  // ¿Ya se llamó initialize()?
let activeCallback = null;  // Callback más reciente (se actualiza sin re-inicializar)

/** Carga el script de Google una sola vez y retorna una Promise. */
const loadScript = () => {
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        if (window.google) { resolve(window.google); return; }

        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load',  () => resolve(window.google));
            existing.addEventListener('error', reject);
            return;
        }

        const script    = document.createElement('script');
        script.id       = SCRIPT_ID;
        script.src      = 'https://accounts.google.com/gsi/client';
        script.async    = true;
        script.defer    = true;
        script.onload   = () => resolve(window.google);
        script.onerror  = reject;
        document.head.appendChild(script);
    });

    return scriptPromise;
};

/**
 * Inicializa Google GSI con el callback dado.
 * Si ya fue inicializado, solo actualiza el callback activo (sin llamar initialize de nuevo).
 * @param {Function} callback
 */
export const initGoogleGsi = async (callback) => {
    if (!CLIENT_ID) return;

    activeCallback = callback; // siempre actualizar

    if (initialized) return;  // no volver a llamar initialize()

    await loadScript();

    window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
            if (activeCallback) activeCallback(response);
        },
    });

    initialized = true;
};

/**
 * Renderiza el botón oficial de Google en el elemento dado.
 * @param {HTMLElement} element
 * @param {Object} options
 */
export const renderGoogleButton = (element, options = {}) => {
    if (!window.google || !element) return;
    window.google.accounts.id.renderButton(element, {
        theme:  'outline',
        size:   'large',
        shape:  'rectangular',
        width:  300,
        ...options,
    });
};

export const googleClientId = CLIENT_ID;
