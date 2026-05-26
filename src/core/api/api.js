import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de Peticiones: añade el token actual si existe
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Interceptor de Respuesta: captura y guarda el nuevo token si el backend lo renovó
api.interceptors.response.use(
    response => {
        const newToken = response.headers['x-new-token'];
        if (newToken) {
            localStorage.setItem('token', newToken);
        }
        return response;
    },
    error => Promise.reject(error)
);

export default api;
