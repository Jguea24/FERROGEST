import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  MapPin,
} from 'lucide-react';
import { db } from '../../services/db';
import { Product, PaymentMethod, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';

interface CartItem {
  product: Product;
  quantity: number;
}

export const POSPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [discount, setDiscount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Completed sale modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProducts = () => {
    setProducts(db.getProducts().filter((p) => p.estado === 'ACTIVO'));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.stock_actual <= 0) {
      setErrorMessage(`El producto "${product.nombre}" está agotado en inventario.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_actual) {
          setErrorMessage(
            `No puede vender más de ${product.stock_actual} unidades disponibles de "${product.nombre}".`
          );
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setErrorMessage(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock_actual) {
              setErrorMessage(
                `Stock disponible máximo: ${item.product.stock_actual} unidades.`
              );
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAmountPaid(0);
    setErrorMessage(null);
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.precio_venta * item.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const change = paymentMethod === 'EFECTIVO' ? Math.max(0, amountPaid - total) : 0;

  const handleCheckout = () => {
    setErrorMessage(null);
    if (!user) {
      setErrorMessage('Debe iniciar sesión para realizar una venta.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('El carrito está vacío. Agregue productos antes de continuar.');
      return;
    }

    if (paymentMethod === 'EFECTIVO' && amountPaid < total) {
      setErrorMessage(`El monto recibido ($${amountPaid}) no cubre el total de la venta ($${total}).`);
      return;
    }

    try {
      const sale = db.createSale({
        items: cart.map((item) => ({
          producto_id: item.product.id,
          cantidad: item.quantity,
        })),
        metodo_pago: paymentMethod,
        descuento: discount,
        monto_recibido: paymentMethod === 'EFECTIVO' ? amountPaid : total,
        usuario: user,
      });

      setCompletedSale(sale);
      clearCart();
      loadProducts(); // Refresh products stock
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la venta.');
    }
  };

  // Filter products for POS search
  const filteredProducts = products.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria_nombre && p.categoria_nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-amber-500" />
            <span>Terminal Punto de Venta (POS)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Venta rápida en mostrador con descuento automático de existencias y comprobante.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* POS Grid: Product Catalog Left + Cart Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & Catalog (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SKU, nombre de herramienta o categoría..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-amber-500 shadow-xs"
            />
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const outOfStock = p.stock_actual <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !outOfStock && addToCart(p)}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    outOfStock
                      ? 'opacity-50 border-slate-200 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        {p.codigo}
                      </span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                          outOfStock
                            ? 'bg-rose-100 text-rose-700'
                            : p.stock_actual <= p.stock_minimo
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {outOfStock ? 'Agotado' : `${p.stock_actual} disp.`}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1">{p.nombre}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{p.ubicacion_texto || 'Sin asignar'}</span>
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Precio:</span>
                    <span className="text-base font-black text-slate-900">
                      {formatCurrency(p.precio_venta)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Checkout Cart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Detalle de la Venta</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto my-3 pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Haga clic en los productos para agregarlos al ticket de venta.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.product.nombre}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatCurrency(item.product.precio_venta)} c/u &bull;{' '}
                        <span className="font-semibold text-slate-700">
                          {item.product.ubicacion_texto}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:bg-white rounded text-slate-600 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-16 text-right font-black text-xs text-slate-900">
                        {formatCurrency(item.product.precio_venta * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-300 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Settings & Totals */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Payment Method Selector (Strategy Pattern) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('EFECTIVO')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'EFECTIVO'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TARJETA')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'TARJETA'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-sky-600" />
                  <span>Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFERENCIA')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    paymentMethod === 'TRANSFERENCIA'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 text-purple-600" />
                  <span>Transfer.</span>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Descuento ($):</span>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  step="0.5"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-20 px-2 py-0.5 text-right bg-white border border-slate-200 rounded text-xs"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                <span>Total a Cobrar:</span>
                <span className="text-amber-600">{formatCurrency(total)}</span>
              </div>

              {paymentMethod === 'EFECTIVO' && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Monto Recibido ($):</span>
                    <input
                      type="number"
                      min={total}
                      step="1"
                      value={amountPaid || ''}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-bold text-xs"
                      placeholder={total.toFixed(2)}
                    />
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Vuelto a Entregar:</span>
                    <span>{formatCurrency(change)}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Facturar Venta</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sale Success / Receipt Modal */}
      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={() => setCompletedSale(null)}
          title={`Comprobante de Venta #${completedSale.id}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="text-center py-2 border-b border-dashed border-slate-200 space-y-1">
              <h3 className="font-black text-slate-900 text-lg">FERRO GET</h3>
              <p className="text-[11px] text-slate-500">Ferretería y Materiales Industriales</p>
              <p className="text-[10px] text-slate-400 font-mono">
                Fecha: {formatDateTime(completedSale.fecha)}
              </p>
              <p className="text-[10px] text-slate-400">Atendido por: {completedSale.usuario_nombre}</p>
            </div>

            {/* Receipt Lines */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-500 border-b border-slate-100 pb-1">
                <span>Cant. x Producto</span>
                <span>Subtotal</span>
              </div>
              {completedSale.detalles.map((d) => (
                <div key={d.id} className="flex justify-between text-slate-700">
                  <span>
                    {d.cantidad}x {d.producto_nombre}
                  </span>
                  <span className="font-semibold">{formatCurrency(d.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(completedSale.subtotal)}</span>
              </div>
              {completedSale.descuento > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(completedSale.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>TOTAL PAGADO:</span>
                <span>{formatCurrency(completedSale.total)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Método de Pago:</span>
                <span className="font-bold">{completedSale.metodo_pago}</span>
              </div>
              {completedSale.vuelto !== undefined && completedSale.vuelto > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold text-xs pt-1">
                  <span>VUELTO:</span>
                  <span>{formatCurrency(completedSale.vuelto)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-400"
              >
                Aceptar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
