import api from '../../core/api/api';

const getAllUsers = () => api.get('/users');
const createUser = (userData) => api.post('/users', userData);
const updateUser = (userId, userData) => api.put(`/users/${userId}`, userData);
const deleteUser = (userId) => api.delete(`/users/${userId}`);

const userService = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
};

export default userService;