import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Boxes,
  Receipt,
  ShoppingBag,
  ArrowRightLeft,
  AlertTriangle,
} from 'lucide-react';
import { db } from '../../services/db';
import {
  formatCurrency,
  formatDateTime,
  exportToCSV,
  getStockLevel,
} from '../../utils/formatters';

type ReportTab = 'INVENTARIO' | 'VENTAS' | 'COMPRAS' | 'MOVIMIENTOS' | 'STOCK_BAJO';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('INVENTARIO');

  const products = db.getProducts().filter((p) => p.estado === 'ACTIVO');
  const sales = db.getSales();
  const purchases = db.getPurchases();
  const movements = db.getInventoryMovements();
  const lowStock = products.filter((p) => p.stock_actual <= p.stock_minimo);

  // Total valuation
  const totalValuation = products.reduce((acc, p) => acc + p.stock_actual * p.precio_compra, 0);

  const handleExport = () => {
    switch (activeTab) {
      case 'INVENTARIO': {
        const headers = [
          'Código',
          'Producto',
          'Categoría',
          'Ubicación',
          'P. Compra',
          'P. Venta',
          'Stock Actual',
          'Stock Mínimo',
          'Valorizado',
        ];
        const rows = products.map((p) => [
          p.codigo,
          p.nombre,
          p.categoria_nombre || '',
          p.ubicacion_texto || '',
          p.precio_compra,
          p.precio_venta,
          p.stock_actual,
          p.stock_minimo,
          p.stock_actual * p.precio_compra,
        ]);
        exportToCSV('reporte_inventario_ferroget', headers, rows);
        break;
      }
      case 'VENTAS': {
        const headers = ['Venta ID', 'Fecha', 'Cajero', 'Método Pago', 'Subtotal', 'Descuento', 'Total'];
        const rows = sales.map((s) => [
          s.id,
          formatDateTime(s.fecha),
          s.usuario_nombre || '',
          s.metodo_pago,
          s.subtotal,
          s.descuento,
          s.total,
        ]);
        exportToCSV('reporte_ventas_ferroget', headers, rows);
        break;
      }
      case 'COMPRAS': {
        const headers = ['Compra ID', 'Fecha', 'Proveedor', 'Usuario', 'Total'];
        const rows = purchases.map((p) => [
          p.id,
          formatDateTime(p.fecha),
          p.proveedor_nombre || '',
          p.usuario_nombre || '',
          p.total,
        ]);
        exportToCSV('reporte_compras_ferroget', headers, rows);
        break;
      }
      case 'MOVIMIENTOS': {
        const headers = [
          'ID',
          'Fecha',
          'Código',
          'Producto',
          'Tipo Movimiento',
          'Cantidad',
          'Stock Ant.',
          'Stock Nuevo',
          'Referencia',
          'Usuario',
        ];
        const rows = movements.map((m) => [
          m.id,
          formatDateTime(m.fecha),
          m.producto_codigo || '',
          m.producto_nombre || '',
          m.tipo_movimiento,
          m.cantidad,
          m.stock_anterior,
          m.stock_nuevo,
          m.referencia,
          m.usuario_nombre || '',
        ]);
        exportToCSV('reporte_kardex_movimientos_ferroget', headers, rows);
        break;
      }
      case 'STOCK_BAJO': {
        const headers = ['Código', 'Producto', 'Categoría', 'Ubicación', 'Stock Actual', 'Stock Mínimo'];
        const rows = lowStock.map((p) => [
          p.codigo,
          p.nombre,
          p.categoria_nombre || '',
          p.ubicacion_texto || '',
          p.stock_actual,
          p.stock_minimo,
        ]);
        exportToCSV('reporte_stock_critico_ferroget', headers, rows);
        break;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            <span>Centro de Reportes y Trazabilidad</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Informes consolidados de inventario valorizado, facturación, abastecimiento y Kardex.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Exportar a CSV ({activeTab})</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('INVENTARIO')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === 'INVENTARIO'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Inventario Valorizado</span>
        </button>
        <button
          onClick={() => setActiveTab('VENTAS')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === 'VENTAS'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Ventas</span>
        </button>
        <button
          onClick={() => setActiveTab('COMPRAS')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === 'COMPRAS'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Compras</span>
        </button>
        <button
          onClick={() => setActiveTab('MOVIMIENTOS')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === 'MOVIMIENTOS'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Kardex / Movimientos</span>
        </button>
        <button
          onClick={() => setActiveTab('STOCK_BAJO')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 ${
            activeTab === 'STOCK_BAJO'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Stock Bajo ({lowStock.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'INVENTARIO' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">
              Valor Total Estimado del Inventario en Bodega:
            </span>
            <span className="text-lg font-black text-amber-950">
              {formatCurrency(totalValuation)}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3 text-right">P. Compra</th>
                  <th className="py-2.5 px-3 text-right">P. Venta</th>
                  <th className="py-2.5 px-3 text-center">Stock</th>
                  <th className="py-2.5 px-3 text-right">Total Valorizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold">{p.codigo}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{p.nombre}</td>
                    <td className="py-2.5 px-3 text-slate-500">{p.categoria_nombre}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.ubicacion_texto}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(p.precio_compra)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(p.precio_venta)}</td>
                    <td className="py-2.5 px-3 text-center font-black">{p.stock_actual}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {formatCurrency(p.stock_actual * p.precio_compra)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'VENTAS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3"># Venta</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Cajero</th>
                <th className="py-2.5 px-3 text-center">Método Pago</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">Descuento</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">#{s.id}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(s.fecha)}</td>
                  <td className="py-2.5 px-3 font-semibold">{s.usuario_nombre}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-amber-700">{s.metodo_pago}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(s.subtotal)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-600">
                    {s.descuento > 0 ? `-${formatCurrency(s.descuento)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {formatCurrency(s.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'COMPRAS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3"># Compra</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Proveedor</th>
                <th className="py-2.5 px-3">Usuario Responsable</th>
                <th className="py-2.5 px-3 text-right">Total Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">#{p.id}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(p.fecha)}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.proveedor_nombre}</td>
                  <td className="py-2.5 px-3">{p.usuario_nombre}</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {formatCurrency(p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'MOVIMIENTOS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">Fecha y Hora</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-center">Tipo</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                <th className="py-2.5 px-3 text-center">Stock Ant.</th>
                <th className="py-2.5 px-3 text-center">Stock Nuevo</th>
                <th className="py-2.5 px-3">Referencia</th>
                <th className="py-2.5 px-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(m.fecha)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold">{m.producto_codigo}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{m.producto_nombre}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.tipo_movimiento === 'VENTA'
                          ? 'bg-rose-100 text-rose-800'
                          : m.tipo_movimiento === 'COMPRA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {m.tipo_movimiento}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold">
                    {m.tipo_movimiento === 'VENTA' ? '-' : '+'}
                    {m.cantidad}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{m.stock_anterior}</td>
                  <td className="py-2.5 px-3 text-center font-black text-slate-900">
                    {m.stock_nuevo}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{m.referencia}</td>
                  <td className="py-2.5 px-3 text-slate-600">{m.usuario_nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'STOCK_BAJO' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3">Categoría</th>
                <th className="py-2.5 px-3">Ubicación Física</th>
                <th className="py-2.5 px-3 text-center">Stock Actual</th>
                <th className="py-2.5 px-3 text-center">Stock Mínimo</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {lowStock.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">{p.codigo}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.nombre}</td>
                  <td className="py-2.5 px-3 text-slate-500">{p.categoria_nombre}</td>
                  <td className="py-2.5 px-3 text-slate-600 font-semibold">{p.ubicacion_texto}</td>
                  <td className="py-2.5 px-3 text-center font-black text-rose-600">{p.stock_actual}</td>
                  <td className="py-2.5 px-3 text-center text-slate-500">{p.stock_minimo}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                      {p.stock_actual === 0 ? 'Agotado' : 'Stock Mínimo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
