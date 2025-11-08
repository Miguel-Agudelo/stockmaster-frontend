import api from './api'; // Asumo que este es tu cliente Axios configurado

// Obtiene el token JWT del localStorage y lo formatea para el header 'Authorization'.
const getAuthHeader = () => {
    const token = localStorage.getItem('token');

    if (token) {
        // Devuelve el objeto de headers que Axios espera para peticiones autenticadas
        return { Authorization: 'Bearer ' + token };
    }
    // Si no hay token, devuelve un objeto vacío.
    return {};
};


const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });

        // Si el login es exitoso, la respuesta del backend incluirá un token y la información del usuario
        const { token, user } = response.data;

        // Guarda el token JWT en el almacenamiento local del navegador
        localStorage.setItem('token', token);

        // Guarda los datos del usuario (id y rol)
        localStorage.setItem('user', JSON.stringify(user));

        return response.data;
    } catch (error) {
        console.error("Login failed:", error.response ? error.response.data : error.message);
        throw error;
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    const userJson = localStorage.getItem('user');

    if (!userJson) {
        return null;
    }

    let user = JSON.parse(userJson);

    // Normalizar la ID de 'id_user' a 'id'
    // Esto asegura que el frontend siempre use 'user.id'
    if (user.id_user && !user.id) {
        user.id = user.id_user;
        delete user.id_user;
    }

    return user;
};

const isUserAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// EXPORTAR la nueva función getAuthHeader para que otros servicios puedan usarla
export default {
    login,
    logout,
    getCurrentUser,
    isUserAuthenticated,
    getAuthHeader // ⬅️ ¡Agregado!
};