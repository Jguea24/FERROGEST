import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  MapPin,
  AlertTriangle,
  ShoppingCart,
  Receipt,
  Wallet,
  Truck,
  ShoppingBag,
  History,
  BarChart3,
  Users,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';

export const Sidebar: React.FC = () => {
  const { isAdmin } = useAuth();

  // Navigation sections collapse states
  const [openSections, setOpenSections] = useState({
    inventario: true,
    ventas: true,
    compras: true,
    reportes: false,
    admin: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Get active alerts count
  const pendingAlertsCount = db.getAlerts().filter((a) => a.estado === 'PENDIENTE').length;

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-amber-500 text-slate-900 font-semibold shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <aside className="w-64 bg-slate-950 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
          <Wrench className="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wider text-white flex items-center gap-1.5">
            FERRO<span className="text-amber-400">GEST</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight">Ferretería FERRO GET</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navLinkClass}>
          <LayoutDashboard className="w-4 h-4 text-amber-400" />
          <span>Dashboard</span>
        </NavLink>

        {/* INVENTARIO */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('inventario')}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
          >
            <span>Inventario</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                openSections.inventario ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openSections.inventario && (
            <div className="mt-1 space-y-1 pl-1">
              <NavLink to="/inventario/productos" className={navLinkClass}>
                <Package className="w-4 h-4" />
                <span>Productos</span>
              </NavLink>
              <NavLink to="/inventario/categorias" className={navLinkClass}>
                <FolderTree className="w-4 h-4" />
                <span>Categorías</span>
              </NavLink>
              <NavLink to="/inventario/ubicaciones" className={navLinkClass}>
                <MapPin className="w-4 h-4" />
                <span>Ubicaciones</span>
              </NavLink>
              <NavLink to="/inventario/alertas" className={navLinkClass}>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="flex-1">Alertas de Stock</span>
                {pendingAlertsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {pendingAlertsCount}
                  </span>
                )}
              </NavLink>
            </div>
          )}
        </div>

        {/* VENTAS */}
        <div className="pt-2">
          <button
            onClick={() => toggleSection('ventas')}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
          >
            <span>Ventas</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                openSections.ventas ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openSections.ventas && (
            <div className="mt-1 space-y-1 pl-1">
              <NavLink to="/ventas/pos" className={navLinkClass}>
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span>Nueva Venta (POS)</span>
              </NavLink>
              <NavLink to="/ventas/historial" className={navLinkClass}>
                <Receipt className="w-4 h-4" />
                <span>Historial de Ventas</span>
              </NavLink>
              <NavLink to="/ventas/caja" className={navLinkClass}>
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Control de Caja</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* COMPRAS */}
        {isAdmin && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('compras')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Compras</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openSections.compras ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openSections.compras && (
              <div className="mt-1 space-y-1 pl-1">
                <NavLink to="/compras/nueva" className={navLinkClass}>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span>Nueva Compra</span>
                </NavLink>
                <NavLink to="/compras/historial" className={navLinkClass}>
                  <History className="w-4 h-4" />
                  <span>Historial Compras</span>
                </NavLink>
                <NavLink to="/compras/proveedores" className={navLinkClass}>
                  <Truck className="w-4 h-4" />
                  <span>Proveedores</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* REPORTES */}
        {isAdmin && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('reportes')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Reportes</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openSections.reportes ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openSections.reportes && (
              <div className="mt-1 space-y-1 pl-1">
                <NavLink to="/reportes" className={navLinkClass}>
                  <BarChart3 className="w-4 h-4" />
                  <span>Centro de Reportes</span>
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* ADMINISTRACIÓN */}
        {isAdmin && (
          <div className="pt-2">
            <button
              onClick={() => toggleSection('admin')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Administración</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  openSections.admin ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openSections.admin && (
              <div className="mt-1 space-y-1 pl-1">
                <NavLink to="/admin/usuarios" className={navLinkClass}>
                  <Users className="w-4 h-4" />
                  <span>Usuarios y Roles</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer System Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-center">
        <span className="text-[11px] text-slate-400 font-medium">FERROGEST Enterprise v1.0</span>
      </div>
    </aside>
  );
};
