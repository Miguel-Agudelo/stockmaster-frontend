import api from './api';

const getAllCategories = () => api.get('/categories');

const getRootCategories = () => api.get('/categories/roots');

const createCategory = (categoryData) => api.post('/categories', categoryData);

const updateCategory = (id, categoryData) => api.put(`/categories/${id}`, categoryData);

const deleteCategory = (id) => api.delete(`/categories/${id}`);

export default { getAllCategories, getRootCategories, createCategory, updateCategory, deleteCategory };
