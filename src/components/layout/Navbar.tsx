import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserCheck, Shield, Wallet, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/db';

export const Navbar: React.FC = () => {
  const { user, logout, switchUser } = useAuth();
  const navigate = useNavigate();

  const currentShift = db.getCurrentCashShift();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs sticky top-0 z-30">
      {/* Left Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Cash Status Pill */}
        <div
          onClick={() => navigate('/ventas/caja')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
            currentShift
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
          }`}
          title="Click para ver control de caja"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>
            {currentShift ? `Caja Abierta (#${currentShift.id})` : 'Caja Cerrada'}
          </span>
          <span
            className={`w-2 h-2 rounded-full ${
              currentShift ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-500 gap-1.5 font-medium">
          <span className="text-slate-400">Sistema:</span>
          <span className="font-semibold text-slate-700">FERROGEST</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">Local: Central</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher for seamless QA validation */}
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => switchUser('ADMINISTRADOR')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              user?.rol === 'ADMINISTRADOR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Cambiar a Administrador para auditar permisos"
          >
            <Shield className="w-3 h-3 text-amber-500" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => switchUser('VENDEDOR')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold transition-all ${
              user?.rol === 'VENDEDOR'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Cambiar a Vendedor para auditar permisos"
          >
            <UserCheck className="w-3 h-3 text-emerald-500" />
            <span>Vendedor</span>
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-800 leading-none">
              {user ? `${user.nombre} ${user.apellido}` : 'Invitado'}
            </div>
            <div className="text-[11px] font-semibold text-amber-600 mt-1 uppercase tracking-wider">
              {user?.rol || 'Sin Rol'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
