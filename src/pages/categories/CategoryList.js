import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrashAlt, faLayerGroup, faSitemap } from '@fortawesome/free-solid-svg-icons';
import CategoryForm  from '../../components/categories/CategoryForm';
import categoryService from '../../services/categoryService';
import Pagination    from '../../components/common/Pagination';
import usePagination from '../../hooks/usePagination';
import './CategoryList.css';

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
const SummaryCard = ({ title, value, colorClass }) => (
    <div className={`summary-card ${colorClass}`}>
        <div className="card-content">
            <p className="card-title">{title}</p>
            <h2 className="card-value">{value}</h2>
        </div>
    </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const CategoryList = ({ userRole }) => {
    const isAdmin = userRole === 'ADMINISTRADOR';

    const [categories,       setCategories]       = useState([]);
    const [isLoading,        setIsLoading]         = useState(true);
    const [error,            setError]             = useState(null);
    const [isFormOpen,       setIsFormOpen]        = useState(false);
    const [currentCategory,  setCurrentCategory]  = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [deleteError,      setDeleteError]       = useState('');
    const [expanded,         setExpanded]          = useState({});
    const [searchTerm,       setSearchTerm]        = useState('');

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await categoryService.getAllCategories();
            setCategories(res.data);
            // Expandir todas las raíces por defecto
            const initExpanded = {};
            res.data.filter(c => !c.parentCategoryId).forEach(c => { initExpanded[c.id] = true; });
            setExpanded(initExpanded);
        } catch {
            setError('No se pudieron cargar las categorías.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);

    // ── Métricas ──────────────────────────────────────────────────────────────
    const roots = categories.filter(c => !c.parentCategoryId);
    const subs  = categories.filter(c =>  c.parentCategoryId);

    // ── Árbol filtrado + paginado ─────────────────────────────────────────────
    const tree = roots.map(root => ({
        ...root,
        children: subs.filter(s => s.parentCategoryId === root.id),
    }));

    const filteredTree = tree.filter(root => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const rootMatch = root.name.toLowerCase().includes(term);
        const childMatch = root.children.some(c => c.name.toLowerCase().includes(term));
        return rootMatch || childMatch;
    });

    // HU07 — paginación sobre las categorías raíz filtradas
    const { currentPage, pageSize, paginated: paginatedTree, setPage, setPageSize } =
        usePagination(filteredTree);

    const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

    const handleNew     = () => { setCurrentCategory(null); setIsFormOpen(true); };
    const handleEdit    = (cat) => { setCurrentCategory(cat); setIsFormOpen(true); };
    const handleSaved   = () => { setIsFormOpen(false); fetchCategories(); };
    const handleDelete  = (cat) => { setCategoryToDelete(cat); setDeleteError(''); };

    const confirmDelete = async () => {
        try {
            await categoryService.deleteCategory(categoryToDelete.id);
            setCategoryToDelete(null);
            fetchCategories();
        } catch (err) {
            setDeleteError(err.response?.data?.message || 'No se pudo eliminar la categoría.');
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="main-content">

            {/* Header */}
            <div className="page-header">
                <div className="title-group">
                    <h1>Gestión de Categorías</h1>
                    <p className="page-subtitle">Organizar el catálogo por categorías y subcategorías</p>
                </div>
                {isAdmin && (
                    <button className="add-new-button-orange" onClick={handleNew}>
                        <FontAwesomeIcon icon={faPlus} /> Nueva Categoría
                    </button>
                )}
            </div>

            {/* KPIs */}
            <div className="summary-cards-container">
                <SummaryCard title="Total Categorías"  value={isLoading ? '...' : categories.length} colorClass="metric-orange" />
                <SummaryCard title="Categorías Raíz"   value={isLoading ? '...' : roots.length}       colorClass="metric-green"  />
                <SummaryCard title="Subcategorías"     value={isLoading ? '...' : subs.length}        colorClass="metric-yellow" />
            </div>

            {/* Búsqueda */}
            <div className="search-bar-container">
                <input
                    type="text"
                    placeholder="Buscar categoría o subcategoría por nombre..."
                    className="product-search-input"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Árbol */}
            <div className="cat-tree-card">
                <div className="cat-tree-header">
                    <span>Árbol de Categorías</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <small>
                            {filteredTree.length > 0
                                ? `Mostrando ${paginatedTree.length} de ${filteredTree.length} categorías`
                                : 'Sin resultados'}
                        </small>
                        <small>Haz clic en +/− para expandir o colapsar</small>
                    </div>
                </div>

                {isLoading && <div className="cat-empty">Cargando categorías...</div>}
                {error     && <div className="cat-error">{error}</div>}

                {!isLoading && !error && filteredTree.length === 0 && (
                    <div className="cat-empty">
                        {searchTerm ? 'No se encontraron categorías que coincidan.' : 'No hay categorías registradas. Crea la primera.'}
                    </div>
                )}

                {!isLoading && !error && paginatedTree.map(root => (
                    <React.Fragment key={root.id}>
                        {/* Fila raíz */}
                        <div className="cat-row">
                            <button
                                className="cat-toggle-btn"
                                onClick={() => toggleExpand(root.id)}
                                title={expanded[root.id] ? 'Colapsar' : 'Expandir'}
                            >
                                {root.children.length > 0 ? (expanded[root.id] ? '−' : '+') : '·'}
                            </button>
                            <div className="cat-icon-box" style={{ background: '#EFF6FF' }}>
                                <FontAwesomeIcon icon={faSitemap} style={{ color: '#3B82F6', fontSize: 13 }} />
                            </div>
                            <div className="cat-info">
                                <div className="cat-name">{root.name}</div>
                                <div className="cat-meta">
                                    Categoría raíz · {root.children.length} subcategoría(s) · {root.productCount} producto(s)
                                </div>
                            </div>
                            {root.children.length > 0 && (
                                <span className="badge-sub-count">{root.children.length} subcategorías</span>
                            )}
                            <span className={root.productCount > 0 ? 'badge-prod-count' : 'badge-no-prod'}>
                                {root.productCount} producto(s)
                            </span>
                            {isAdmin && (
                                <div className="cat-actions">
                                    <button className="cat-btn-edit" onClick={() => handleEdit(root)} title="Editar">
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </button>
                                    <button className="cat-btn-del" onClick={() => handleDelete(root)} title="Eliminar">
                                        <FontAwesomeIcon icon={faTrashAlt} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Subcategorías */}
                        {expanded[root.id] && root.children.map(sub => (
                            <div className="cat-row cat-row-sub" key={sub.id}>
                                <div style={{ width: 22, flexShrink: 0 }} />
                                <div className="cat-icon-box" style={{ background: '#F0FDF4' }}>
                                    <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#22C55E', fontSize: 12 }} />
                                </div>
                                <div className="cat-info">
                                    <div className="cat-sub-name">{sub.name}</div>
                                    <div className="cat-meta">Subcategoría de {root.name} · {sub.productCount} producto(s)</div>
                                </div>
                                <span className={sub.productCount > 0 ? 'badge-prod-count' : 'badge-no-prod'}>
                                    {sub.productCount} producto(s)
                                </span>
                                {isAdmin && (
                                    <div className="cat-actions">
                                        <button className="cat-btn-edit" onClick={() => handleEdit(sub)} title="Editar">
                                            <FontAwesomeIcon icon={faPencilAlt} />
                                        </button>
                                        <button className="cat-btn-del" onClick={() => handleDelete(sub)} title="Eliminar">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </React.Fragment>
                ))}

                {/* HU07 — Paginación */}
                <Pagination
                    currentPage={currentPage}
                    totalItems={filteredTree.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onSizeChange={setPageSize}
                />
            </div>

            {/* Modal formulario */}
            {isFormOpen && (
                <div className="modal-backdrop">
                    <CategoryForm
                        currentCategory={currentCategory}
                        onSave={handleSaved}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            {/* Modal confirmar eliminación */}
            {categoryToDelete && (
                <div className="modal-backdrop">
                    <div className="cat-delete-modal">
                        <h3>¿Eliminar categoría?</h3>
                        <p>
                            Estás a punto de eliminar <strong>{categoryToDelete.name}</strong>.
                            Esta acción solo es posible si la categoría no tiene productos ni subcategorías asociadas.
                        </p>
                        {deleteError && (
                            <div style={{ marginBottom: 14, padding: '10px 12px', background: '#FEF2F2', borderRadius: 6, color: '#B91C1C', fontSize: '0.85rem' }}>
                                {deleteError}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="btn-cancel-del" onClick={() => setCategoryToDelete(null)}>Cancelar</button>
                            <button className="btn-confirm-del" onClick={confirmDelete}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryList;
