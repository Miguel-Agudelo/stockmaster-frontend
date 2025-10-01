// src/services/productService.js
import api from './api';

const getProducts = () => {
    return api.get('/products');
};

const createProduct = (productData) => {
    return api.post('/products', productData);
};

const updateProduct = (productId, productData) => {
    return api.put(`/products/${productId}`, productData);
};

const deleteProduct = (productId) => {
    return api.delete(`/products/${productId}`);
};

export default { getProducts, createProduct, updateProduct, deleteProduct };