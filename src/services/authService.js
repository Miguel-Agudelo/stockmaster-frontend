// src/services/authService.js
import api from './api';

const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });

        // Si el login es exitoso, la respuesta del backend incluirá un token y la información del usuario
        const { token, user } = response.data;

        // Guarda el token JWT en el almacenamiento local del navegador
        localStorage.setItem('token', token);

        // Guarda los datos del usuario (id y rol) para usarlos en el frontend
        localStorage.setItem('user', JSON.stringify(user));

        // Retorna la respuesta completa en caso de que necesites más información en el componente
        return response.data;
    } catch (error) {
        // Si la respuesta es un error (ej. 401 Unauthorized), captúralo
        console.error("Login failed:", error.response ? error.response.data : error.message);
        throw error;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

const isUserAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export default { login, logout, getCurrentUser, isUserAuthenticated };