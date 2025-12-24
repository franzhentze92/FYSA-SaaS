import React, { useMemo, useState } from 'react';
import { History, Search, Filter, ArrowRight, Edit, Bug } from 'lucide-react';
import { useSilos } from '@/hooks/useSilos';
import { useBarcos } from '@/hooks/useBarcos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useFumigacionSilos } from '@/hooks/useFumigacionSilos';
import { GrainBatch, MovimientoSilo, ActualizacionCantidad, FumigacionSilo } from '@/types/grain';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

interface EventoHistorial {
  tipo: 'entrada' | 'movimiento' | 'actualizacion' | 'fumigacion';
  fecha: string;
  batchId: string;
  batch: GrainBatch;
  siloOrigen?: number;
  siloDestino?: number;
  cantidad?: number;
  notas?: string;
  siloNombre?: string;
  // Campos específicos para actualización de cantidad
  cantidadAnterior?: number;
  cantidadNueva?: number;
  cantidadCambio?: number;
  siloNumero?: number;
  // Campos específicos para fumigación
  fumigacion?: FumigacionSilo;
}

const HistorialLotes: React.FC = () => {
  const { silos } = useSilos();
  const { barcos, getBarcoById } = useBarcos();
  const { barcosMaestros, getBarcoMaestroById, getVariedadNombre } = useCatalogos();
  const { fumigaciones } = useFumigacionSilos();
  const [batchesDisconnected, setBatchesDisconnected] = useState<GrainBatch[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'movimiento' | 'actualizacion' | 'fumigacion'>('todos');
  const [filtroSilo, setFiltroSilo] = useState<string>('todos');
  const [filtroBarco, setFiltroBarco] = useState<string>('todos');
  const [filtroBatch, setFiltroBatch] = useState<string>('todos');

  // Fetch disconnected batches (those with silo_id = null but have history)
  React.useEffect(() => {
    const fetchDisconnectedBatches = async () => {
      try {
        const { data: batchesData, error } = await supabase
          .from('grain_batches')
          .select('*')
          .is('silo_id', null);

        if (error) throw error;

        // Fetch movements and quantity updates for disconnected batches
        const batchIds = (batchesData || []).map((b: any) => b.id);
        
        if (batchIds.length > 0) {
          const { data: movementsData } = await supabase
            .from('batch_movements')
            .select('*')
            .in('batch_id', batchIds)
            .order('fecha', { ascending: true });

          // Fetch quantity updates, handling gracefully if table doesn't exist
          let quantityUpdatesData: any[] = [];
          try {
            const { data, error } = await supabase
              .from('batch_quantity_updates')
              .select('*')
              .in('batch_id', batchIds)
              .order('fecha', { ascending: true });
            
            if (!error && data) {
              quantityUpdatesData = data;
            }
          } catch (err) {
            // Table might not exist, continue without quantity updates
            console.warn('batch_quantity_updates table might not exist');
          }

          const formattedBatches: GrainBatch[] = (batchesData || []).map((b: any) => {
            const batchMovements = (movementsData || [])
              .filter((m: any) => m.batch_id === b.id)
              .map((m: any) => ({
                fecha: m.fecha,
                siloOrigen: m.silo_origen,
                siloDestino: m.silo_destino,
                cantidad: m.cantidad,
                notas: m.notas,
              }));

            const batchQuantityUpdates = (quantityUpdatesData || []).filter((q: any) => q.batch_id === b.id)
              .map((q: any) => {
                const siloIndex = silos.findIndex(s => s.id === q.silo_id);
                return {
                  fecha: q.fecha,
                  cantidadAnterior: Number(q.cantidad_anterior),
                  cantidadNueva: Number(q.cantidad_nueva),
                  cantidadCambio: Number(q.cantidad_cambio),
                  unit: (q.unit || 'tonnes') as 'kg' | 'tonnes',
                  siloNumero: siloIndex >= 0 ? silos[siloIndex].number : 0,
                  notas: q.notas,
                } as ActualizacionCantidad;
              });

            return {
              id: b.id,
              barcoId: b.barco_id || '',
              granoId: b.grano_id || '',
              variedadId: b.variedad_id,
              grainType: b.grain_type,
              grainSubtype: b.grain_subtype,
              quantity: Number(b.quantity),
              unit: (b.unit || 'tonnes') as 'kg' | 'tonnes',
              entryDate: b.entry_date,
              origin: b.origin,
              notes: b.notes,
              siloActual: b.silo_actual || 0, // Can be null, use 0 as fallback
              historialMovimientos: batchMovements,
              historialActualizaciones: batchQuantityUpdates,
            } as GrainBatch;
          });

          setBatchesDisconnected(formattedBatches);
        }
      } catch (error) {
        console.error('Error fetching disconnected batches:', error);
      }
    };

    fetchDisconnectedBatches();
  }, [silos]);

  // Obtener todos los eventos del historial
  const eventosHistorial = useMemo(() => {
    // Función auxiliar para determinar el silo original de entrada de un batch
    const getSiloOriginalEntrada = (batch: GrainBatch): number => {
      // Si el batch tiene movimientos, el silo original es el origen del primer movimiento (más antiguo)
      if (batch.historialMovimientos && batch.historialMovimientos.length > 0) {
        // Ordenar movimientos por fecha (más antiguo primero)
        const movimientosOrdenados = [...batch.historialMovimientos].sort(
          (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        );
        return movimientosOrdenados[0].siloOrigen;
      }
      // Si no tiene movimientos, el silo actual es donde entró
      return batch.siloActual;
    };

    const eventos: EventoHistorial[] = [];

    // Primero, recopilar todos los batches únicos (por ID) y determinar su silo original
    const batchesUnicos = new Map<string, { batch: GrainBatch; siloOriginal: number }>();
    
    silos.forEach(silo => {
      silo.batches.forEach(batch => {
        if (!batchesUnicos.has(batch.id)) {
          const siloOriginal = getSiloOriginalEntrada(batch);
          batchesUnicos.set(batch.id, { batch, siloOriginal });
        }
      });
    });

    // Also include disconnected batches (those with silo_id = null but have history)
    batchesDisconnected.forEach(batch => {
      if (!batchesUnicos.has(batch.id)) {
        const siloOriginal = getSiloOriginalEntrada(batch);
        batchesUnicos.set(batch.id, { batch, siloOriginal });
      }
    });

    // Crear eventos de entrada para cada batch único, asociados a su silo original
    batchesUnicos.forEach(({ batch, siloOriginal }) => {
      // Only create entrada event if we have a valid silo number (not 0)
      if (siloOriginal && siloOriginal > 0) {
        const siloOriginalObj = silos.find(s => s.number === siloOriginal);
        if (siloOriginalObj) {
          eventos.push({
            tipo: 'entrada',
            fecha: batch.entryDate,
            batchId: batch.id,
            batch,
            siloNombre: siloOriginalObj.nombre 
              ? `Silo ${siloOriginalObj.number} (${siloOriginalObj.nombre})` 
              : `Silo ${siloOriginalObj.number}`,
          });
        } else {
          // If silo not found but we have a number, still create event with generic name
          eventos.push({
            tipo: 'entrada',
            fecha: batch.entryDate,
            batchId: batch.id,
            batch,
            siloNombre: `Silo ${siloOriginal}`,
          });
        }
      }

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

      // Eventos de actualización de cantidad
      if (batch.historialActualizaciones && batch.historialActualizaciones.length > 0) {
        batch.historialActualizaciones.forEach((actualizacion: ActualizacionCantidad) => {
          const siloUpdateObj = silos.find(s => s.number === actualizacion.siloNumero);
          eventos.push({
            tipo: 'actualizacion',
            fecha: actualizacion.fecha,
            batchId: batch.id,
            batch,
            cantidadAnterior: actualizacion.cantidadAnterior,
            cantidadNueva: actualizacion.cantidadNueva,
            cantidadCambio: actualizacion.cantidadCambio,
            siloNumero: actualizacion.siloNumero,
            siloNombre: siloUpdateObj?.nombre 
              ? `Silo ${siloUpdateObj.number} (${siloUpdateObj.nombre})` 
              : `Silo ${actualizacion.siloNumero}`,
            notas: actualizacion.notas,
          });
        });
      }
    });

    // Agregar eventos de fumigación
    fumigaciones.forEach((fumigacion: FumigacionSilo) => {
      if (fumigacion.batchId) {
        // Buscar el batch correspondiente (tanto en silos como desconectados)
        const batchFumigacion = silos
          .flatMap(s => s.batches)
          .concat(batchesDisconnected)
          .find(b => b.id === fumigacion.batchId);
        
        if (batchFumigacion) {
          const siloFumigacion = silos.find(s => {
            const siloNum = parseInt(fumigacion.silo.replace('AP-', ''));
            return s.number === siloNum;
          });
          
          eventos.push({
            tipo: 'fumigacion',
            fecha: fumigacion.fechaFumigacion,
            batchId: fumigacion.batchId,
            batch: batchFumigacion,
            siloNombre: siloFumigacion?.nombre 
              ? `Silo ${siloFumigacion.number} (${siloFumigacion.nombre})` 
              : fumigacion.silo,
            fumigacion,
          });
        }
      }
    });

    // Ordenar por fecha (más reciente primero)
    return eventos.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [silos, fumigaciones, batchesDisconnected]);

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
          // Para eventos de entrada, verificar si el siloNombre corresponde al silo filtrado
          const siloFiltrado = silos.find(s => s.id === filtroSilo);
          if (siloFiltrado) {
            const siloNombreEsperado = siloFiltrado.nombre 
              ? `Silo ${siloFiltrado.number} (${siloFiltrado.nombre})` 
              : `Silo ${siloFiltrado.number}`;
            if (evento.siloNombre !== siloNombreEsperado) return false;
          }
        } else if (evento.tipo === 'movimiento') {
          const siloOrigen = silos.find(s => s.number === evento.siloOrigen);
          const siloDestino = silos.find(s => s.number === evento.siloDestino);
          if (siloOrigen?.id !== filtroSilo && siloDestino?.id !== filtroSilo) {
            return false;
          }
        } else if (evento.tipo === 'actualizacion') {
          const siloUpdate = silos.find(s => s.number === evento.siloNumero);
          if (siloUpdate?.id !== filtroSilo) {
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
  const totalActualizaciones = eventosHistorial.filter(e => e.tipo === 'actualizacion').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <History size={32} />
                Movimientos
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
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Actualizaciones</p>
                <p className="text-2xl font-bold text-amber-600">{totalActualizaciones}</p>
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
                onChange={(e) => setFiltroTipo(e.target.value as 'todos' | 'entrada' | 'movimiento' | 'actualizacion' | 'fumigacion')}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos los eventos</option>
                <option value="entrada">Solo entradas</option>
                <option value="movimiento">Solo movimientos</option>
                <option value="actualizacion">Solo actualizaciones</option>
                <option value="fumigacion">Solo fumigaciones</option>
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
                {Array.from(new Set([
                  ...silos.flatMap(s => s.batches.map(b => b.id)),
                  ...batchesDisconnected.map(b => b.id)
                ]))
                  .map(batchId => {
                    const batch = silos.flatMap(s => s.batches).concat(batchesDisconnected).find(b => b.id === batchId);
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
                          : evento.tipo === 'movimiento'
                          ? 'bg-blue-100 text-blue-700'
                          : evento.tipo === 'fumigacion'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {evento.tipo === 'entrada' ? (
                          <History size={20} />
                        ) : evento.tipo === 'movimiento' ? (
                          <ArrowRight size={20} />
                        ) : evento.tipo === 'fumigacion' ? (
                          <Bug size={20} />
                        ) : (
                          <Edit size={20} />
                        )}
                      </div>

                      {/* Información del evento */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            evento.tipo === 'entrada'
                              ? 'bg-emerald-100 text-emerald-700'
                              : evento.tipo === 'movimiento'
                              ? 'bg-blue-100 text-blue-700'
                              : evento.tipo === 'fumigacion'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {evento.tipo === 'entrada' 
                              ? 'ENTRADA' 
                              : evento.tipo === 'movimiento' 
                              ? 'MOVIMIENTO' 
                              : evento.tipo === 'fumigacion'
                              ? 'FUMIGACIÓN'
                              : 'ACTUALIZACIÓN'}
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
                              {evento.tipo === 'actualizacion' 
                                ? `${evento.cantidadNueva}`
                                : (evento.cantidad || batch.quantity)}{' '}
                              {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                              {evento.tipo === 'actualizacion' && evento.cantidadAnterior !== undefined && (
                                <span className="text-gray-500 ml-2">
                                  (antes: {evento.cantidadAnterior} {batch.unit === 'tonnes' ? 'ton' : 'kg'})
                                </span>
                              )}
                            </p>
                            {evento.tipo === 'actualizacion' && evento.cantidadCambio !== undefined && (
                              <p className={`text-sm font-medium ${
                                evento.cantidadCambio < 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {evento.cantidadCambio > 0 ? '+' : ''}{evento.cantidadCambio} {batch.unit === 'tonnes' ? 'ton' : 'kg'}
                                {evento.cantidadCambio < 0 && ' (Despacho)'}
                                {evento.cantidadCambio > 0 && ' (Aumento)'}
                              </p>
                            )}
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
                            {evento.tipo === 'actualizacion' && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Silo:</span>{' '}
                                {evento.siloNombre || `Silo ${evento.siloNumero}`}
                              </p>
                            )}
                            {evento.tipo === 'fumigacion' && evento.fumigacion && (
                              <div className="text-sm text-gray-600">
                                <p>
                                  <span className="font-medium">Silo:</span>{' '}
                                  {evento.siloNombre || evento.fumigacion.silo}
                                </p>
                                <p>
                                  <span className="font-medium">Producto:</span>{' '}
                                  {evento.fumigacion.productoUtilizado || 'N/A'}
                                </p>
                                {evento.fumigacion.dosis && (
                                  <p>
                                    <span className="font-medium">Dosis:</span>{' '}
                                    {evento.fumigacion.dosis} {evento.fumigacion.unidadMedida || ''}
                                  </p>
                                )}
                                {evento.fumigacion.tecnico && (
                                  <p>
                                    <span className="font-medium">Técnico:</span>{' '}
                                    {evento.fumigacion.tecnico}
                                  </p>
                                )}
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
                        {evento.tipo === 'fumigacion' && evento.fumigacion?.notas && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <span className="font-medium">Notas:</span> {evento.fumigacion.notas}
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

