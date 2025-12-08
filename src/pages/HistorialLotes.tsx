import React, { useMemo, useState } from 'react';
import { History, Search, Filter, ArrowRight } from 'lucide-react';
import { useSilos } from '@/hooks/useSilos';
import { useBarcos } from '@/hooks/useBarcos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { GrainBatch, MovimientoSilo } from '@/types/grain';
import { format } from 'date-fns';

interface EventoHistorial {
  tipo: 'entrada' | 'movimiento';
  fecha: string;
  batchId: string;
  batch: GrainBatch;
  siloOrigen?: number;
  siloDestino?: number;
  cantidad?: number;
  notas?: string;
  siloNombre?: string;
}

const HistorialLotes: React.FC = () => {
  const { silos } = useSilos();
  const { barcos, getBarcoById } = useBarcos();
  const { barcosMaestros, getBarcoMaestroById, getVariedadNombre } = useCatalogos();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'movimiento'>('todos');
  const [filtroSilo, setFiltroSilo] = useState<string>('todos');
  const [filtroBarco, setFiltroBarco] = useState<string>('todos');
  const [filtroBatch, setFiltroBatch] = useState<string>('todos');

  // Obtener todos los eventos del historial
  const eventosHistorial = useMemo(() => {
    const eventos: EventoHistorial[] = [];

    silos.forEach(silo => {
      silo.batches.forEach(batch => {
        // Evento de entrada inicial
        eventos.push({
          tipo: 'entrada',
          fecha: batch.entryDate,
          batchId: batch.id,
          batch,
          siloNombre: silo.nombre ? `Silo ${silo.number} (${silo.nombre})` : `Silo ${silo.number}`,
        });

        // Eventos de movimientos
        if (batch.historialMovimientos && batch.historialMovimientos.length > 0) {
          batch.historialMovimientos.forEach((movimiento: MovimientoSilo) => {
            eventos.push({
              tipo: 'movimiento',
              fecha: movimiento.fecha,
              batchId: batch.id,
              batch,
              siloOrigen: movimiento.siloOrigen,
              siloDestino: movimiento.siloDestino,
              cantidad: movimiento.cantidad,
              notas: movimiento.notas,
            });
          });
        }
      });
    });

    // Ordenar por fecha (más reciente primero)
    return eventos.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [silos]);

  // Filtrar eventos
  const eventosFiltrados = useMemo(() => {
    return eventosHistorial.filter(evento => {
      // Filtro por tipo
      if (filtroTipo !== 'todos' && evento.tipo !== filtroTipo) {
        return false;
      }

      // Filtro por silo
      if (filtroSilo !== 'todos') {
        if (evento.tipo === 'entrada') {
          const silo = silos.find(s => s.batches.some(b => b.id === evento.batchId));
          if (silo?.id !== filtroSilo) return false;
        } else if (evento.tipo === 'movimiento') {
          const siloOrigen = silos.find(s => s.number === evento.siloOrigen);
          const siloDestino = silos.find(s => s.number === evento.siloDestino);
          if (siloOrigen?.id !== filtroSilo && siloDestino?.id !== filtroSilo) {
            return false;
          }
        }
      }

      // Filtro por barco
      if (filtroBarco !== 'todos') {
        const batch = evento.batch;
        const barco = getBarcoById(batch.barcoId);
        if (barco?.barcoId !== filtroBarco) return false;
      }

      // Filtro por batch
      if (filtroBatch !== 'todos') {
        if (evento.batchId !== filtroBatch) return false;
      }

      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const batch = evento.batch;
        const barco = getBarcoById(batch.barcoId);
        const barcoMaestro = barco ? getBarcoMaestroById(barco.barcoId) : null;
        
        return (
          batch.grainType.toLowerCase().includes(query) ||
          batch.grainSubtype?.toLowerCase().includes(query) ||
          batch.origin.toLowerCase().includes(query) ||
          batch.id.toLowerCase().includes(query) ||
          batch.granoId?.toLowerCase().includes(query) ||
          barcoMaestro?.nombre.toLowerCase().includes(query) ||
          `silo ${batch.siloActual}`.includes(query)
        );
      }

      return true;
    });
  }, [eventosHistorial, filtroTipo, filtroSilo, filtroBarco, filtroBatch, searchQuery, silos, getBarcoById, getBarcoMaestroById]);

  const getSiloNombre = (numero: number): string => {
    const silo = silos.find(s => s.number === numero);
    return silo?.nombre ? `Silo ${numero} (${silo.nombre})` : `Silo ${numero}`;
  };

  const totalEntradas = eventosHistorial.filter(e => e.tipo === 'entrada').length;
  const totalMovimientos = eventosHistorial.filter(e => e.tipo === 'movimiento').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <History size={32} />
                Historial de Lotes
              </h1>
              <p className="text-gray-600 mt-2">
                Registro completo de entradas y movimientos de batches entre silos
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Entradas</p>
                <p className="text-2xl font-bold text-emerald-600">{totalEntradas}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Movimientos</p>
                <p className="text-2xl font-bold text-blue-600">{totalMovimientos}</p>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 items-end">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por batch ID, grano ID, tipo de grano, barco, silo..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'movimiento')}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los eventos</option>
                <option value="entrada">Solo entradas</option>
                <option value="movimiento">Solo movimientos</option>
              </select>
              <select
                value={filtroSilo}
                onChange={(e) => setFiltroSilo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los silos</option>
                {silos.map(silo => (
                  <option key={silo.id} value={silo.id}>
                    {silo.nombre ? `Silo ${silo.number} (${silo.nombre})` : `Silo ${silo.number}`}
                  </option>
                ))}
              </select>
              <select
                value={filtroBarco}
                onChange={(e) => setFiltroBarco(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los barcos</option>
                {barcosMaestros
                  .filter(barco => barco.activo)
                  .map(barco => (
                    <option key={barco.id} value={barco.id}>
                      {barco.nombre}
                    </option>
                  ))}
              </select>
              <select
                value={filtroBatch}
                onChange={(e) => setFiltroBatch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los batches</option>
                {Array.from(new Set(silos.flatMap(s => s.batches.map(b => b.id))))
                  .map(batchId => {
                    const batch = silos.flatMap(s => s.batches).find(b => b.id === batchId);
                    if (!batch) return null;
                    return (
                      <option key={batchId} value={batchId}>
                        {batchId.substring(0, 8).toUpperCase()} - {batch.grainType}
                        {batch.grainSubtype && ` (${batch.grainSubtype})`}
                      </option>
                    );
                  })
                  .filter(Boolean)}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {eventosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No se encontraron eventos en el historial</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {eventosFiltrados.map((evento, index) => {
                const batch = evento.batch;
                const barco = getBarcoById(batch.barcoId);
                const barcoMaestro = barco ? getBarcoMaestroById(barco.barcoId) : null;
                const variedadNombre = getVariedadNombre(batch.variedadId);

                return (
                  <div
                    key={`${evento.batchId}-${evento.tipo}-${index}`}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icono y tipo */}
                      <div className={`p-2 rounded-lg ${
                        evento.tipo === 'entrada'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {evento.tipo === 'entrada' ? (
                          <History size={20} />
                        ) : (
                          <ArrowRight size={20} />
                        )}
                      </div>

                      {/* Información del evento */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            evento.tipo === 'entrada'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {evento.tipo === 'entrada' ? 'ENTRADA' : 'MOVIMIENTO'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(evento.fecha), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>

                        {/* Información del batch */}
                        <div className="grid grid-cols-2 gap-4 mb-2">
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Batch ID:</span>{' '}
                              <span className="font-mono text-xs">{batch.id.substring(0, 8).toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Tipo:</span>{' '}
                              {batch.grainType}
                              {variedadNombre && (
                                <span className="text-gray-500"> ({variedadNombre})</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Cantidad:</span>{' '}
                              {evento.cantidad || batch.quantity} {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Origen:</span>{' '}
                              {barcoMaestro?.nombre || batch.origin}
                            </p>
                            {evento.tipo === 'entrada' && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Silo:</span>{' '}
                                {evento.siloNombre || `Silo ${batch.siloActual}`}
                              </p>
                            )}
                            {evento.tipo === 'movimiento' && (
                              <div className="text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">De:</span>{' '}
                                  {getSiloNombre(evento.siloOrigen!)}
                                </p>
                                <p>
                                  <span className="font-medium">A:</span>{' '}
                                  {getSiloNombre(evento.siloDestino!)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notas */}
                        {evento.notas && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <span className="font-medium">Notas:</span> {evento.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialLotes;

