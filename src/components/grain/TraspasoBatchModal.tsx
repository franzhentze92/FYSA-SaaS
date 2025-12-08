import React, { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { GrainBatch, Silo } from '@/types/grain';

interface TraspasoBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (siloDestinoId: string, cantidad: number, notas?: string) => void;
  batch: GrainBatch;
  siloOrigen: Silo;
  silos: Silo[];
}

const TraspasoBatchModal: React.FC<TraspasoBatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  batch,
  siloOrigen,
  silos,
}) => {
  const [siloDestinoId, setSiloDestinoId] = useState('');
  const [cantidad, setCantidad] = useState(batch.quantity);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSiloDestinoId('');
      setCantidad(batch.quantity);
      setNotas('');
    }
  }, [isOpen, batch.quantity]);

  if (!isOpen) return null;

  // Función auxiliar para calcular cantidad total en silo
  const getTotalQuantityInSilo = (siloId: string): number => {
    const silo = silos.find(s => s.id === siloId);
    if (!silo) return 0;
    return silo.batches.reduce((total, b) => {
      const qty = b.unit === 'tonnes' ? b.quantity : b.quantity / 1000;
      return total + qty;
    }, 0);
  };

  const silosDisponibles = silos.filter(s => s.id !== siloOrigen.id);
  const siloDestino = silos.find(s => s.id === siloDestinoId);
  const cantidadDisponibleEnDestino = siloDestino 
    ? getTotalQuantityInSilo(siloDestino.id)
    : 0;
  const capacidadDisponible = siloDestino 
    ? siloDestino.capacity - cantidadDisponibleEnDestino
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siloDestinoId || cantidad <= 0) return;
    
    // Validar capacidad
    const cantidadEnTonnes = batch.unit === 'tonnes' ? cantidad : cantidad / 1000;
    if (cantidadEnTonnes > capacidadDisponible) {
      alert(`El silo destino no tiene suficiente capacidad. Capacidad disponible: ${capacidadDisponible.toFixed(2)} toneladas`);
      return;
    }

    if (cantidad > batch.quantity) {
      alert(`La cantidad no puede ser mayor a ${batch.quantity} ${batch.unit === 'tonnes' ? 'toneladas' : 'kilogramos'}`);
      return;
    }

    onSubmit(siloDestinoId, cantidad, notas || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Traspasar Batch</h2>
            <p className="text-sm text-gray-500">
              Batch ID: {batch.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Información del Batch */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Información del Batch</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Tipo:</span>
                <span className="ml-1 font-medium">{batch.grainType}</span>
                {batch.grainSubtype && (
                  <span className="text-gray-500 ml-1">({batch.grainSubtype})</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Cantidad disponible:</span>
                <span className="ml-1 font-medium">
                  {batch.quantity} {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Silo actual:</span>
                <span className="ml-1 font-medium">Silo {batch.siloActual}</span>
              </div>
              <div>
                <span className="text-gray-500">Origen:</span>
                <span className="ml-1 font-medium">{batch.origin}</span>
              </div>
            </div>
          </div>

          {/* Selección de Silo Destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Silo Destino *
            </label>
            <select
              value={siloDestinoId}
              onChange={e => setSiloDestinoId(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            >
              <option value="">Seleccionar silo destino...</option>
              {silosDisponibles.map(silo => {
                const cantidadActual = getTotalQuantityInSilo(silo.id);
                const capacidadDisponible = silo.capacity - cantidadActual;
                return (
                  <option key={silo.id} value={silo.id}>
                    Silo {silo.number} - {cantidadActual.toFixed(2)} / {silo.capacity} ton
                    {capacidadDisponible > 0 && ` (${capacidadDisponible.toFixed(2)} ton disponible)`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Cantidad a Traspasar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad a Traspasar *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={cantidad}
                onChange={e => setCantidad(+e.target.value)}
                className="flex-1 border rounded-lg p-2.5"
                required
                min="0"
                max={batch.quantity}
              />
              <span className="flex items-center px-3 bg-gray-100 rounded-lg text-sm">
                {batch.unit === 'tonnes' ? 'ton' : 'kg'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Máximo: {batch.quantity} {batch.unit === 'tonnes' ? 'toneladas' : 'kilogramos'}
            </p>
            {siloDestino && (
              <p className={`text-xs mt-1 ${
                (batch.unit === 'tonnes' ? cantidad : cantidad / 1000) > capacidadDisponible
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}>
                Capacidad disponible en Silo {siloDestino.number}: {capacidadDisponible.toFixed(2)} toneladas
              </p>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              placeholder="Razón del traspaso, limpieza, etc."
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 flex items-center justify-center gap-2"
            >
              <ArrowRight size={18} />
              Traspasar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TraspasoBatchModal;

