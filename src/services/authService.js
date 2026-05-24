import api from './api';
import { jwtDecode } from 'jwt-decode';

const isTokenExpired = (token) => {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (error) {
        console.error("Error al decodificar el token:", error);
        return true;
    }
};

const getAuthHeader = () => {
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


const loginWithGoogle = async (idToken) => {
    try {
        const response = await api.post('/auth/google/login', { idToken });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data;
    } catch (error) {
        console.error("Google Login failed:", error.response ? error.response.data : error.message);
        throw error;
    }
};


const linkGoogleAccount = async (idToken) => {
    return api.post('/auth/google/link', { idToken });
};


const unlinkGoogleAccount = async () => {
    return api.delete('/auth/google/unlink');
};


const getGoogleLinkStatus = async () => {
    return api.get('/auth/google/status');
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

const isUserAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }
    if (isTokenExpired(token)) {
        console.log("Token ha expirado (Localmente) o ha sido revocado. Forzando cierre de sesión.");
        logout();
        return false;
    }
    return true;
};

const getCurrentUser = () => {
    if (!isUserAuthenticated()) {
        return null;
    }
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        return null;
    }
    let user = JSON.parse(userJson);
    if (user.id_user && !user.id) {
        user.id = user.id_user;
        delete user.id_user;
    }
    return user;
};

export default {
    login,
    loginWithGoogle,
    linkGoogleAccount,
    unlinkGoogleAccount,
    getGoogleLinkStatus,
    logout,
    getCurrentUser,
    isUserAuthenticated,
    getAuthHeader,
};
