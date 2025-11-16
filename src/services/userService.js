import api from './api';

const getAllUsers = () => {
    return api.get('/users');
};

const createUser = (userData) => {
    return api.post('/users', userData);
};

const updateUser = (userId, userData) => {
    return api.put(`/users/${userId}`, userData);
};

const deleteUser = (userId) => {
    return api.delete(`/users/${userId}`);
};

export default { getAllUsers, createUser, updateUser, deleteUser };