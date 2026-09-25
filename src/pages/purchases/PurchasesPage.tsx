import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  History,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, Supplier, Purchase, CostHistory } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';

export const PurchasesPage: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [costHistories, setCostHistories] = useState<CostHistory[]>([]);

  // New Purchase Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);
  const [purchaseItems, setPurchaseItems] = useState<
    { producto_id: number; cantidad: number; precio_unitario: number }[]
  >([]);

  // Add Item Line
  const [currentProdId, setCurrentProdId] = useState<number>(1);
  const [currentQty, setCurrentQty] = useState<number>(10);
  const [currentCost, setCurrentCost] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = () => {
    setPurchases(db.getPurchases());
    const sups = db.getSuppliers();
    setSuppliers(sups);
    if (sups.length > 0 && !selectedSupplierId) setSelectedSupplierId(sups[0].id);

    const prods = db.getProducts().filter((p) => p.estado === 'ACTIVO');
    setProducts(prods);
    if (prods.length > 0) {
      setCurrentProdId(prods[0].id);
      setCurrentCost(prods[0].precio_compra);
    }
    setCostHistories(db.getCostHistory());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelectChange = (id: number) => {
    setCurrentProdId(id);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setCurrentCost(prod.precio_compra);
    }
  };

  const handleAddItemToPurchase = () => {
    if (currentQty <= 0) return;
    const existingIndex = purchaseItems.findIndex((i) => i.producto_id === currentProdId);
    if (existingIndex >= 0) {
      const updated = [...purchaseItems];
      updated[existingIndex].cantidad += currentQty;
      updated[existingIndex].precio_unitario = currentCost;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          producto_id: currentProdId,
          cantidad: currentQty,
          precio_unitario: currentCost,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!user) return;

    if (purchaseItems.length === 0) {
      setErrorMessage('Debe agregar al menos un producto a la compra.');
      return;
    }

    try {
      db.createPurchase({
        proveedor_id: Number(selectedSupplierId),
        items: purchaseItems,
        usuario: user,
      });

      setSuccessMessage('Compra registrada exitosamente. El inventario ha sido incrementado.');
      setIsModalOpen(false);
      setPurchaseItems([]);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la compra.');
    }
  };

  const purchaseTotal = purchaseItems.reduce(
    (acc, item) => acc + item.cantidad * item.precio_unitario,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-500" />
            <span>Gestión de Compras y Abastecimiento</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Recepción de mercadería a proveedores con actualización automática de existencias e historial de costos.
          </p>
        </div>

        <button
          onClick={() => {
            setPurchaseItems([]);
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Compra</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grid: Purchase History Table & Cost History Table */}
      <div className="space-y-6">
        {/* Purchases History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-slate-900 text-sm">Órdenes de Compra Recibidas</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3"># Compra</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3">Registrado por</th>
                  <th className="py-2.5 px-3 text-center">Ítems</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se han registrado compras a proveedores aún.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold">#{p.id}</td>
                      <td className="py-2.5 px-3 text-slate-500">{formatDateTime(p.fecha)}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.proveedor_nombre}</td>
                      <td className="py-2.5 px-3">{p.usuario_nombre}</td>
                      <td className="py-2.5 px-3 text-center">{p.detalles.length}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {formatCurrency(p.total)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cost Fluctuations History (Rule 17) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">Historial de Costos de Proveedores</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Proveedor</th>
                  <th className="py-2.5 px-3 text-right">Costo Anterior</th>
                  <th className="py-2.5 px-3 text-right">Nuevo Costo</th>
                  <th className="py-2.5 px-3 text-right">Variación</th>
                  <th className="py-2.5 px-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {costHistories.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se han detectado variaciones en costos de compra todavía.
                    </td>
                  </tr>
                ) : (
                  costHistories.map((c) => {
                    const diff = c.costo_nuevo - c.costo_anterior;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{formatDateTime(c.fecha)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.producto_nombre}</td>
                        <td className="py-2.5 px-3">{c.proveedor_nombre}</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {formatCurrency(c.costo_anterior)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          {formatCurrency(c.costo_nuevo)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-bold ${
                            diff > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {diff > 0 ? '+' : ''}
                          {formatCurrency(diff)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{c.usuario_nombre}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Orden de Compra (Reabastecimiento)"
        maxWidth="lg"
      >
        <form onSubmit={handleSavePurchase} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Proveedor *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.razon_social} (RUC: {s.identificacion})
                </option>
              ))}
            </select>
          </div>

          {/* Add product line */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Agregar Producto a la Compra:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Producto</label>
                <select
                  value={currentProdId}
                  onChange={(e) => handleProductSelectChange(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Costo Unit. ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentCost}
                  onChange={(e) => setCurrentCost(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-right font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddItemToPurchase}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar a la lista</span>
            </button>
          </div>

          {/* Lines Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3 text-center">Cant.</th>
                  <th className="py-2 px-3 text-right">Costo Unit.</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchaseItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No hay artículos agregados todavía.
                    </td>
                  </tr>
                ) : (
                  purchaseItems.map((item, index) => {
                    const prod = products.find((p) => p.id === item.producto_id);
                    return (
                      <tr key={index}>
                        <td className="py-2 px-3 font-bold text-slate-900">{prod?.nombre}</td>
                        <td className="py-2 px-3 text-center">{item.cantidad}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(item.precio_unitario)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.cantidad * item.precio_unitario)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-slate-300 hover:text-rose-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-xs text-slate-600">Total de la Compra:</span>
            <span className="text-base font-black text-slate-900">
              {formatCurrency(purchaseTotal)}
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={purchaseItems.length === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs disabled:opacity-50 cursor-pointer"
            >
              Confirmar Recepción y Aumentar Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
