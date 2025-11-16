import React, { useState, useEffect } from 'react';
import stockMovementService from '../../services/stockMovementService';
import authService from '../../services/authService';
import './StockTransferPage.css';

const StockTransferPage = () => {
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [transferData, setTransferData] = useState({
        productId: '',
        originWarehouseId: '',
        destinationWarehouseId: '',
        quantity: '',
    });
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, warehousesRes] = await Promise.all([
                    stockMovementService.getProductsList(),
                    stockMovementService.getWarehousesList()
                ]);

                setProducts(productsRes.data);
                setWarehouses(warehousesRes.data);
                setListLoading(false);
            } catch (err) {
                setError('Error al cargar listas de productos o almacenes.');
                setListLoading(false);
                console.error('Error fetching lists:', err);
            }
        };

        fetchData();
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;

        setTransferData(prevData => ({
            ...prevData,
            [name]: name === 'quantity' ? (value === '' ? '' : Number(value)) : value
        }));
        setError(null);
        setSuccess(null);

        if (name === 'productId') {
            const selectedId = Number(value);

            const product = products.find(p => p.id === selectedId);
            setSelectedProduct(product || null);
        }
    };


    const validateForm = () => {
        const { productId, originWarehouseId, destinationWarehouseId, quantity } = transferData;

        if (!productId || !originWarehouseId || !destinationWarehouseId || quantity === '') {
            setError('Todos los campos son requeridos.');
            return false;
        }
        return true;
    };


    const handleTransfer = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        const currentUser = authService.getCurrentUser();
        const userId = currentUser ? currentUser.id : null;

        if (!userId) {
            setError('Error de sesión: No se pudo obtener el ID del usuario.');
            setLoading(false);
            return;
        }

        const dataToSend = {
            ...transferData,
            userId: userId,
        };

        try {
            const res = await stockMovementService.transferStock(dataToSend);
            setSuccess(`Transferencia de stock registrada con éxito. Ref: ${res.data.transferReference || new Date().getTime()}`);
            setTransferData({
                productId: '',
                originWarehouseId: '',
                destinationWarehouseId: '',
                quantity: '',
            });
            setSelectedProduct(null);
        } catch (err) {
            const message = err.response?.data?.message || 'Error al registrar la transferencia. Verifique el stock y los datos.';
            setError(` ${message}`);
            console.error('Error en la transferencia:', err.response || err);
        } finally {
            setLoading(false);
        }
    };


    if (listLoading) {
        return <div className="main-content">Cargando listas de productos y almacenes...</div>;
    }

    const destinationWarehouses = warehouses.filter(w => w.id !== transferData.originWarehouseId);


    return (
        <div className="main-content">
            <header className="page-header page-header-simple">
                <h2>Transferencia entre Almacenes</h2>
                <p className="subtitle">Transfiere productos de un almacén a otro</p>
            </header>

            <div className="transfer-content">

                <div className="transfer-form-card card">
                    <div className="card-header-icon">
                        <i className="fas fa-exchange-alt"></i> Registrar Transferencia
                    </div>

                    <form onSubmit={handleTransfer}>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div className="form-group">
                            <label htmlFor="productId">Producto:</label>
                            <select
                                id="productId"
                                name="productId"
                                value={transferData.productId}
                                onChange={handleChange}
                                disabled={loading || products.length === 0}
                                className="form-control"
                                required
                            >
                                <option value="">Seleccione un producto</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - {p.category || p.categoryName || ''}</option>
                                ))}
                            </select>
                            {products.length === 0 && <p className="hint">No hay productos disponibles.</p>}
                        </div>

                        <div className="form-row">
                            <div className="form-group form-group-col">
                                <label htmlFor="originWarehouseId">Almacén de Origen:</label>
                                <select
                                    id="originWarehouseId"
                                    name="originWarehouseId"
                                    value={transferData.originWarehouseId}
                                    onChange={handleChange}
                                    disabled={loading || warehouses.length === 0}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Origen</option>
                                    {warehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group form-group-col">
                                <label htmlFor="destinationWarehouseId">Almacén de Destino:</label>
                                <select
                                    id="destinationWarehouseId"
                                    name="destinationWarehouseId"
                                    value={transferData.destinationWarehouseId}
                                    onChange={handleChange}
                                    disabled={loading || !transferData.originWarehouseId || destinationWarehouses.length === 0}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Destino</option>
                                    {destinationWarehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                {transferData.originWarehouseId && destinationWarehouses.length === 0 && (
                                    <p className="hint">No hay otros almacenes disponibles.</p>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">Cantidad:</label>
                            <input
                                id="quantity"
                                type="number"
                                name="quantity"
                                value={transferData.quantity}
                                onChange={handleChange}
                                min="0"
                                step="1"
                                disabled={loading}
                                placeholder="0"
                                className="form-control"
                                required
                            />
                        </div>

                        <button type="submit" className="primary-button btn-stockmaster" disabled={loading}>
                            {loading ? 'Procesando...' : 'Registrar Transferencia'}
                        </button>
                    </form>
                </div>

                <div className="product-details-card card">
                    <div className="card-header-icon">
                        <i className="fas fa-box-open"></i> Producto Seleccionado
                    </div>
                    {selectedProduct ? (
                        <div className="product-info-grid">
                            <div className="info-label">Nombre</div>
                            <div className="info-value">{selectedProduct.name}</div>

                            <div className="info-label">Categoría</div>
                            <div className="info-value">{selectedProduct.category || selectedProduct.categoryName || 'N/A'}</div>

                            <div className="info-label">Precio</div>
                            <div className="info-value">${selectedProduct.price ? selectedProduct.price.toFixed(2) : 'N/A'}</div>

                            <div className="info-label">SKU</div>
                            <div className="info-value">{selectedProduct.sku}</div>

                            <div className="info-label">Descripción</div>
                            <div className="info-value">{selectedProduct.description || 'Sin descripción'}</div>
                        </div>
                    ) : (
                        <p className="no-selection-message">Seleccione un producto para ver sus detalles aquí.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default StockTransferPage;