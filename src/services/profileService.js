import api from './api';

/**
 * Obtiene el perfil del usuario autenticado desde el backend.
 */
const getMyProfile = () => {
    return api.get('/profile/me');
};

/**
 * Cambia la contraseña del usuario autenticado.
 * @param {object} passwordData - { currentPassword, newPassword, confirmPassword }
 */
const changePassword = (passwordData) => {
    return api.put('/profile/change-password', passwordData);
};

export default { getMyProfile, changePassword };