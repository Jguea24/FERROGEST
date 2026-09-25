import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  Truck,
  Boxes,
  ShoppingCart,
  Receipt,
  Wallet,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MapPin,
  Clock,
  Layers,
  FileSpreadsheet,
  PlusCircle,
} from 'lucide-react';
import { db } from '../../services/db';
import { StatCard } from '../../components/ui/StatCard';
import { formatCurrency, formatDateTime, getStockLevel, getStockBadgeConfig } from '../../utils/formatters';
import { DashboardStats, Sale, StockAlert, Product, InventoryMovement } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../../components/ui/Modal';
import { runCriticalTests, TestResult } from '../../utils/testSuite';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<DashboardStats>(() => db.getDashboardStats());
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);

  // QA Tests modal
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const handleRunQATests = () => {
    const results = runCriticalTests();
    setTestResults(results);
    setIsTestModalOpen(true);
  };

  useEffect(() => {
    setStats(db.getDashboardStats());
    setRecentSales(db.getSales().slice(0, 5));
    setActiveAlerts(db.getAlerts().filter((a) => a.estado === 'PENDIENTE').slice(0, 5));
    setProducts(db.getProducts().filter((p) => p.estado === 'ACTIVO'));
    setRecentMovements(db.getInventoryMovements().slice(0, 5));
  }, []);

  // Top Products calculation based on catalog and movements
  const topProducts = products.slice(0, 5);
  const currentShift = db.getCurrentCashShift();

  // Average ticket
  const averageTicket = stats.ventas_hoy > 0 ? stats.total_ventas_hoy / stats.ventas_hoy : 0;

  return (
    <div className="space-y-6">
      {/* 1. WELCOME & OPERATIONS BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-extrabold border border-amber-500/40 uppercase tracking-wider">
              FERRO GET &bull; CENTRAL
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Turno Activo</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Bienvenido, {user?.nombre} {user?.apellido}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Consola central de operaciones: inventario valorizado, facturación de mostrador en tiempo real y alertas de stock crítico.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunQATests}
            className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            title="Ejecutar las 12 pruebas unitarias e integrales críticas de negocio"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditoría QA (12 Reglas)</span>
          </button>

          <button
            onClick={() => navigate('/ventas/pos')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
            <span>Punto de Venta (POS)</span>
          </button>
        </div>
      </div>

      {/* 2. PRIMARY KEY STATISTICAL METRICS (RESPONSIVE GRID 1/2/3/6 cols) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Métricas Operativas Principales</span>
          </h3>
          <span className="text-[11px] text-slate-400">Actualización en tiempo real</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Productos"
            value={stats.total_productos}
            subtitle="Catálogo activo en bodega"
            icon={Package}
            color="blue"
            trend="+100% disponibles"
          />

          <StatCard
            title="Stock Bajo / Crítico"
            value={stats.productos_stock_bajo}
            subtitle={stats.productos_stock_bajo > 0 ? "Requieren pedido urgente" : "Stock en nivel óptimo"}
            icon={AlertTriangle}
            color="rose"
            trend={stats.productos_stock_bajo > 0 ? "Atención requerida" : "Sin incidencias"}
          />

          <StatCard
            title="Ventas Hoy"
            value={stats.ventas_hoy}
            subtitle={formatCurrency(stats.total_ventas_hoy)}
            icon={DollarSign}
            color="emerald"
            trend="Mostrador activo"
          />

          <StatCard
            title="Compras del Mes"
            value={stats.compras_mes}
            subtitle="Órdenes de reposición"
            icon={ShoppingBag}
            color="purple"
            trend="Abastecimiento"
          />

          <StatCard
            title="Proveedores"
            value={stats.total_proveedores}
            subtitle="Distribuidores activos"
            icon={Truck}
            color="amber"
            trend="Comercial"
          />

          <StatCard
            title="Valor Inventario"
            value={formatCurrency(stats.valor_inventario)}
            subtitle="Costo adquisición almacén"
            icon={Boxes}
            color="emerald"
            trend="Activo circulante"
          />
        </div>
      </div>

      {/* 3. SECONDARY STATISTICAL SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Promedio</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(averageTicket)}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gaveta de Caja</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {currentShift ? `Abierta (#${currentShift.id})` : 'Cerrada'}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${currentShift ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kardex / Movimientos</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">{recentMovements.length} recientes</p>
          </div>
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cobertura de Stock</p>
            <p className="text-sm font-black text-slate-900 mt-0.5">
              {stats.total_productos > 0
                ? `${Math.round(((stats.total_productos - stats.productos_stock_bajo) / stats.total_productos) * 100)}%`
                : '100%'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. MAIN RESPONSIVE TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Critical Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Productos con Stock Crítico</h3>
                  <p className="text-xs text-slate-500">Artículos con stock menor o igual al mínimo</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/inventario/alertas')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {activeAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No existen alertas de stock bajo. Todos los productos disponen de existencias suficientes.
                </div>
              ) : (
                activeAlerts.map((alert) => (
                  <div key={alert.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-1 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 truncate">{alert.producto_nombre}</span>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded shrink-0">
                          {alert.producto_codigo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">
                          Ubicación: <strong className="text-slate-700 font-semibold">{alert.ubicacion_texto}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <div className="text-xs font-black text-rose-600">
                          {alert.stock_actual} disp.
                        </div>
                        <div className="text-[10px] text-slate-400">Mín: {alert.stock_minimo}</div>
                      </div>
                      <button
                        onClick={() => navigate('/compras/nueva')}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        title="Reabastecer con orden de compra"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Pedir</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Localización física normalizada en pasillos y estantes</span>
            <button
              onClick={() => navigate('/inventario/productos')}
              className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
            >
              <span>Ir al Catálogo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Sales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <TrendingUp className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ventas Recientes en Mostrador</h3>
                  <p className="text-xs text-slate-500">Transacciones completadas con arqueo</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/ventas/historial')}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Ver historial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {recentSales.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No se registran ventas hoy todavía.
                </div>
              ) : (
                recentSales.map((sale) => (
                  <div key={sale.id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-1 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">Venta #{sale.id}</span>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {sale.metodo_pago}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {sale.detalles.length} producto(s) &bull; Cajero: <span className="font-semibold text-slate-700">{sale.usuario_nombre || 'Cajero'}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900">
                        {formatCurrency(sale.total)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(sale.fecha)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Deducción atómica de existencias aplicada</span>
            <button
              onClick={() => navigate('/ventas/pos')}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
            >
              <span>+ Nueva Venta POS</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. SECOND ROW: TOP PRODUCTS & KARDEX MOVEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products / Fast Movers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Productos Clave / Mayor Rotación</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Catálogo FERRO GET</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3">Ubicación</th>
                  <th className="py-2.5 px-3 text-right">P. Venta</th>
                  <th className="py-2.5 px-3 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {topProducts.map((p) => {
                  const level = getStockLevel(p.stock_actual, p.stock_minimo);
                  const badge = getStockBadgeConfig(level);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.codigo}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 truncate max-w-[140px]">{p.nombre}</td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{p.ubicacion_texto}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatCurrency(p.precio_venta)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgColor}`}>
                          {p.stock_actual}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Kardex / Inventory Movements */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-500" />
              <h3 className="font-bold text-slate-900 text-sm">Resumen de Movimientos (Kardex)</h3>
            </div>
            <button
              onClick={() => navigate('/reportes')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentMovements.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay movimientos registrados en el Kardex.
              </div>
            ) : (
              recentMovements.map((mov) => (
                <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                        mov.tipo_movimiento === 'VENTA'
                          ? 'bg-rose-100 text-rose-800'
                          : mov.tipo_movimiento === 'COMPRA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {mov.tipo_movimiento}
                      </span>
                      <span className="font-bold text-slate-900">{mov.producto_nombre}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {mov.referencia} &bull; {mov.usuario_nombre}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-xs text-slate-900">
                      {mov.tipo_movimiento === 'VENTA' ? '-' : '+'}{mov.cantidad}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {mov.stock_anterior} &rarr; {mov.stock_nuevo} disp.
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. OPERATIONAL SHORTCUTS FOOTER */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-700">Acciones Operativas Rápidas:</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/inventario/productos')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            + Catálogo Productos
          </button>
          <button
            onClick={() => navigate('/ventas/caja')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            Control de Caja
          </button>
          <button
            onClick={() => navigate('/compras/nueva')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 shadow-xs cursor-pointer"
          >
            Nueva Compra
          </button>
          <button
            onClick={() => navigate('/reportes')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar Reportes CSV</span>
          </button>
        </div>
      </div>

      {/* QA Test Results Modal */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Resultados de Pruebas Automatizadas (12 Reglas Críticas)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>
              Total de pruebas ejecutadas: <strong>{testResults.length}</strong>
            </span>
            <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              {testResults.filter((t) => t.passed).length} / {testResults.length} Exitosas
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {testResults.map((t) => (
              <div key={t.id} className="py-2.5 flex items-start gap-2.5 text-xs">
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-slate-900">
                    #{t.id}. {t.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{t.message}</div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.passed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {t.passed ? 'PASÓ' : 'FALLÓ'}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setIsTestModalOpen(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
            >
              Cerrar Auditoría
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
