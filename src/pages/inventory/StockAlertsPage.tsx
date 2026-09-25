import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, MapPin, ShoppingBag } from 'lucide-react';
import { db } from '../../services/db';
import { StockAlert } from '../../types';
import { formatDateTime } from '../../utils/formatters';

export const StockAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filter, setFilter] = useState<'PENDIENTE' | 'ALL'>('PENDIENTE');

  const loadAlerts = () => {
    const data = db.getAlerts();
    setAlerts(filter === 'PENDIENTE' ? data.filter((a) => a.estado === 'PENDIENTE') : data);
  };

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const handleResolve = (id: number) => {
    db.resolveAlert(id);
    loadAlerts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <span>Alertas de Stock Bajo y Reposición</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitoreo en tiempo real de artículos con existencias menores o iguales al stock mínimo programado.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('PENDIENTE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === 'PENDIENTE'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todas las Alertas
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación en Almacén</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Stock Mínimo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4">Fecha Alerta</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No hay alertas de stock bajo pendientes. Todo el inventario se encuentra en niveles normales.
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {alert.producto_codigo}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {alert.producto_nombre}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {alert.categoria_nombre}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{alert.ubicacion_texto}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-rose-600">
                      {alert.stock_actual}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {alert.stock_minimo}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          alert.estado === 'PENDIENTE'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {alert.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDateTime(alert.fecha)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate('/compras/nueva')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Generar compra a proveedor"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Reabastecer</span>
                        </button>
                        {alert.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Marcar como atendida"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
