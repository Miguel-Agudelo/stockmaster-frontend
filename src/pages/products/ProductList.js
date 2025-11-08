// src/pages/products/ProductList.js (VERSIÓN FINAL CON BOTÓN PAPELERA)

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // 🟢 1. Importar useNavigate
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// 2. Importar faTrashRestore
import { faPlus, faBoxOpen, faLayerGroup, faWarehouse, faPencilAlt, faTrashAlt, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import ProductForm from '../../components/products/ProductForm';
import productService from '../../services/productService';
import '../../pages/products/ProductList.css';


// Reutilizamos MetricCard (componente local)
const MetricCard = ({ title, value, icon, color }) => (
    <div className="metric-card">
        <div className="card-header">
            <span className="card-title">{title}</span>
            <FontAwesomeIcon icon={icon} style={{ color: color, opacity: 0.8 }} />
        </div>
        <div className="card-value">{value}</div>
    </div>
);


const ProductList = ({userRole}) => {
    // 3. Inicializar useNavigate para la navegación
    const navigate = useNavigate();

    // 1. ESTADOS CLAVE
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);

    const isAdmin = userRole === 'ADMINISTRADOR';

    // 2. Lógica de carga de datos real (sin cambios)
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await productService.getAllProducts();
            setProducts(response.data);
        } catch (err) {
            console.error("Error al cargar productos:", err);
            setError("No se pudieron cargar los productos. Revise la consola y los permisos.");
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Efecto para cargar datos al montar el componente (sin cambios)
    useEffect(() => {
        fetchProducts();
    }, []);

    // 4. CÁLCULO DE MÉTRICAS REALES (useMemo para optimización) (sin cambios)
    const DYNAMIC_METRICS = useMemo(() => {
        if (products.length === 0) {
            return [
                { title: "Total Productos", value: 0, icon: faBoxOpen, color: "#FF7B00" },
                { title: "Categorías", value: 0, icon: faLayerGroup, color: "#10B981" },
                { title: "Stock Total", value: 0, icon: faWarehouse, color: "#F59E0B" },
            ];
        }

        const totalProducts = products.length;
        const uniqueCategories = new Set(products.map(p => p.categoryName));
        const totalCategories = uniqueCategories.size;

        const totalStock = products.reduce((sum, p) =>
                sum + (parseInt(p.totalStock) || 0)
            , 0);


        return [
            { title: "Total Productos", value: totalProducts, icon: faBoxOpen, color: "#FF7B00" },
            { title: "Categorías", value: totalCategories, icon: faLayerGroup, color: "#10B981" },
            { title: "Stock Total", value: totalStock, icon: faWarehouse, color: "#F59E0B" },
        ];
    }, [products]);


    // 5. FUNCIONES DE MODAL Y ACCIONES (sin cambios)
    const handleNewProduct = () => {
        setCurrentProduct(null); // Modo Creación
        setIsFormOpen(true);
    };

    const handleEdit = (product) => {
        setCurrentProduct(product); // Modo Edición
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setCurrentProduct(null);
        fetchProducts(); // Recarga la lista de la API
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
    };

    const cancelDeletion = () => {
        setProductToDelete(null);
    };

    const confirmDeletion = async () => {
        try {
            await productService.deleteProduct(productToDelete.id);
            setProductToDelete(null);
            fetchProducts();
        } catch (error) {
            console.error("Error al eliminar el producto:", error);
            alert("Error al eliminar el producto. Revise los permisos.");
            setProductToDelete(null);
        }
    };


    // 7. Filtrado de productos por búsqueda (sin cambios)
    const filteredProducts = products.filter(product =>
        (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.categoryName && product.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 8. Función de navegación a la papelera
    const handleGoToRecovery = () => {
        navigate('/products/recovery');
    };


    // 9. RENDERING
    return (
        <div className="main-content">
            {/* Header y botones de acción */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Productos</h1>
                    <p className="page-subtitle">Administrar catálogo de productos</p>
                </div>
                <div className="action-buttons-group"> {/* 🟢 Contenedor para alinear los botones */}
                    {/* BOTÓN PAPELERA (Solo Admin) */}
                    {isAdmin && (
                        <button className="delete-recovery-button" onClick={handleGoToRecovery}>
                            <FontAwesomeIcon icon={faTrashRestore} />
                            Papelera
                        </button>
                    )}

                    {/* Botón Nuevo Producto */}
                    <button className="add-new-button-orange" onClick={handleNewProduct}>
                        <FontAwesomeIcon icon={faPlus} />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Métricas (sin cambios) */}
            <div className="metrics-grid">
                {DYNAMIC_METRICS.map((metric, index) => (
                    <MetricCard
                        key={index}
                        title={metric.title}
                        value={isLoading ? 'Cargando...' : metric.value}
                        icon={metric.icon}
                        color={metric.color}
                    />
                ))}
            </div>

            {/* ... (Barra de Búsqueda) ... */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar productos por nombre, categoría o descripción..."
                    className="product-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>


            {/* Lista de Productos (Tabla Estilizada) (sin cambios en la tabla) */}
            <div className="product-list-card">
                <div className="table-info">
                    Lista de Productos
                    <p className="product-count">{filteredProducts.length} de {products.length} productos</p>
                </div>

                {isLoading ? (
                    <p className="loading-message">Cargando productos...</p>
                ) : error ? (
                    <div className="error-message api-error">{error}</div>
                ) : filteredProducts.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock Total</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.description}</td>
                                <td>
                                    <span className={`category-badge category-${product.categoryName.toLowerCase().replace(/\s/g, '-')}`}>
                                        {product.categoryName}
                                    </span>
                                </td>
                                <td>${product.price ? product.price.toFixed(2) : '0.00'}</td>
                                <td>
                                    <span className="stock-badge">{product.totalStock} unidades</span>
                                </td>
                                <td className="actions-cell">
                                    <button className="icon-button edit-button" onClick={() => handleEdit(product)}>
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    {isAdmin && (
                                        <button className="icon-button delete-button-red" onClick={() => handleDelete(product)}>
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    )}

                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="no-data-message">No se encontraron productos registrados.</p>
                )}
            </div>

            {/* MODALES (sin cambios) */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <ProductForm
                        onSave={handleCloseForm}
                        onCancel={handleCloseForm}
                        currentProduct={currentProduct}
                    />
                </div>
            )}

            {productToDelete && (
                <div className="modal-backdrop">
                    <div className="custom-modal delete-modal">
                        <div className="modal-content">
                            <h3>¿Eliminar Producto?</h3>
                            <p>
                                Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar
                                <strong> {productToDelete.name}</strong> permanentemente del inventario?
                            </p>
                            <div className="modal-actions">
                                <button className="cancel-button" onClick={cancelDeletion}>
                                    Cancelar
                                </button>
                                <button className="delete-button-red" onClick={confirmDeletion}>
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ProductList;