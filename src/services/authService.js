import api from './api';

const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });

        // Si el login es exitoso, la respuesta del backend incluirá un token y la información del usuario
        const { token, user } = response.data;

        // Guarda el token JWT en el almacenamiento local del navegador
        localStorage.setItem('token', token);

        // Guarda los datos del usuario (id y rol) para usarlos en el frontend
        // IMPORTANTE: Aquí se guarda el objeto tal como lo envía el backend: { role: "...", id_user: 1 }
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
    const userJson = localStorage.getItem('user');

    if (!userJson) {
        return null;
    }

    let user = JSON.parse(userJson);

    // 🎯 CORRECCIÓN CLAVE: Normalizar la ID de 'id_user' a 'id'
    // El backend envía 'id_user', pero el frontend espera 'id'
    if (user.id_user && !user.id) {
        user.id = user.id_user;
        delete user.id_user; // Opcional, pero limpia el objeto
    }

    return user;
};

const isUserAuthenticated = () => {
    return !!localStorage.getItem('token');
};

export default { login, logout, getCurrentUser, isUserAuthenticated };