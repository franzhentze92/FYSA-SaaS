import React, { useState, useMemo } from 'react';
import { TrendingDown, Package, Search, Calendar, DollarSign, Activity, Ship, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { HistorialPerdidaSilo } from '@/types/monitoreoGranos';
import { GrainBatch } from '@/types/grain';
import { useFumigacionSilos } from '@/hooks/useFumigacionSilos';
import { useSilos } from '@/hooks/useSilos';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HistorialPerdida: React.FC = () => {
  const [historial, setHistorial] = useState<HistorialPerdidaSilo[]>([]);
  const [batches, setBatches] = useState<Map<string, GrainBatch>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroBatch, setFiltroBatch] = useState<string>('todos');
  const [filtroTipoGrano, setFiltroTipoGrano] = useState<string>('todos');
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const { fumigaciones } = useFumigacionSilos();
  const { silos } = useSilos();
  const { clientes } = useAdminServicios();
  
  // Verificar si el usuario es admin
  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || '';

  // ID del servicio "Gas. y Encarpado"
  const SERVICIO_GASIFICACION_ID = 136257;
  
  // Obtener silos del cliente si no es admin
  const silosDelCliente = useMemo(() => {
    if (isAdmin) return silos;
    return silos.filter(s => s.clienteEmail === userEmail);
  }, [silos, isAdmin, userEmail]);
  
  // Obtener números de silo del cliente (ej: "AP-01", "AP-02")
  const silosDelClienteNumeros = useMemo(() => {
    return new Set(silosDelCliente.map(s => `AP-${s.number.toString().padStart(2, '0')}`));
  }, [silosDelCliente]);

  // Fetch historial y batches desde Supabase
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch historial
        const { data: historialData, error: historialError } = await supabase
          .from('historial_perdidas_silos')
          .select('*')
          .order('fecha_semana', { ascending: false });

        if (historialError) throw historialError;

        const formattedData: HistorialPerdidaSilo[] = (historialData || []).map((item: any) => ({
          id: item.id,
          muestreoId: item.muestreo_id,
          batchId: item.batch_id || null,
          silo: item.silo,
          fechaSemana: item.fecha_semana,
          tipoGrano: item.tipo_grano,
          totalGorgojosVivos: item.total_gorgojos_vivos || 0,
          totalPiojillo: item.total_piojillo || 0,
          totalTons: item.total_tons || 0,
          acidoUrico: item.acido_urico || 0,
          danoGorgojosAdultosKg: item.dano_gorgojos_adultos_kg || 0,
          danoGorgojosTotalKg: item.dano_gorgojos_total_kg || 0,
          danoPiojilloKg: item.dano_piojillo_kg || 0,
          danoTotalPlagaKg: item.dano_total_plaga_kg || 0,
          perdidaEconomicaSemanal: item.perdida_economica_semanal || 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setHistorial(formattedData);

        // Fetch batches
        const { data: batchesData, error: batchesError } = await supabase
          .from('grain_batches')
          .select('*');

        if (batchesError) throw batchesError;

        // Fetch movements for batches
        const { data: movementsData } = await supabase
          .from('batch_movements')
          .select('*')
          .order('fecha', { ascending: true });

        const batchesMap = new Map<string, GrainBatch>();
        (batchesData || []).forEach((b: any) => {
          const batchMovements = (movementsData || [])
            .filter((m: any) => m.batch_id === b.id)
            .map((m: any) => ({
              fecha: m.fecha,
              siloOrigen: m.silo_origen,
              siloDestino: m.silo_destino,
              cantidad: m.cantidad,
              notas: m.notas,
            }));

          batchesMap.set(b.id, {
            id: b.id,
            barcoId: b.barco_id || '',
            granoId: b.grano_id || '',
            variedadId: b.variedad_id,
            grainType: b.grain_type,
            grainSubtype: b.grain_subtype,
            quantity: Number(b.quantity),
            unit: b.unit || 'tonnes',
            entryDate: b.entry_date,
            origin: b.origin,
            notes: b.notes,
            siloActual: b.silo_actual,
            historialMovimientos: batchMovements,
          });
        });

        setBatches(batchesMap);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Suscripción para cambios en tiempo real
    const subscription = supabase
      .channel('historial-perdidas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historial_perdidas_silos' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grain_batches' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Obtener batches únicos para el filtro
  const batchesUnicos = useMemo(() => {
    const batchIds = new Set(historial.filter(h => h.batchId).map(h => h.batchId!));
    return Array.from(batchIds);
  }, [historial]);

  // Obtener tipos de grano únicos para el filtro
  const tiposGranoUnicos = useMemo(() => {
    const tipos = new Set(historial.filter(h => h.tipoGrano).map(h => h.tipoGrano!));
    return Array.from(tipos).sort();
  }, [historial]);

  // Obtener clientes únicos para el filtro (basado en los silos de los batches)
  const clientesUnicos = useMemo(() => {
    if (!isAdmin) return [];
    const clientesMap = new Map<string, string>(); // email -> nombre
    historial.forEach(h => {
      const siloNum = parseInt(h.silo.replace('AP-', ''));
      const siloEncontrado = silos.find(s => s.number === siloNum);
      if (siloEncontrado?.clienteEmail) {
        const cliente = clientes.find(c => c.email === siloEncontrado.clienteEmail);
        if (cliente) {
          clientesMap.set(cliente.email, cliente.nombre);
        }
      }
    });
    return Array.from(clientesMap.entries())
      .map(([email, nombre]) => ({ email, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [historial, silos, clientes, isAdmin]);

  // Filtrar historial
  const historialFiltrado = useMemo(() => {
    return historial.filter(item => {
      // Si no es admin, filtrar solo por silos del cliente
      if (!isAdmin && !silosDelClienteNumeros.has(item.silo)) {
        return false;
      }

      // Filtro por cliente (solo para admin)
      if (isAdmin && filtroCliente) {
        const siloNum = parseInt(item.silo.replace('AP-', ''));
        const siloEncontrado = silos.find(s => s.number === siloNum);
        if (siloEncontrado?.clienteEmail !== filtroCliente) {
          return false;
        }
      }

      // Filtro por batch
      if (filtroBatch !== 'todos') {
        if (!item.batchId || item.batchId !== filtroBatch) {
          return false;
        }
      }

      // Filtro por tipo de grano
      if (filtroTipoGrano !== 'todos' && item.tipoGrano !== filtroTipoGrano) {
        return false;
      }

      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const batch = item.batchId ? batches.get(item.batchId) : null;
        return (
          item.silo.toLowerCase().includes(query) ||
          item.tipoGrano?.toLowerCase().includes(query) ||
          batch?.origin?.toLowerCase().includes(query) ||
          batch?.grainType?.toLowerCase().includes(query) ||
          item.batchId?.toLowerCase().includes(query) ||
          format(new Date(item.fechaSemana), 'dd/MM/yyyy', { locale: es }).includes(query)
        );
      }

      return true;
    });
  }, [historial, filtroBatch, filtroTipoGrano, filtroCliente, searchQuery, batches, isAdmin, silosDelClienteNumeros, silos]);

  // Agrupar por batch para mostrar resumen acumulado
  const resumenPorBatch = useMemo(() => {
    const grupos: Record<string, HistorialPerdidaSilo[]> = {};
    
    historialFiltrado.forEach(item => {
      // Solo agrupar items con batchId
      if (item.batchId) {
        if (!grupos[item.batchId]) {
          grupos[item.batchId] = [];
        }
        grupos[item.batchId].push(item);
      }
    });

    // Calcular acumulados por batch
    const resumen = Object.entries(grupos)
      .map(([batchId, registros]) => {
        // Ordenar registros por fecha (más antiguo primero para calcular desde entrada)
        const registrosOrdenados = [...registros].sort((a, b) => 
          new Date(a.fechaSemana).getTime() - new Date(b.fechaSemana).getTime()
        );

        const perdidaTotalAcumulada = registrosOrdenados.reduce((sum, r) => sum + r.perdidaEconomicaSemanal, 0);
        const acidoUricoPromedio = registrosOrdenados.reduce((sum, r) => sum + r.acidoUrico, 0);
        const danoTotalAcumulado = registrosOrdenados.reduce((sum, r) => sum + r.danoTotalPlagaKg, 0);
        const batch = batches.get(batchId);
        
        // Calcular días almacenados: fecha del muestreo más reciente - fecha de entrada
        const ultimaFecha = registrosOrdenados[registrosOrdenados.length - 1]?.fechaSemana;
        const fechaEntrada = batch?.entryDate;
        let diasAlmacenados: number | null = null; // null si no hay muestreo o fecha de entrada
        
        if (ultimaFecha && fechaEntrada) {
          const fechaMuestreo = new Date(ultimaFecha);
          const fechaEntradaDate = new Date(fechaEntrada);
          
          // Calcular diferencia de días
          if (fechaMuestreo >= fechaEntradaDate) {
            const diffTime = fechaMuestreo.getTime() - fechaEntradaDate.getTime();
            diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          } else {
            // If muestreo date is before entry date, something is wrong - log and return null
            console.warn(`Warning: muestreo date (${ultimaFecha}) is before entry date (${fechaEntrada}) for batch ${batchId}`);
            diasAlmacenados = null;
          }
        }
        
        // Buscar la última fumigación de "Gas. y Encarpado" para este batch
        const fumigacionesBatch = fumigaciones
          .filter(f => f.batchId === batchId && f.servicioId === SERVICIO_GASIFICACION_ID)
          .sort((a, b) => new Date(b.fechaFumigacion).getTime() - new Date(a.fechaFumigacion).getTime());
        const ultimaFumigacion = fumigacionesBatch.length > 0 ? fumigacionesBatch[0].fechaFumigacion : null;
        
        // Encontrar el silo actual donde está el batch
        const siloActualObj = silos.find(silo => 
          silo.batches.some(b => b.id === batchId)
        );
        const siloActualReal = siloActualObj?.number || batch?.siloActual || 999;
        
        return {
          batchId,
          batch,
          cantidadRegistros: registrosOrdenados.length,
          perdidaTotalAcumulada,
          acidoUricoPromedio,
          danoTotalAcumulado,
          diasAlmacenados: diasAlmacenados ?? 0, // Convert null to 0 for backward compatibility
          primeraFecha: registrosOrdenados[0]?.fechaSemana || '',
          ultimaFecha: ultimaFecha || '',
          tieneMuestreo: !!ultimaFecha, // Flag to know if we have a muestreo date
          ultimaFumigacion, // Fecha de la última fumigación de Gas. y Encarpado
          siloActualReal, // Silo actual real donde está el batch
        };
      })
      .filter(item => {
        // Solo incluir batches que existen Y que están actualmente en algún silo
        if (!item.batch) return false;
        
        // Verificar si el batch está actualmente en algún silo
        const batchEstaEnSilo = silos.some(silo => 
          silo.batches.some(b => b.id === item.batchId)
        );
        
        return batchEstaEnSilo;
      })
      .sort((a, b) => {
        // Ordenar por número de silo actual (menor a mayor)
        return a.siloActualReal - b.siloActualReal;
      })

    return resumen;
  }, [historialFiltrado, batches, fumigaciones, silos]);

  // Toggle expand/collapse for a week
  const toggleWeek = (fecha: string) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fecha)) {
        newSet.delete(fecha);
      } else {
        newSet.add(fecha);
      }
      return newSet;
    });
  };

  // Agrupar por semana para mostrar registros
  const registrosPorSemana = useMemo(() => {
    const grupos: Record<string, HistorialPerdidaSilo[]> = {};
    
    historialFiltrado.forEach(item => {
      const semana = item.fechaSemana;
      if (!grupos[semana]) {
        grupos[semana] = [];
      }
      grupos[semana].push(item);
    });

    // Ordenar por fecha (más reciente primero)
    return Object.entries(grupos)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([fecha, registros]) => {
        // Ordenar registros por número de silo (menor a mayor)
        const registrosOrdenados = registros.sort((a, b) => {
          const numA = parseInt(a.silo.replace('AP-', '')) || 999;
          const numB = parseInt(b.silo.replace('AP-', '')) || 999;
          return numA - numB;
        });
        return {
          fecha,
          registros: registrosOrdenados,
        };
      });
  }, [historialFiltrado]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingDown size={32} />
            Historial Pérdida
          </h1>
          <p className="text-gray-600 mt-2">
            Trazabilidad de pérdidas económicas y ácido úrico por batch de grano. Las pérdidas se acumulan por batch desde su llegada en el barco, independientemente del silo donde se encuentre.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por batch ID, barco, tipo de grano, silo, fecha..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <select
              value={filtroBatch}
              onChange={(e) => setFiltroBatch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los batches</option>
              {batchesUnicos.map(batchId => {
                const batch = batches.get(batchId);
                if (!batch) return null;
                return (
                  <option key={batchId} value={batchId}>
                    {batch.origin || 'Sin origen'} - {batch.grainType} {batch.grainSubtype ? `(${batch.grainSubtype})` : ''} - {batchId.substring(0, 8).toUpperCase()}
                  </option>
                );
              })}
            </select>
            <select
              value={filtroTipoGrano}
              onChange={(e) => setFiltroTipoGrano(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos los tipos de grano</option>
              {tiposGranoUnicos.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            {/* Filtro por cliente - Solo visible para admin */}
            {isAdmin && (
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos los clientes</option>
                {clientesUnicos.map(cliente => (
                  <option key={cliente.email} value={cliente.email}>{cliente.nombre}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Resumen Acumulado por Batch */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={24} />
            Resumen Acumulado por Batch (desde llegada en barco)
          </h2>
          {resumenPorBatch.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos para mostrar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Silo Actual
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barco / Origen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Grano
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Entrada
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Días Almacenados
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Fumigación
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Silos Recorridos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registros
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ácido Úrico Acumulado
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grano Total Consumido (kg)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pérdida Total Acumulada
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resumenPorBatch.map((resumen) => {
                    // Obtener silos únicos donde este batch ha tenido muestreos
                    const silosBatch = Array.from(new Set(
                      historialFiltrado
                        .filter(h => h.batchId === resumen.batchId)
                        .map(h => h.silo)
                    )).sort();
                    
                    // Usar el silo actual real calculado anteriormente
                    const siloActualNum = (resumen as any).siloActualReal || resumen.batch?.siloActual;
                    
                    // Obtener historial de movimientos del batch
                    const movimientos = resumen.batch?.historialMovimientos || [];
                    const todosLosSilos = new Set<number>();
                    if (siloActualNum) {
                      todosLosSilos.add(siloActualNum);
                    }
                    movimientos.forEach(mov => {
                      todosLosSilos.add(mov.siloOrigen);
                      todosLosSilos.add(mov.siloDestino);
                    });
                    const silosRecorridos = Array.from(todosLosSilos).sort((a, b) => a - b).map(s => `AP-${s.toString().padStart(2, '0')}`);

                    return (
                      <tr key={resumen.batchId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {siloActualNum ? `AP-${siloActualNum.toString().padStart(2, '0')}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {resumen.batchId.substring(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900 flex items-center gap-1">
                            <Ship size={14} className="text-gray-400" />
                            {resumen.batch?.origin || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {resumen.batch?.grainType || '-'}
                            {resumen.batch?.grainSubtype && (
                              <span className="text-gray-500 ml-1">({resumen.batch.grainSubtype})</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {resumen.batch?.entryDate ? format(new Date(resumen.batch.entryDate), 'dd/MM/yyyy', { locale: es }) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {resumen.tieneMuestreo && resumen.batch?.entryDate ? resumen.diasAlmacenados : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {resumen.ultimaFumigacion ? format(new Date(resumen.ultimaFumigacion), 'dd/MM/yyyy', { locale: es }) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {silosRecorridos.length > 0 ? (
                              silosRecorridos.map((silo, idx) => {
                                const siloActualStr = siloActualNum ? `AP-${siloActualNum.toString().padStart(2, '0')}` : '';
                                return (
                                  <span
                                    key={idx}
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      silo === siloActualStr
                                        ? 'bg-emerald-100 text-emerald-700 font-medium'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                    title={silo === siloActualStr ? 'Silo actual' : 'Silo anterior'}
                                  >
                                    {silo}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{resumen.cantidadRegistros}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">
                            {resumen.acidoUricoPromedio.toFixed(4)} mg/100g
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-700">
                            {resumen.danoTotalAcumulado.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-red-600">
                            Q{resumen.perdidaTotalAcumulada.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Registros Detallados por Semana - Mostrando trazabilidad */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Registros Semanales (Trazabilidad por Batch)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Cada registro muestra el batch que estaba en ese silo en el momento del muestreo. El batch puede haber estado en diferentes silos a lo largo del tiempo.
          </p>
          {registrosPorSemana.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay registros para mostrar</p>
          ) : (
            <div className="space-y-6">
              {registrosPorSemana.map(({ fecha, registros }) => {
                const isExpanded = expandedWeeks.has(fecha);
                return (
                  <div key={fecha} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="bg-gray-50 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleWeek(fecha)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown size={20} className="text-gray-500" />
                          ) : (
                            <ChevronRight size={20} className="text-gray-500" />
                          )}
                          Semana del {format(new Date(fecha), "dd 'de' MMMM, yyyy", { locale: es })}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {registros.length} {registros.length === 1 ? 'registro' : 'registros'}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Silo
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Batch ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Barco / Origen
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Tipo Grano
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Días Almacenados
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Piojillo
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Gorgojos Vivos
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Ácido Úrico (mg/100g)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Grano Total Consumido (kg)
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Pérdida Económica
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registros.map((registro) => {
                          const batch = registro.batchId ? batches.get(registro.batchId) : null;
                          
                          // Calcular días almacenados: fecha del muestreo - fecha de entrada del batch
                          let diasAlmacenados = 0;
                          if (registro.fechaSemana && batch?.entryDate) {
                            const fechaMuestreo = new Date(registro.fechaSemana);
                            const fechaEntrada = new Date(batch.entryDate);
                            if (fechaMuestreo >= fechaEntrada) {
                              const diffTime = fechaMuestreo.getTime() - fechaEntrada.getTime();
                              diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                            }
                          }
                          
                          return (
                            <tr key={registro.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="text-sm font-medium text-gray-900">{registro.silo}</span>
                              </td>
                              <td className="px-4 py-3">
                                {registro.batchId ? (
                                  <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {registro.batchId.substring(0, 8).toUpperCase()}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">{batch?.origin || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">{registro.tipoGrano || '-'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-sm text-gray-700">
                                  {registro.fechaSemana && batch?.entryDate ? diasAlmacenados : '-'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {registro.totalPiojillo.toLocaleString('es-GT')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-medium text-gray-900">
                                  {registro.totalGorgojosVivos.toLocaleString('es-GT')}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm text-gray-700">
                                  {registro.acidoUrico.toFixed(4)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm text-gray-700">
                                  {registro.danoTotalPlagaKg.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-semibold text-red-600">
                                  Q{registro.perdidaEconomicaSemanal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                    )}
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

export default HistorialPerdida;

