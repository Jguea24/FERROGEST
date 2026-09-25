import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { db } from '../../services/db';
import { CashRegister, CashMovement } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';

export const CashRegisterPage: React.FC = () => {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState<CashRegister | undefined>(undefined);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [shiftsHistory, setShiftsHistory] = useState<CashRegister[]>([]);

  // Modals
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // Form states
  const [montoInicial, setMontoInicial] = useState<number>(100);
  const [montoDeclarado, setMontoDeclarado] = useState<number>(0);
  const [movementType, setMovementType] = useState<'INGRESO_EXTRA' | 'EGRESO_GASTO'>('EGRESO_GASTO');
  const [movementDesc, setMovementDesc] = useState('');
  const [movementAmount, setMovementAmount] = useState<number>(0);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = () => {
    const shift = db.getCurrentCashShift();
    setCurrentShift(shift);
    if (shift) {
      setMovements(db.getCashMovements(shift.id));
    } else {
      setMovements([]);
    }
    setShiftsHistory(db.getCashShifts());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!user) return;
    if (montoInicial < 0) {
      setErrorMessage('El monto inicial no puede ser negativo.');
      return;
    }

    try {
      db.openCashShift(montoInicial, user);
      setSuccessMessage('Turno de caja abierto correctamente.');
      setIsOpenShiftModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al abrir caja.');
    }
  };

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!currentShift) return;
    if (movementAmount <= 0) {
      setErrorMessage('El monto debe ser mayor a cero.');
      return;
    }
    if (!movementDesc.trim()) {
      setErrorMessage('Debe especificar una descripción o motivo.');
      return;
    }

    try {
      db.recordCashMovement({
        caja_id: currentShift.id,
        tipo: movementType,
        descripcion: movementDesc,
        monto: movementAmount,
      });
      setSuccessMessage('Movimiento registrado en caja.');
      setIsMovementModalOpen(false);
      setMovementDesc('');
      setMovementAmount(0);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar movimiento.');
    }
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!currentShift) return;
    if (montoDeclarado < 0) {
      setErrorMessage('El monto declarado no puede ser negativo.');
      return;
    }

    try {
      db.closeCashShift(currentShift.id, montoDeclarado);
      setSuccessMessage('Turno de caja cerrado y arqueo registrado.');
      setIsCloseShiftModalOpen(false);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cerrar caja.');
    }
  };

  // Calculations for current shift
  let salesCash = 0;
  let extraInflow = 0;
  let outflows = 0;

  movements.forEach((m) => {
    if (m.tipo === 'VENTA') salesCash += m.monto;
    else if (m.tipo === 'INGRESO_EXTRA') extraInflow += m.monto;
    else if (m.tipo === 'EGRESO_GASTO') outflows += m.monto;
  });

  const expectedAmount = currentShift
    ? currentShift.monto_inicial + salesCash + extraInflow - outflows
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-500" />
            <span>Control y Arqueo de Caja</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de turnos de cobro, ingresos/egresos menores y cierre con auditoría de diferencias.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!currentShift ? (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Turno de Caja</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMovementModalOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>+ Ingreso / Gasto</span>
              </button>
              <button
                onClick={() => {
                  setMontoDeclarado(expectedAmount);
                  setIsCloseShiftModalOpen(true);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar y Arquear Caja</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Active Shift Details Card */}
      {currentShift ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Turno Activo #{currentShift.id}</h3>
                <p className="text-xs text-slate-500">
                  Apertura: {formatDateTime(currentShift.fecha_apertura)} &bull; Cajero:{' '}
                  <span className="font-semibold text-slate-700">{currentShift.usuario_nombre}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Caja Abierta</span>
              </span>
            </div>
          </div>

          {/* Arqueo in Real Time */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] text-slate-500 uppercase font-bold">Fondo Inicial</p>
              <p className="text-lg font-black text-slate-900 mt-1">
                {formatCurrency(currentShift.monto_inicial)}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[11px] text-emerald-700 uppercase font-bold">Ventas Efectivo</p>
              <p className="text-lg font-black text-emerald-800 mt-1">{formatCurrency(salesCash)}</p>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
              <p className="text-[11px] text-sky-700 uppercase font-bold">Ingresos Extra</p>
              <p className="text-lg font-black text-sky-800 mt-1">{formatCurrency(extraInflow)}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-[11px] text-rose-700 uppercase font-bold">Egresos / Gastos</p>
              <p className="text-lg font-black text-rose-800 mt-1">{formatCurrency(outflows)}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 col-span-2 md:col-span-1">
              <p className="text-[11px] text-amber-900 uppercase font-extrabold">Monto Esperado</p>
              <p className="text-lg font-black text-amber-900 mt-1">
                {formatCurrency(expectedAmount)}
              </p>
            </div>
          </div>

          {/* Shift Movements Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              Movimientos del Turno:
            </h4>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descripción</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No hay movimientos registrados en el turno actual.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-500">{formatDateTime(m.fecha)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.tipo === 'VENTA'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.tipo === 'INGRESO_EXTRA'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {m.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{m.descripcion}</td>
                        <td className="py-2.5 px-3 text-right font-black">
                          {m.tipo === 'EGRESO_GASTO' ? '-' : '+'}
                          {formatCurrency(m.monto)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">La Caja se encuentra Cerrada</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Debe registrar un monto inicial para abrir turno antes de procesar ventas en efectivo en el mostrador.
            </p>
          </div>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
          >
            Abrir Turno de Caja Ahora
          </button>
        </div>
      )}

      {/* Shifts History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-slate-900 text-sm">Historial de Turnos de Caja</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-2.5 px-3"># Turno</th>
                <th className="py-2.5 px-3">Cajero</th>
                <th className="py-2.5 px-3">Apertura</th>
                <th className="py-2.5 px-3">Cierre</th>
                <th className="py-2.5 px-3 text-right">M. Inicial</th>
                <th className="py-2.5 px-3 text-right">M. Esperado</th>
                <th className="py-2.5 px-3 text-right">M. Declarado</th>
                <th className="py-2.5 px-3 text-right">Diferencia</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {shiftsHistory.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">#{s.id}</td>
                  <td className="py-2.5 px-3">{s.usuario_nombre}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(s.fecha_apertura)}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateTime(s.fecha_cierre)}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(s.monto_inicial)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {s.monto_esperado !== null && s.monto_esperado !== undefined
                      ? formatCurrency(s.monto_esperado)
                      : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    {s.monto_final !== null && s.monto_final !== undefined
                      ? formatCurrency(s.monto_final)
                      : '-'}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-black ${
                      (s.diferencia || 0) < 0
                        ? 'text-rose-600'
                        : (s.diferencia || 0) > 0
                        ? 'text-emerald-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {s.diferencia !== null && s.diferencia !== undefined
                      ? formatCurrency(s.diferencia)
                      : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.estado === 'ABIERTA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="Apertura de Turno de Caja"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Monto Base Inicial en Gaveta ($) *
            </label>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={montoInicial}
              onChange={(e) => setMontoInicial(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-bold"
              placeholder="100.00"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Fondo inicial para cambio / vuelto en mostrador.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpenShiftModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
            >
              Confirmar Apertura
            </button>
          </div>
        </form>
      </Modal>

      {/* Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        title="Registrar Movimiento de Efectivo"
      >
        <form onSubmit={handleRecordMovement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('INGRESO_EXTRA')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  movementType === 'INGRESO_EXTRA'
                    ? 'bg-sky-50 border-sky-500 text-sky-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-sky-600" />
                <span>Ingreso Extra</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('EGRESO_GASTO')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 ${
                  movementType === 'EGRESO_GASTO'
                    ? 'bg-rose-50 border-rose-500 text-rose-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-rose-600" />
                <span>Gasto / Retiro</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto ($) *</label>
            <input
              type="number"
              min="0.1"
              step="0.5"
              required
              value={movementAmount || ''}
              onChange={(e) => setMovementAmount(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500 font-bold"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Descripción / Motivo *
            </label>
            <input
              type="text"
              required
              value={movementDesc}
              onChange={(e) => setMovementDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              placeholder="ej. Pago de flete urgente, compra de café..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
            >
              Guardar Movimiento
            </button>
          </div>
        </form>
      </Modal>

      {/* Close Shift Modal */}
      <Modal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        title="Cierre y Arqueo de Turno de Caja"
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Monto Inicial:</span>
              <span className="font-semibold">{formatCurrency(currentShift?.monto_inicial || 0)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Ventas Efectivo:</span>
              <span className="font-semibold">+{formatCurrency(salesCash)}</span>
            </div>
            <div className="flex justify-between text-sky-700">
              <span>Otros Ingresos:</span>
              <span className="font-semibold">+{formatCurrency(extraInflow)}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>Egresos / Gastos:</span>
              <span className="font-semibold">-{formatCurrency(outflows)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Monto Esperado en Gaveta:</span>
              <span className="text-amber-600">{formatCurrency(expectedAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Monto Físico Declarado (Conteo en Gaveta) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={montoDeclarado}
              onChange={(e) => setMontoDeclarado(Number(e.target.value))}
              className="w-full px-3 py-2 text-base font-black bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-amber-500 text-right"
            />
          </div>

          <div
            className={`p-3 rounded-xl border text-xs font-bold flex justify-between ${
              montoDeclarado - expectedAmount === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : montoDeclarado - expectedAmount > 0
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>Diferencia (Sobrante / Faltante):</span>
            <span>{formatCurrency(montoDeclarado - expectedAmount)}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCloseShiftModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs"
            >
              Confirmar Cierre de Caja
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
