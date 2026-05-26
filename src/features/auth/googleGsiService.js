const SCRIPT_ID = 'google-gsi-script';
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

let scriptPromise = null;
let initialized = false;
let activeCallback = null;

const loadScript = () => {
    if (!isClient) return Promise.reject(new Error('No browser environment'));
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        if (window.google) {
            resolve(window.google);
            return;
        }

        const existing = document.getElementById(SCRIPT_ID);
        if (existing) {
            existing.addEventListener('load', () => resolve(window.google));
            existing.addEventListener('error', reject);
            return;
        }

        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return scriptPromise;
};

export const initGoogleGsi = async (callback) => {
    if (!CLIENT_ID || !isClient) return;

    activeCallback = callback;

    if (initialized) return;

    await loadScript();

    // Handler nombrado para evitar warnings por función anónima y para claridad
    const handleGsiResponse = (response) => {
        // Llamada segura al callback activo
        activeCallback?.(response);
    };

    window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleGsiResponse,
    });

    initialized = true;
};

export const renderGoogleButton = (element, options = {}) => {
    if (!isClient || !window.google || !element) return;
    window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 300,
        ...options,
    });
};

export const googleClientId = CLIENT_ID;
