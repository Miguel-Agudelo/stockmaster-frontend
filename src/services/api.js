import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticiones: Añade el token actual si existe
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// NUEVO INTERCEPTOR DE RESPUESTA: Captura y guarda el nuevo token si se renovó
api.interceptors.response.use(
    (response) => {
        // Capturamos el nuevo token enviado por SessionRenewalFilter del backend
        const newToken = response.headers['x-new-token'];

        if (newToken) {
            console.log("Token renovado automáticamente por el backend (Sesión Deslizante). Guardando nuevo token...");
            // Sobrescribimos el token en localStorage con el nuevo token de vida completa
            localStorage.setItem('token', newToken);
        }
        return response;
    },
    (error) => {
        // Manejo de errores de respuesta (ej: 401, 500)
        return Promise.reject(error);
    }
);


export default api;