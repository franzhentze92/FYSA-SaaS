import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GrainBatch } from '@/types/grain';
import { useBarcos } from '@/hooks/useBarcos';
import { useCatalogos } from '@/hooks/useCatalogos';

interface AddBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (batch: Omit<GrainBatch, 'id'>) => void;
  siloNumber: number;
  existingBatch?: GrainBatch; // Para edición
}

const AddBatchModal: React.FC<AddBatchModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  siloNumber,
  existingBatch 
}) => {
  const { barcos, getBarcoById } = useBarcos();
  const { getBarcoMaestroById, getVariedadNombre, getVariedadesByTipoGrano } = useCatalogos();
  
  const [barcoId, setBarcoId] = useState('');
  const [granoId, setGranoId] = useState('');
  const [variedadId, setVariedadId] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<'kg' | 'tonnes'>('tonnes');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // Obtener el barco seleccionado y sus granos
  const barcoSeleccionado = barcoId ? getBarcoById(barcoId) : null;
  const granosDisponibles = barcoSeleccionado?.granos || [];
  const granoSeleccionado = granosDisponibles.find(g => g.id === granoId);
  
  // Obtener nombre del barco
  const nombreBarco = barcoSeleccionado 
    ? getBarcoMaestroById(barcoSeleccionado.barcoId)?.nombre || 'Barco desconocido'
    : '';
  
  // Obtener variedades disponibles para el tipo de grano seleccionado
  const tipoGranoSeleccionado = granoSeleccionado?.tipoGrano || '';
  const variedadesDisponibles = tipoGranoSeleccionado 
    ? getVariedadesByTipoGrano(tipoGranoSeleccionado, true) 
    : [];
  
  // Obtener nombre de la variedad seleccionada
  const variedadNombre = variedadId ? getVariedadNombre(variedadId) : null;

  useEffect(() => {
    if (existingBatch) {
      // Manejar migración de batches antiguos sin barcoId/granoId
      setBarcoId(existingBatch.barcoId || '');
      setGranoId(existingBatch.granoId || '');
      setVariedadId(existingBatch.variedadId || '');
      setQuantity(existingBatch.quantity);
      setUnit(existingBatch.unit);
      setEntryDate(existingBatch.entryDate);
      setNotes(existingBatch.notes || '');
    } else {
      // Resetear formulario si no hay batch existente
      setBarcoId('');
      setGranoId('');
      setVariedadId('');
      setQuantity(100);
      setUnit('tonnes');
      setEntryDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [existingBatch, isOpen]);
  
  // Resetear granoId cuando cambia el barco
  useEffect(() => {
    if (barcoId && !granosDisponibles.find(g => g.id === granoId)) {
      setGranoId('');
      setVariedadId('');
    }
  }, [barcoId, granosDisponibles, granoId]);
  
  // Resetear variedadId cuando cambia el tipo de grano
  useEffect(() => {
    if (granoSeleccionado && !existingBatch) {
      // Si el grano ya tiene una variedad asignada, usarla por defecto
      if (granoSeleccionado.variedadId && !variedadId) {
        setVariedadId(granoSeleccionado.variedadId);
      } else if (!granoSeleccionado.variedadId) {
        // Si el grano no tiene variedad, limpiar la selección
        setVariedadId('');
      }
    } else if (!granoSeleccionado && !existingBatch) {
      setVariedadId('');
    }
    // Si estamos editando, no modificar variedadId aquí
  }, [granoSeleccionado?.id, existingBatch?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcoSeleccionado || !granoSeleccionado) return;
    
    onSubmit({
      barcoId: barcoSeleccionado.id,
      granoId: granoSeleccionado.id,
      grainType: granoSeleccionado.tipoGrano,
      variedadId: variedadId || undefined,
      grainSubtype: variedadNombre || undefined,
      quantity,
      unit,
      origin: nombreBarco,
      entryDate,
      notes: notes || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">
              {existingBatch ? 'Editar Batch' : 'Agregar Batch'}
            </h2>
            <p className="text-sm text-gray-500">Silo {siloNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Entrada *
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barco *
            </label>
            <select
              value={barcoId}
              onChange={e => setBarcoId(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            >
              <option value="">Seleccionar barco...</option>
              {[...barcos]
                .sort((a, b) => new Date(b.fechaFondeo).getTime() - new Date(a.fechaFondeo).getTime())
                .map(barco => {
                  const barcoMaestro = getBarcoMaestroById(barco.barcoId);
                  const nombre = barcoMaestro?.nombre || 'Barco desconocido';
                  return (
                    <option key={barco.id} value={barco.id}>
                      {nombre} - {new Date(barco.fechaFondeo).toLocaleDateString()}
                    </option>
                  );
                })}
            </select>
            {barcos.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No hay barcos registrados. Agrega barcos primero.
              </p>
            )}
          </div>

          {barcoSeleccionado && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grano del Barco *
              </label>
              <select
                value={granoId}
                onChange={e => setGranoId(e.target.value)}
                className="w-full border rounded-lg p-2.5"
                required
                disabled={granosDisponibles.length === 0}
              >
                <option value="">Seleccionar grano...</option>
                {granosDisponibles.map(grano => {
                  const variedad = grano.variedadId ? getVariedadNombre(grano.variedadId) : null;
                  return (
                    <option key={grano.id} value={grano.id}>
                      {grano.tipoGrano}
                      {variedad && ` (${variedad})`} - {grano.cantidad} ton
                      {grano.id && ` [ID: ${grano.id.substring(0, 8).toUpperCase()}]`}
                    </option>
                  );
                })}
              </select>
              {granosDisponibles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Este barco no tiene granos registrados.
                </p>
              )}
              {granoSeleccionado && (
                <>
                  {variedadesDisponibles.length > 0 && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Variedad (opcional)
                      </label>
                      <select
                        value={variedadId}
                        onChange={e => setVariedadId(e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="">Sin variedad específica</option>
                        {variedadesDisponibles.map(variedad => (
                          <option key={variedad.id} value={variedad.id}>
                            {variedad.variedad}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs">
                    <p className="text-gray-600">
                      <span className="font-medium">Tipo:</span> {granoSeleccionado.tipoGrano}
                      {variedadNombre && <span> ({variedadNombre})</span>}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Cantidad disponible:</span> {granoSeleccionado.cantidad} toneladas
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">ID del grano:</span> {granoSeleccionado.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(+e.target.value)}
                className="w-full border rounded-lg p-2.5"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad *
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value as 'kg' | 'tonnes')}
                className="w-full border rounded-lg p-2.5"
                required
              >
                <option value="kg">Kilogramos</option>
                <option value="tonnes">Toneladas</option>
              </select>
            </div>
          </div>

          {nombreBarco && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origen
              </label>
              <input
                type="text"
                value={nombreBarco}
                className="w-full border rounded-lg p-2.5 bg-gray-50"
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Se obtiene automáticamente del barco seleccionado
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Información adicional sobre este batch..."
              className="w-full border rounded-lg p-2.5"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
            >
              {existingBatch ? 'Actualizar' : 'Agregar'} Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBatchModal;

