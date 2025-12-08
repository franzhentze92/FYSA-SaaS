import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { GRAIN_TYPES, PEST_TYPES } from '@/types/grain';
import { Barco, InsectSample, GranoCarga } from '@/types/grain';
import { useCatalogos } from '@/hooks/useCatalogos';
import { v4 as uuidv4 } from 'uuid';

interface AddBarcoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (barco: Omit<Barco, 'id'>) => void;
  existingBarco?: Barco; // Para edición
}

const AddBarcoModal: React.FC<AddBarcoModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingBarco 
}) => {
  const { getBarcosActivos, getVariedadesByTipoGrano } = useCatalogos();
  const barcosActivos = getBarcosActivos();
  
  const [barcoId, setBarcoId] = useState('');
  const [fechaFondeo, setFechaFondeo] = useState(new Date().toISOString().split('T')[0]);
  const [granos, setGranos] = useState<GranoCarga[]>([]);
  const [muestreoInsectos, setMuestreoInsectos] = useState<InsectSample[]>([]);
  const [requiereTratamientoOIRSA, setRequiereTratamientoOIRSA] = useState(false);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (existingBarco) {
      setBarcoId(existingBarco.barcoId);
      setFechaFondeo(existingBarco.fechaFondeo);
      setGranos(existingBarco.granos.length > 0 
        ? existingBarco.granos.map(g => ({ ...g, id: g.id || uuidv4() }))
        : [{ id: uuidv4(), tipoGrano: 'Trigo', cantidad: 0 }]
      );
      setMuestreoInsectos(existingBarco.muestreoInsectos);
      setRequiereTratamientoOIRSA(existingBarco.requiereTratamientoOIRSA);
      setNotas(existingBarco.notas || '');
    } else {
      // Resetear formulario
      setBarcoId('');
      setFechaFondeo(new Date().toISOString().split('T')[0]);
      setGranos([{ id: uuidv4(), tipoGrano: 'Trigo', cantidad: 0 }]);
      setMuestreoInsectos([]);
      setRequiereTratamientoOIRSA(false);
      setNotas('');
    }
  }, [existingBarco, isOpen]);

  if (!isOpen) return null;

  const handleAddGrano = () => {
    setGranos([...granos, { id: uuidv4(), tipoGrano: 'Trigo', cantidad: 0 }]);
  };

  const handleRemoveGrano = (index: number) => {
    setGranos(granos.filter((_, i) => i !== index));
  };

  const handleUpdateGrano = (index: number, field: 'tipoGrano' | 'variedadId' | 'cantidad', value: string | number) => {
    setGranos(granos.map((grano, i) => {
      if (i === index) {
        const updated = { ...grano, [field]: value };
        // Si cambia el tipo de grano, limpiar la variedad
        if (field === 'tipoGrano') {
          updated.variedadId = undefined;
        }
        return updated;
      }
      return grano;
    }));
  };

  const handleAddInsect = () => {
    setMuestreoInsectos([...muestreoInsectos, { pestType: '', count: 0 }]);
  };

  const handleRemoveInsect = (index: number) => {
    setMuestreoInsectos(muestreoInsectos.filter((_, i) => i !== index));
  };

  const handleUpdateInsect = (index: number, field: 'pestType' | 'count', value: string | number) => {
    setMuestreoInsectos(muestreoInsectos.map((insect, i) => 
      i === index ? { ...insect, [field]: value } : insect
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      barcoId,
      fechaFondeo,
      granos: granos.filter(g => g.tipoGrano && g.cantidad > 0).map(g => ({
        ...g,
        id: g.id || uuidv4() // Asegurar que todos tengan ID
      })),
      muestreoInsectos: muestreoInsectos.filter(i => i.pestType && i.count > 0),
      requiereTratamientoOIRSA,
      notas: notas || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">
              {existingBarco ? 'Editar Barco' : 'Agregar Barco'}
            </h2>
            <p className="text-sm text-gray-500">Registro de entrada al país</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Información Básica */}
          <div className="grid grid-cols-2 gap-4">
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
                {barcosActivos.map(barco => (
                  <option key={barco.id} value={barco.id}>{barco.nombre}</option>
                ))}
              </select>
              {barcosActivos.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  No hay barcos disponibles. Agrega barcos en el catálogo primero.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fondeo *
              </label>
              <input
                type="date"
                value={fechaFondeo}
                onChange={e => setFechaFondeo(e.target.value)}
                className="w-full border rounded-lg p-2.5"
                required
              />
            </div>
          </div>

          {/* Granos */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Granos Transportados *
              </label>
              <button
                type="button"
                onClick={handleAddGrano}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={16} />
                Agregar Grano
              </button>
            </div>

            {granos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                No se han agregado granos. Agrega al menos un tipo de grano.
              </p>
            ) : (
              <div className="space-y-3">
                {granos.map((grano, index) => {
                  const variedadesDisponibles = getVariedadesByTipoGrano(grano.tipoGrano, true);
                  return (
                    <div key={grano.id || index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500">ID: {grano.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tipo de Grano
                          </label>
                          <select
                            value={grano.tipoGrano}
                            onChange={e => handleUpdateGrano(index, 'tipoGrano', e.target.value)}
                            className="w-full border rounded-lg p-2 text-sm"
                            required
                          >
                            {GRAIN_TYPES.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        {variedadesDisponibles.length > 0 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Variedad (opcional)
                            </label>
                            <select
                              value={grano.variedadId || ''}
                              onChange={e => handleUpdateGrano(index, 'variedadId', e.target.value || undefined)}
                              className="w-full border rounded-lg p-2 text-sm"
                            >
                              <option value="">Sin variedad específica</option>
                              {variedadesDisponibles.map(v => (
                                <option key={v.id} value={v.id}>{v.variedad}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Cantidad (ton)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={grano.cantidad}
                          onChange={e => handleUpdateGrano(index, 'cantidad', +e.target.value)}
                          className="w-full border rounded-lg p-2 text-sm"
                          required
                          min="0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveGrano(index)}
                        className={`mt-6 p-2 rounded-lg transition-colors ${
                          granos.length === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        disabled={granos.length === 1}
                        title={granos.length === 1 ? 'Debe haber al menos un grano' : 'Eliminar grano'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Muestreo de Insectos */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Muestreo de Insectos
              </label>
              <button
                type="button"
                onClick={handleAddInsect}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                <Plus size={16} />
                Agregar Insecto
              </button>
            </div>

            {muestreoInsectos.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                No se han agregado insectos. Si no se encontraron insectos, puede dejar esto vacío.
              </p>
            ) : (
              <div className="space-y-3">
                {muestreoInsectos.map((insect, index) => (
                  <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tipo de Insecto
                      </label>
                      <select
                        value={insect.pestType}
                        onChange={e => handleUpdateInsect(index, 'pestType', e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                      >
                        <option value="">Seleccionar...</option>
                        {PEST_TYPES.map(pest => (
                          <option key={pest.id} value={pest.name}>{pest.name}</option>
                        ))}
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        value={insect.count}
                        onChange={e => handleUpdateInsect(index, 'count', +e.target.value)}
                        className="w-full border rounded-lg p-2 text-sm"
                        min="0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInsect(index)}
                      className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tratamiento OIRSA */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requiereTratamientoOIRSA}
                onChange={e => setRequiereTratamientoOIRSA(e.target.checked)}
                className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Se requirió aplicación de tratamiento cuarentenario por OIRSA
              </span>
            </label>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Información adicional sobre este barco..."
              className="w-full border rounded-lg p-2.5"
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
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
            >
              {existingBarco ? 'Actualizar' : 'Agregar'} Barco
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBarcoModal;

