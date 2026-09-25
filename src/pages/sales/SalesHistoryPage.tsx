import React, { useState, useEffect } from 'react';
import { Receipt, Search, Eye, Download, Calendar } from 'lucide-react';
import { db } from '../../services/db';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime, exportToCSV } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';

export const SalesHistoryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');

  useEffect(() => {
    const allSales = db.getSales();
    // Vendedores can only see their own sales if requested by security rule, but in demo can view or filter
    if (!isAdmin && user) {
      setSales(allSales.filter((s) => s.usuario_id === user.id));
    } else {
      setSales(allSales);
    }
  }, [user, isAdmin]);

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.id.toString().includes(searchTerm) ||
      (s.usuario_nombre && s.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMethod = selectedMethod === 'ALL' || s.metodo_pago === selectedMethod;
    return matchesSearch && matchesMethod;
  });

  const handleExportCSV = () => {
    const headers = ['Venta ID', 'Fecha', 'Cajero', 'Metodo Pago', 'Subtotal', 'Descuento', 'Total'];
    const rows = filteredSales.map((s) => [
      s.id,
      formatDateTime(s.fecha),
      s.usuario_nombre || '',
      s.metodo_pago,
      s.subtotal,
      s.descuento,
      s.total,
    ]);
    exportToCSV('ventas_ferroget', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-500" />
            <span>Historial de Ventas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Registro de todas las operaciones realizadas en caja y mostrador.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Exportar a CSV</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID de venta o cajero..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-amber-500"
          >
            <option value="ALL">Todos los Métodos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="TRANSFERENCIA">Transferencia</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4"># Venta</th>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Cajero</th>
                <th className="py-3 px-4 text-center">Método Pago</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Descuento</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se registran ventas que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{sale.id}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(sale.fecha)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {sale.usuario_nombre || 'Cajero'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {sale.metodo_pago}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">{sale.detalles.length}</td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {formatCurrency(sale.subtotal)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      {sale.descuento > 0 ? `-${formatCurrency(sale.descuento)}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Ver detalle del ticket"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <Modal
          isOpen={Boolean(selectedSale)}
          onClose={() => setSelectedSale(null)}
          title={`Ticket de Venta #${selectedSale.id}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Fecha:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateTime(selectedSale.fecha)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cajero Responsable:</span>
                <span className="font-semibold text-slate-800">
                  {selectedSale.usuario_nombre}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Método de Pago:</span>
                <span className="font-bold text-amber-600">{selectedSale.metodo_pago}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="font-bold text-slate-600 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100">
                Líneas de la Venta:
              </div>
              {selectedSale.detalles.map((d) => (
                <div key={d.id} className="flex justify-between py-1 border-b border-slate-50">
                  <div>
                    <span className="font-bold text-slate-800">{d.producto_nombre}</span>
                    <span className="text-slate-400 ml-2">
                      ({d.cantidad} x {formatCurrency(d.precio_unitario)})
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(d.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              {selectedSale.descuento > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descuento aplicado:</span>
                  <span>-{formatCurrency(selectedSale.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>TOTAL:</span>
                <span className="text-amber-600">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
