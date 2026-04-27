import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBoxOpen, faLayerGroup, faWarehouse, faPencilAlt, faTrashAlt, faTrashRestore } from '@fortawesome/free-solid-svg-icons';
import ProductForm from '../../components/products/ProductForm';
import Pagination from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import productService from '../../services/productService';
import '../../pages/products/ProductList.css';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import ProductChangeLogModal from '../../components/products/ProductChangeLogModal';

const SummaryCard = ({ title, value, colorClass }) => {
    const displayValue = typeof value === 'number'
        ? value.toLocaleString('es-CO')
        : value;
    return (
        <div className={`summary-card ${colorClass}`}>
            <div className="card-content">
                <p className="card-title">{title}</p>
                <h2 className="card-value">{displayValue}</h2>
            </div>
        </div>
    );
};


const ProductList = ({ userRole }) => {
    const navigate = useNavigate();

    const [products,       setProducts]       = useState([]);
    const [isLoading,      setIsLoading]      = useState(true);
    const [error,          setError]          = useState(null);
    const [searchTerm,     setSearchTerm]     = useState('');
    const [isFormOpen,     setIsFormOpen]     = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [changeLogProduct, setChangeLogProduct] = useState(null);
    const isAdmin = userRole === 'ADMINISTRADOR';

    // ── Carga de datos ────────────────────────────────────────────────────────
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await productService.getAllProducts();
            setProducts(response.data);
        } catch (err) {
            console.error('Error al cargar productos:', err);
            setError('No se pudieron cargar los productos.');
            setProducts([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProducts(); }, []);

    // ── Métricas ──────────────────────────────────────────────────────────────
    const DYNAMIC_METRICS = useMemo(() => {
        const totalProducts    = products.length;
        const uniqueCategories = new Set(products.map(p => p.categoryName)).size;
        const totalStock       = products.reduce((s, p) => s + (parseInt(p.totalStock) || 0), 0);
        return [
            { title: 'Total Productos', value: totalProducts,    colorClass: 'metric-orange' },
            { title: 'Categorías',      value: uniqueCategories, colorClass: 'metric-green'  },
            { title: 'Stock Total',     value: totalStock,       colorClass: 'metric-yellow' },
        ];
    }, [products]);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const handleNewProduct  = () => { setCurrentProduct(null); setIsFormOpen(true); };
    const handleEdit        = (p) => { setCurrentProduct(p); setIsFormOpen(true); };
    const handleCloseForm   = () => { setIsFormOpen(false); setCurrentProduct(null); fetchProducts(); };
    const handleDelete      = (p) => setProductToDelete(p);
    const cancelDeletion    = () => setProductToDelete(null);
    const confirmDeletion   = async () => {
        try {
            await productService.deleteProduct(productToDelete.id);
            setProductToDelete(null);
            fetchProducts();
        } catch (err) {
            console.error('Error al eliminar el producto:', err);
            setProductToDelete(null);
        }
    };

    // ── Filtrado + paginación ─────────────────────────────────────────────────
    const filteredProducts = products.filter(p =>
        (p.name         && p.name.toLowerCase().includes(searchTerm.toLowerCase()))         ||
        (p.description  && p.description.toLowerCase().includes(searchTerm.toLowerCase()))  ||
        (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        // También buscar por proveedor
        (p.suppliers && p.suppliers.some(s =>
            s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())
        ))
    );

    const { currentPage, pageSize, paginated: paginatedProducts, setPage, setPageSize } =
        usePagination(filteredProducts);

    const handleOpenChangeLog = (product) => setChangeLogProduct(product);
    const handleCloseChangeLog = () => setChangeLogProduct(null);
    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="main-content">

            {/* Header */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Productos</h1>
                    <p className="page-subtitle">Administrar catálogo de productos</p>
                </div>
                <div className="action-buttons-group">
                    {isAdmin && (
                        <button className="delete-recovery-button" onClick={() => navigate('/products/recovery')}>
                            <FontAwesomeIcon icon={faTrashRestore} /> Papelera
                        </button>
                    )}
                    <button className="add-new-button-orange" onClick={handleNewProduct}>
                        <FontAwesomeIcon icon={faPlus} /> Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Métricas */}
            <div className="summary-cards-container">
                {DYNAMIC_METRICS.map((m, i) => (
                    <SummaryCard
                        key={i}
                        title={m.title}
                        value={isLoading ? 'Cargando...' : m.value}
                        colorClass={m.colorClass}
                    />
                ))}
            </div>

            {/* Búsqueda */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar por nombre, categoría, descripción o proveedor..."
                    className="product-search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Tabla */}
            <div className="product-list-card">
                <div className="table-info">
                    Lista de Productos
                    <p className="product-count">
                        Mostrando {filteredProducts.length} de {products.length} productos
                    </p>
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
                            <th>Proveedores</th>
                            <th>Precio</th>
                            <th>Stock Total</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedProducts.map(product => (
                            <tr key={product.id}>
                                <td><strong>{product.name}</strong></td>
                                <td style={{ color: '#6B7280', fontSize: '0.88rem' }}>
                                    {product.description || '—'}
                                </td>
                                <td>
                                        <span className={`category-badge category-${(product.categoryName || '').toLowerCase().replace(/\s/g, '-')}`}>
                                            {product.categoryName}
                                        </span>
                                </td>

                                {/* ── Columna de Proveedores ── */}
                                <td>
                                    {product.suppliers && product.suppliers.length > 0 ? (
                                        <div className="supplier-tags">
                                            {product.suppliers.map(s => (
                                                <span key={s.id} className="supplier-tag" title={s.email || s.nit || ''}>
                                                        {s.name}
                                                    </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="supplier-tag-none">Sin proveedor</span>
                                    )}
                                </td>

                                <td>${product.price ? product.price.toFixed(2) : '0.00'}</td>
                                <td>
                                    <span className="stock-badge">{product.totalStock} unidades</span>
                                </td>
                                <td className="actions-cell">
                                    <button className="icon-button edit-button" onClick={() => handleEdit(product)} title="Editar">
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    <button
                                        className="icon-button"
                                        style={{ color: '#0EA5E9' }}
                                        onClick={() => handleOpenChangeLog(product)}
                                        title="Ver historial de cambios"
                                    >
                                        <FontAwesomeIcon icon={faHistory} />
                                    </button>
                                    {changeLogProduct && (
                                        <ProductChangeLogModal
                                            product={changeLogProduct}
                                            onClose={handleCloseChangeLog}
                                        />
                                    )}
                                    {isAdmin && (
                                        <button className="icon-button delete-button-red" onClick={() => handleDelete(product)} title="Eliminar">
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

                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredProducts.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onSizeChange={setPageSize}
                />
            </div>

            {/* Modal: Formulario */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <ProductForm
                        onSave={handleCloseForm}
                        onCancel={handleCloseForm}
                        currentProduct={currentProduct}
                    />
                </div>
            )}

            {/* Modal: Confirmar eliminación */}
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
                                <button className="cancel-button" onClick={cancelDeletion}>Cancelar</button>
                                <button className="delete-button-red" onClick={confirmDeletion}>Eliminar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
