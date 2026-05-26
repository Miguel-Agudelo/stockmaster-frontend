import api from '../../core/api/api';

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

// Asignamos el objeto a una variable antes de exportarlo por defecto
const profileService = {
    getMyProfile,
    changePassword
};

export default profileService;