import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, Category, Location } from '../../types';
import { formatCurrency, getStockLevel, getStockBadgeConfig } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';

export const ProductsPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: 1,
    ubicacion_id: 1,
    precio_compra: 0,
    precio_venta: 0,
    stock_actual: 0,
    stock_minimo: 5,
    unidad_medida: 'UNIDAD',
  });

  const loadData = () => {
    setProducts(db.getProducts().filter((p) => p.estado === 'ACTIVO'));
    setCategories(db.getCategories());
    setLocations(db.getLocations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria_id: categories[0]?.id || 1,
      ubicacion_id: locations[0]?.id || 1,
      precio_compra: 0,
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 5,
      unidad_medida: 'UNIDAD',
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      codigo: product.codigo,
      nombre: product.nombre,
      descripcion: product.descripcion,
      categoria_id: product.categoria_id,
      ubicacion_id: product.ubicacion_id,
      precio_compra: product.precio_compra,
      precio_venta: product.precio_venta,
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      unidad_medida: product.unidad_medida,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.codigo.trim()) {
      setErrorMessage('El código de producto es obligatorio.');
      return;
    }
    if (!formData.nombre.trim()) {
      setErrorMessage('El nombre del producto es obligatorio.');
      return;
    }
    if (formData.precio_compra < 0 || formData.precio_venta < 0) {
      setErrorMessage('Los precios no pueden ser negativos.');
      return;
    }
    if (formData.stock_actual < 0 || formData.stock_minimo < 0) {
      setErrorMessage('El stock no puede ser negativo.');
      return;
    }

    try {
      if (editingProduct) {
        db.updateProduct(editingProduct.id, {
          ...formData,
          categoria_id: Number(formData.categoria_id),
          ubicacion_id: Number(formData.ubicacion_id),
          precio_compra: Number(formData.precio_compra),
          precio_venta: Number(formData.precio_venta),
          stock_actual: Number(formData.stock_actual),
          stock_minimo: Number(formData.stock_minimo),
        });
        setSuccessMessage('Producto actualizado exitosamente.');
      } else {
        db.createProduct({
          ...formData,
          categoria_id: Number(formData.categoria_id),
          ubicacion_id: Number(formData.ubicacion_id),
          precio_compra: Number(formData.precio_compra),
          precio_venta: Number(formData.precio_venta),
          stock_actual: Number(formData.stock_actual),
          stock_minimo: Number(formData.stock_minimo),
          estado: 'ACTIVO',
        });
        setSuccessMessage('Producto registrado exitosamente.');
      }

      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el producto.');
    }
  };

  const handleDeleteProduct = (id: number, nombre: string) => {
    if (window.confirm(`¿Está seguro de desactivar el producto "${nombre}"?`)) {
      db.deleteProduct(id);
      loadData();
      setSuccessMessage('Producto desactivado.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((prod) => {
    const matchesSearch =
      prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prod.categoria_nombre && prod.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod.ubicacion_texto && prod.ubicacion_texto.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || prod.categoria_id === Number(selectedCategory);

    const matchesLocation =
      selectedLocation === 'all' || prod.ubicacion_id === Number(selectedLocation);

    const level = getStockLevel(prod.stock_actual, prod.stock_minimo);
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'normal' && level === 'NORMAL') ||
      (stockFilter === 'low' && level === 'BAJO') ||
      (stockFilter === 'critical' && level === 'CRITICO');

    return matchesSearch && matchesCategory && matchesLocation && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <span>Catálogo de Productos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administración integral de existencias, precios y localización física de pasillo y estante.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nombre o ubicación..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500"
            >
              <option value="all">Todos los Niveles de Stock</option>
              <option value="normal">Normal</option>
              <option value="low">Stock Mínimo (Alerta)</option>
              <option value="critical">Agotado / Crítico (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación Física</th>
                <th className="py-3 px-4 text-right">P. Compra</th>
                <th className="py-3 px-4 text-right">P. Venta</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Estado</th>
                {isAdmin && <th className="py-3 px-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-slate-400">
                    No se encontraron productos con los criterios de búsqueda seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const level = getStockLevel(product.stock_actual, product.stock_minimo);
                  const badge = getStockBadgeConfig(level);

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {product.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{product.nombre}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {product.descripcion}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {product.categoria_nombre || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{product.ubicacion_texto || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatCurrency(product.precio_compra)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(product.precio_venta)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black text-xs ${
                            level === 'CRITICO'
                              ? 'text-rose-600'
                              : level === 'BAJO'
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {product.stock_actual}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">
                          / mín {product.stock_minimo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgColor}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Editar producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id, product.nombre)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Desactivar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Código SKU / Barras *
              </label>
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-mono"
                placeholder="ej. HER-E001"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unidad de Medida
              </label>
              <select
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              >
                <option value="UNIDAD">UNIDAD</option>
                <option value="JUEGO">JUEGO</option>
                <option value="SACO">SACO</option>
                <option value="TUBO">TUBO</option>
                <option value="ROLLO">ROLLO</option>
                <option value="CAJA">CAJA</option>
                <option value="METRO">METRO</option>
                <option value="KG">KG</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              placeholder="ej. Taladro Percutor 750W 1/2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Descripción
            </label>
            <textarea
              rows={2}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              placeholder="Características técnicas y detalles..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Categoría *
              </label>
              <select
                value={formData.categoria_id}
                onChange={(e) => setFormData({ ...formData, categoria_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Ubicación Física (Pasillo/Estante) *
              </label>
              <select
                value={formData.ubicacion_id}
                onChange={(e) => setFormData({ ...formData, ubicacion_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.pasillo} - {l.estante} ({l.nombre})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                P. Compra ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_compra}
                onChange={(e) => setFormData({ ...formData, precio_compra: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-right"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                P. Venta ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-right font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Stock Actual *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_actual}
                onChange={(e) => setFormData({ ...formData, stock_actual: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Stock Mínimo *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 text-center"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
            >
              {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
