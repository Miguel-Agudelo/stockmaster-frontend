import api from './api';
import { jwtDecode } from 'jwt-decode';

// Función auxiliar para comprobar si el token JWT ha expirado
const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        // Si hay un error al decodificar (token mal formado), asumimos que no es válido
        console.error("Error al decodificar el token:", error);
        return true;
    }
};

const getAuthHeader = () => {
    // Es vital llamar a isUserAuthenticated aquí para limpiar el token si está vencido ANTES de usarlo
    if (!isUserAuthenticated()) {
        return {};
    }

    const token = localStorage.getItem('token');

    if (token) {
        return { Authorization: 'Bearer ' + token };
    }
    return {};
};


const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });

        const { token, user } = response.data;

        localStorage.setItem('token', token);
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


const isUserAuthenticated = () => {
    const token = localStorage.getItem('token');

    // 1. Si no hay token, no está autenticado
    if (!token) {
        return false;
    }

    // 2. VERIFICACIÓN CLAVE: Si el token existe PERO está vencido
    if (isTokenExpired(token)) {
        console.log("Token ha expirado (Localmente) o ha sido revocado. Forzando cierre de sesión.");

        // Borrar el token y los datos del usuario.
        logout();

        return false; // No está autenticado
    }

    // 3. Si existe y no está vencido, está autenticado
    return true;
};


const getCurrentUser = () => {
    // Llamamos a isUserAuthenticated para garantizar que cualquier token expirado sea eliminado
    if (!isUserAuthenticated()) {
        return null;
    }

    const userJson = localStorage.getItem('user');

    if (!userJson) {
        return null;
    }

    let user = JSON.parse(userJson);

    // Mantenemos la lógica de adaptación del ID
    if (user.id_user && !user.id) {
        user.id = user.id_user;
        delete user.id_user;
    }

    return user;
};


export default {
    login,
    logout,
    getCurrentUser,
    isUserAuthenticated,
    getAuthHeader,
};