import React, { useState } from 'react';
import { Warehouse, Plus, Edit, Trash2, Package, ArrowRightLeft, History, Settings } from 'lucide-react';
import { Silo, GrainBatch } from '@/types/grain';
import { format } from 'date-fns';

interface SiloCardProps {
  silo: Silo;
  onAddBatch: () => void;
  onEditBatch: (batch: GrainBatch) => void;
  onDeleteBatch: (batchId: string) => void;
  onTraspasarBatch: (batch: GrainBatch) => void;
  onEditSilo: (silo: Silo) => void;
  onDeleteSilo: (siloId: string) => void;
  totalQuantity: number;
  isAdmin?: boolean; // Indica si el usuario es admin
}

const SiloCard: React.FC<SiloCardProps> = ({
  silo,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
  onTraspasarBatch,
  onEditSilo,
  onDeleteSilo,
  totalQuantity,
  isAdmin = false,
}) => {
  const [mostrarHistorial, setMostrarHistorial] = useState<string | null>(null);
  const capacityPercent = (totalQuantity / silo.capacity) * 100;
  const isFull = capacityPercent >= 100;
  const isNearFull = capacityPercent >= 80;

  return (
    <div className={`bg-white rounded-lg border-2 ${
      isFull ? 'border-red-500' : isNearFull ? 'border-yellow-500' : 'border-gray-200'
    } shadow-sm hover:shadow-md transition-shadow`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1">
              <div className={`p-2 rounded-lg ${
                silo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <Warehouse size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  Silo {silo.number}
                  {silo.nombre && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({silo.nombre})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-gray-500">
                  {silo.isActive ? 'Activo' : 'Vacío'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-1">
                <button
                  onClick={() => onEditSilo(silo)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar silo"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={onAddBatch}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  title="Agregar batch"
                >
                  <Plus size={18} />
                </button>
              </div>
            )}
          </div>
          
          {/* Botón eliminar silo */}
          {isAdmin && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm(`¿Estás seguro de que deseas eliminar el Silo ${silo.number}${silo.nombre ? ` (${silo.nombre})` : ''}? Esta acción eliminará todos los batches contenidos.`)) {
                    onDeleteSilo(silo.id);
                  }
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                title="Eliminar silo"
              >
                <Trash2 size={12} />
                Eliminar Silo
              </button>
            </div>
          )}

        {/* Capacidad */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Capacidad</span>
            <span className={`font-medium ${
              isFull ? 'text-red-600' : isNearFull ? 'text-yellow-600' : 'text-gray-700'
            }`}>
              {totalQuantity.toFixed(2)} / {silo.capacity} toneladas
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isFull ? 'bg-red-500' : isNearFull ? 'bg-yellow-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Batches */}
        <div className="space-y-2">
          {silo.batches.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Package size={24} className="mx-auto mb-2 opacity-50" />
              <p>No hay batches</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {silo.batches.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">
                          {batch.grainType}
                          {batch.grainSubtype && (
                            <span className="text-gray-500 ml-1">({batch.grainSubtype})</span>
                          )}
                        </span>
                        <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold">
                          Batch ID: {batch.id.substring(0, 8).toUpperCase()}
                        </span>
                        {batch.granoId && (
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Grano ID: {batch.granoId.substring(0, 8).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {batch.quantity} {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(batch.entryDate), 'dd/MM/yyyy')}
                      </p>
                      <p className="text-xs text-gray-500">
                        Origen: {batch.origin}
                      </p>
                      {batch.historialMovimientos && batch.historialMovimientos.length > 0 && (
                        <button
                          onClick={() => setMostrarHistorial(
                            mostrarHistorial === batch.id ? null : batch.id
                          )}
                          className="mt-1 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <History size={12} />
                          Ver historial ({batch.historialMovimientos.length} movimientos)
                        </button>
                      )}
                      {mostrarHistorial === batch.id && batch.historialMovimientos && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs space-y-1 border border-blue-200">
                          <p className="font-medium text-blue-900 mb-1">Historial de Movimientos:</p>
                          {batch.historialMovimientos.map((mov, idx) => (
                            <div key={idx} className="text-blue-800">
                              <span className="font-medium">
                                {format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}
                              </span>
                              {' - '}
                              <span>Silo {mov.siloOrigen} → Silo {mov.siloDestino}</span>
                              {' - '}
                              <span>{mov.cantidad} {batch.unit === 'tonnes' ? 'ton' : 'kg'}</span>
                              {mov.notas && (
                                <span className="text-blue-600 italic"> ({mov.notas})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onTraspasarBatch(batch)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="Traspasar a otro silo"
                        >
                          <ArrowRightLeft size={14} />
                        </button>
                        <button
                          onClick={() => onEditBatch(batch)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteBatch(batch.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SiloCard;

