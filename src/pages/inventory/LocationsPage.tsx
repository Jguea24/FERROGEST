import React, { useState, useEffect } from 'react';
import { MapPin, Plus, CheckCircle2, Navigation } from 'lucide-react';
import { db } from '../../services/db';
import { Location } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';

export const LocationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [pasillo, setPasillo] = useState('');
  const [estante, setEstante] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = () => {
    setLocations(db.getLocations());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setNombre('');
    setPasillo('');
    setEstante('');
    setDescripcion('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !pasillo.trim() || !estante.trim()) {
      setError('Nombre de zona, pasillo y estante son campos obligatorios.');
      return;
    }

    try {
      db.createLocation(nombre, pasillo, estante, descripcion);
      setSuccess('Ubicación física creada exitosamente.');
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar ubicación.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-amber-500" />
            <span>Ubicaciones Físicas (Pasillos y Estantes)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mapeo del almacén y mostrador de FERRO GET para localización inmediata de productos.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Ubicación</span>
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid of Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const productsInLocation = db.getProducts().filter((p) => p.ubicacion_id === loc.id && p.estado === 'ACTIVO');

          return (
            <div key={loc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">{loc.pasillo} &bull; {loc.estante}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold">{loc.nombre}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2">{loc.descripcion || 'Sin descripción detallada'}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Ítems almacenados:</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full text-[11px]">
                  {productsInLocation.length} productos
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Ubicación Física">
        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre de la Zona *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              placeholder="ej. Zona Frontal Herramientas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pasillo *</label>
              <input
                type="text"
                required
                value={pasillo}
                onChange={(e) => setPasillo(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                placeholder="ej. Pasillo 2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estante *</label>
              <input
                type="text"
                required
                value={estante}
                onChange={(e) => setEstante(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
                placeholder="ej. Estante B"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Descripción</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-amber-500"
              placeholder="Detalles de acceso, tipo de mercadería..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-sm"
            >
              Guardar Ubicación
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
