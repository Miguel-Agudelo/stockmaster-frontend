// javascript
import React, { useState, useEffect, useCallback } from 'react';
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
        motive: '',
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productStockDetails, setProductStockDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [quantitySpecificError, setQuantitySpecificError] = useState(null);

    // FUNCIÓN PARA OBTENER EL STOCK DETALLADO (MEMORIZADA)
    const fetchProductStock = useCallback(async (productId, currentOriginId) => {
        if (!productId) {
            setProductStockDetails([]);
            return;
        }
        try {
            const res = await stockMovementService.getProductStockByWarehouses(productId);

            // Formatear y filtrar: Asegurar que currentStock sea un número y filtrar stock > 0
            const availableStock = res.data.map(item => ({
                ...item,
                currentStock: Number(item.currentStock) || 0,
                warehouseId: Number(item.warehouseId)
            })).filter(item => item.currentStock > 0);

            setProductStockDetails(availableStock);

            // Si el almacén de origen seleccionado ya no tiene stock, lo deseleccionamos
            if (currentOriginId && !availableStock.some(s => s.warehouseId === Number(currentOriginId))) {
                setTransferData(prev => ({...prev, originWarehouseId: ''}));
            }

        } catch (err) {
            console.error("Error al cargar stock del producto:", err);
            setProductStockDetails([]);
        }
    }, []);

    // Carga inicial de datos (Productos y Almacenes)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, warehousesRes] = await Promise.all([
                    stockMovementService.getProductsList(),
                    stockMovementService.getWarehousesList()
                ]);

                // Asegurar que los IDs de almacén sean números
                const formattedWarehouses = warehousesRes.data.map(w => ({
                    ...w,
                    id: Number(w.id)
                }));

                setProducts(productsRes.data);
                setWarehouses(formattedWarehouses);
                setListLoading(false);
            } catch (err) {
                setError('Error al cargar listas de productos o almacenes.');
                setListLoading(false);
                console.error('Error fetching lists:', err);
            }
        };

        fetchData();
    }, []);

    // Hook único para cargar stock detallado y revalidar cuando cambia producto u origen
    useEffect(() => {
        const productId = transferData.productId;
        const originWarehouseId = transferData.originWarehouseId;

        if (productId) {
            // Llamamos a la función con el ID numérico del producto y el origen actual
            fetchProductStock(Number(productId), originWarehouseId);
        } else {
            setProductStockDetails([]);
            setTransferData(prevData => ({
                ...prevData,
                originWarehouseId: '',
                destinationWarehouseId: '',
                quantity: '',
            }));
            setQuantitySpecificError(null);
        }
    }, [transferData.productId, transferData.originWarehouseId, fetchProductStock]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        // La lógica de conversión a numérico debe manejar el string vacío ('') para los inputs number
        const numericValue = (name === 'quantity' || name === 'productId' || name === 'originWarehouseId' || name === 'destinationWarehouseId')
            ? (value === '' ? '' : Number(value))
            : value;

        setTransferData(prevData => ({
            ...prevData,
            [name]: numericValue
        }));
        setError(null);
        setSuccess(null);

        if (name !== 'quantity') {
            setQuantitySpecificError(null);
        }

        if (name === 'productId') {
            const product = products.find(p => p.id === Number(value));
            setSelectedProduct(product || null);
            setTransferData(prevData => ({
                ...prevData,
                originWarehouseId: '',
                destinationWarehouseId: '',
                quantity: '',
            }));
        }

        // Lógica de reseteo para evitar que Origen y Destino sean iguales
        if (name === 'originWarehouseId' && Number(value) === Number(transferData.destinationWarehouseId)) {
            setTransferData(prevData => ({ ...prevData, destinationWarehouseId: '' }));
        }
        if (name === 'destinationWarehouseId' && Number(value) === Number(transferData.originWarehouseId)) {
            setTransferData(prevData => ({ ...prevData, originWarehouseId: '' }));
        }
    };


    const validateForm = () => {
        const { productId, originWarehouseId, destinationWarehouseId, quantity, motive } = transferData;

        // 1. Validaciones de campos vacíos
        if (!productId || !originWarehouseId || !destinationWarehouseId || quantity === '' || !motive) {
            setError('Todos los campos son requeridos (incluyendo el Motivo).');
            return false;
        }
        // 2. Validación de cantidad positiva (la validación de stock la hace el useEffect)
        if (Number(quantity) <= 0) {
            setError('La cantidad debe ser mayor a cero.');
            return false;
        }

        // 3. Re-validación final de stock usando el estado actual del error específico
        if (quantitySpecificError) {
            // Este caso ya debería haber sido manejado por el useEffect, pero es un buen doble check
            setError('Error: La cantidad excede el stock disponible en el almacén de origen.');
            return false;
        }
        setError(null);
        return true;
    };


    const handleTransfer = async (e) => {
        e.preventDefault();

        // El error específico de stock es el primer bloqueador
        if (quantitySpecificError) {
            setError('Corrige el error de cantidad antes de enviar.');
            return;
        }

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
            quantity: Number(transferData.quantity),
            productId: Number(transferData.productId),
            originWarehouseId: Number(transferData.originWarehouseId),
            destinationWarehouseId: Number(transferData.destinationWarehouseId),
            userId: userId,
        };

        try {
            const res = await stockMovementService.transferStock(dataToSend);
            setSuccess(`Transferencia de stock registrada con éxito. Ref: ${res.data.transferReference || new Date().getTime()}`);

            // Reset de campos tras éxito
            setTransferData({
                productId: '',
                originWarehouseId: '',
                destinationWarehouseId: '',
                quantity: '',
                motive: '',
            });
            setSelectedProduct(null);
            setProductStockDetails([]);
        } catch (err) {
            const message = err.response?.data?.message || 'Error al registrar la transferencia. Verifique el stock y los datos.';
            setError(`Error de API: ${message}`);
            console.error('Error en la transferencia:', err.response || err);
        } finally {
            setLoading(false);
        }
    };


    if (listLoading) {
        return <div className="main-content">Cargando listas de productos y almacenes...</div>;
    }

    const originIdNumber = Number(transferData.originWarehouseId) || null;

    // Almacenes disponibles para destino (excluyendo el origen)
    const destinationWarehouses = warehouses.filter(w =>
        w.id !== originIdNumber
    );

    // Stock disponible de los almacenes
    const availableOriginWarehouses = productStockDetails
        .map(stockDetail => {
            const warehouse = warehouses.find(w => w.id === stockDetail.warehouseId);
            return warehouse ? {...warehouse, currentStock: stockDetail.currentStock} : null;
        })
        .filter(w => w);

    // Stock disponible en el almacén de origen seleccionado
    const currentOriginStock = availableOriginWarehouses.find(w => w.id === originIdNumber)?.currentStock;


    return (
        <div className="main-content">
            <header className="page-header page-header-simple">
                <h2>Transferencia entre Almacenes</h2>
                <p className="subtitle">Transfiere productos de un almacén a otro</p>
            </header>

            <div className="transfer-content">

                {/* FORMULARIO DE TRANSFERENCIA */}
                <div className="transfer-form-card card">
                    <div className="card-header-icon">
                        <i className="fas fa-exchange-alt"></i> Registrar Transferencia
                    </div>

                    <form onSubmit={handleTransfer}>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        {/* PRODUCTO */}
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
                            {/* ALMACÉN DE ORIGEN (FILTRADO POR STOCK) */}
                            <div className="form-group form-group-col">
                                <label htmlFor="originWarehouseId">Almacén de Origen:</label>
                                <select
                                    id="originWarehouseId"
                                    name="originWarehouseId"
                                    value={transferData.originWarehouseId}
                                    onChange={handleChange}
                                    disabled={loading || !transferData.productId || availableOriginWarehouses.length === 0}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Origen</option>
                                    {availableOriginWarehouses.map(w => (
                                        <option key={w.id} value={w.id}>
                                            {w.name} (Stock: {w.currentStock})
                                        </option>
                                    ))}
                                </select>
                                {transferData.productId && availableOriginWarehouses.length === 0 && (
                                    <p className="hint hint-warning" style={{color: '#e68900', fontWeight: 'bold'}}>
                                        El producto seleccionado no tiene stock disponible para transferir.
                                    </p>
                                )}
                            </div>

                            {/* ALMACÉN DE DESTINO */}
                            <div className="form-group form-group-col">
                                <label htmlFor="destinationWarehouseId">Almacén de Destino:</label>
                                <select
                                    id="destinationWarehouseId"
                                    name="destinationWarehouseId"
                                    value={transferData.destinationWarehouseId}
                                    onChange={handleChange}
                                    disabled={loading || !transferData.originWarehouseId}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Destino</option>
                                    {destinationWarehouses.map(w => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                                {transferData.originWarehouseId && destinationWarehouses.length === 0 && (
                                    <p className="hint">No hay otros almacenes disponibles (solo tienes un almacén total).</p>
                                )}
                            </div>
                        </div>

                        {/* CANTIDAD (CON CLASE CONDICIONAL PARA EL ERROR) */}
                        <div className="form-group">
                            <label htmlFor="quantity">Cantidad:</label>
                            <input
                                id="quantity"
                                type="number"
                                name="quantity"
                                value={transferData.quantity}
                                onChange={handleChange}
                                min="1"
                                step="1"
                                disabled={loading || !transferData.originWarehouseId}
                                placeholder="0"
                                // Aplicamos la clase de borde de error si existe un error específico de cantidad
                                className={`form-control ${quantitySpecificError ? 'input-error-border' : ''}`}
                                required
                            />
                            {transferData.originWarehouseId && currentOriginStock !== undefined && (
                                <p className="hint">Stock máximo disponible en origen: {currentOriginStock}</p>
                            )}

                            {/* ALERTA ESTRUCTURADA PERSONALIZADA DE ERROR DE STOCK */}
                            {quantitySpecificError && (
                                <div className="alert alert-error alert-quantity-specific">
                                    {quantitySpecificError}
                                </div>
                            )}
                        </div>

                        {/* MOTIVO */}
                        <div className="form-group">
                            <label htmlFor="motive">Motivo de la Transferencia:</label>
                            <input
                                id="motive"
                                type="text"
                                name="motive"
                                value={transferData.motive}
                                onChange={handleChange}
                                maxLength="255"
                                disabled={loading}
                                placeholder="Ej: Movimiento por reorganización de stock"
                                className="form-control"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button btn-stockmaster"
                            // El botón se deshabilita si está cargando o si hay un error de cantidad
                            disabled={loading || !!quantitySpecificError}
                        >
                            {loading ? 'Procesando...' : 'Registrar Transferencia'}
                        </button>
                    </form>
                </div>

                {/* DETALLES DEL PRODUCTO */}
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
