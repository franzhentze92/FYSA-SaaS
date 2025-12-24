import React, { useMemo } from 'react';
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Activity, 
  TrendingDown, 
  Bug,
  Warehouse,
  AlertCircle,
  CheckCircle2,
  FileText,
  Ship
} from 'lucide-react';
import { useMonitoreoGranos } from '@/hooks/useMonitoreoGranos';
import { useSilos } from '@/hooks/useSilos';
import { useFumigacionSilos } from '@/hooks/useFumigacionSilos';
import { supabase } from '@/lib/supabase';
import { HistorialPerdidaSilo } from '@/types/monitoreoGranos';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '@/services/userService';

const DashboardMonitoreoGranos: React.FC = () => {
  const { muestreos, loading: muestreosLoading } = useMonitoreoGranos();
  const { silos, loading: silosLoading } = useSilos();
  const { fumigaciones, loading: fumigacionesLoading } = useFumigacionSilos();
  const [historial, setHistorial] = React.useState<HistorialPerdidaSilo[]>([]);
  const [historialLoading, setHistorialLoading] = React.useState(true);

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || '';

  // Fetch historial data
  React.useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setHistorialLoading(true);
        const { data: historialData, error } = await supabase
          .from('historial_perdidas_silos')
          .select('*')
          .order('fecha_semana', { ascending: false });

        if (error) throw error;

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
      } catch (error) {
        console.error('Error fetching historial:', error);
      } finally {
        setHistorialLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  // Calculate summary statistics
  const stats = useMemo(() => {
    // Total muestreos
    const totalMuestreos = muestreos.length;

    // Total silos con grano (silos that have batches)
    const silosConGrano = silos.filter(silo => silo.batches.length > 0).length;

    // Total fumigaciones
    const totalFumigaciones = fumigaciones.length;

    // Pérdida económica total acumulada (sum from historial)
    const perdidaEconomicaTotal = historial.reduce(
      (sum, h) => sum + (h.perdidaEconomicaSemanal || 0),
      0
    );

    // Ácido úrico total acumulado (sum from historial)
    const acidoUricoTotal = historial.reduce(
      (sum, h) => sum + (h.acidoUrico || 0),
      0
    );

    // Total batches activos
    const totalBatches = silos.reduce((sum, silo) => sum + silo.batches.length, 0);

    // Último muestreo registrado
    const ultimoMuestreo = muestreos.length > 0 
      ? muestreos.sort((a, b) => {
          const fechaA = a.fechaServicio ? new Date(a.fechaServicio).getTime() : 0;
          const fechaB = b.fechaServicio ? new Date(b.fechaServicio).getTime() : 0;
          return fechaB - fechaA;
        })[0]
      : null;

    // Silos que necesitan fumigación (días > 45 y tienen pérdidas)
    const SERVICIO_GASIFICACION_ID = 136257;
    const ultimaFumigacionPorSilo: Record<string, Date> = {};
    
    fumigaciones
      .filter(f => f.servicioId === SERVICIO_GASIFICACION_ID && f.fechaFumigacion)
      .forEach(f => {
        const siloKey = f.silo;
        try {
          const fechaFumigacion = new Date(f.fechaFumigacion);
          if (!isNaN(fechaFumigacion.getTime())) {
            const fechaExistente = ultimaFumigacionPorSilo[siloKey];
            if (!fechaExistente || fechaFumigacion > fechaExistente) {
              ultimaFumigacionPorSilo[siloKey] = fechaFumigacion;
            }
          }
        } catch (error) {
          console.error(`Error parsing fumigation date for silo ${siloKey}:`, error);
        }
      });

    // Solo considerar silos con batches activos (igual que recomendaciones)
    const silosConBatchesActivos = new Set<string>();
    silos.forEach(silo => {
      if (silo.batches.length > 0) {
        const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
        silosConBatchesActivos.add(siloKey);
      }
    });

    // Crear un mapa de batches actuales por silo (para filtrar historial)
    const batchesPorSilo = new Map<string, Set<string>>();
    silos.forEach(silo => {
      const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
      const batchIds = new Set(silo.batches.map(b => b.id));
      if (batchIds.size > 0) {
        batchesPorSilo.set(siloKey, batchIds);
      }
    });

    // Calcular datos acumulados solo para batches actuales (igual que recomendaciones)
    const silosNecesitanFumigacion = Array.from(silosConBatchesActivos).filter(siloKey => {
      const ultimaFumigacion = ultimaFumigacionPorSilo[siloKey];
      
      // Filtrar historial solo para batches actuales en este silo
      const currentBatches = batchesPorSilo.get(siloKey);
      if (!currentBatches || currentBatches.size === 0) {
        return false;
      }
      
      const historialSilo = historial.filter(h => {
        if (h.silo !== siloKey) return false;
        if (!h.batchId) return false;
        return currentBatches.has(h.batchId);
      });
      
      const perdidaTotal = historialSilo.reduce((sum, h) => sum + (h.perdidaEconomicaSemanal || 0), 0);
      const acidoUricoSilo = historialSilo.reduce((sum, h) => sum + (h.acidoUrico || 0), 0);
      
      if (!ultimaFumigacion) {
        // Sin registro de fumigación - verificar si tiene pérdidas o ácido úrico alto
        const tienePerdidaModeradaAlta = perdidaTotal > 5000;
        const tieneAcidoUricoModeradoAlto = acidoUricoSilo > 5;
        return tienePerdidaModeradaAlta || tieneAcidoUricoModeradoAlto;
      }
      
      const hoy = new Date();
      const diffTime = hoy.getTime() - ultimaFumigacion.getTime();
      const diasDesdeFumigacion = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      if (diasDesdeFumigacion > 45) {
        // Días > 45: necesita pérdidas económicas > 0 AND ácido úrico > 0
        return perdidaTotal > 0 && acidoUricoSilo > 0;
      }
      
      return false;
    }).length;

    // Breakdown por tipo de grano
    const tiposGrano = new Set<string>();
    const batchesPorTipoGrano: Record<string, number> = {};
    const toneladasPorTipoGrano: Record<string, number> = {};

    silos.forEach(silo => {
      silo.batches.forEach(batch => {
        const tipoGrano = batch.grainType || 'Desconocido';
        tiposGrano.add(tipoGrano);
        batchesPorTipoGrano[tipoGrano] = (batchesPorTipoGrano[tipoGrano] || 0) + 1;
        const cantidad = batch.unit === 'tonnes' ? batch.quantity : batch.quantity / 1000;
        toneladasPorTipoGrano[tipoGrano] = (toneladasPorTipoGrano[tipoGrano] || 0) + cantidad;
      });
    });

    // Muestreos por mes (últimos 6 meses)
    const ahora = new Date();
    const muestreosPorMes: Record<string, number> = {};
    muestreos.forEach(muestreo => {
      if (muestreo.fechaServicio) {
        const fecha = new Date(muestreo.fechaServicio);
        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
        muestreosPorMes[mesKey] = (muestreosPorMes[mesKey] || 0) + 1;
      }
    });

    // Total toneladas almacenadas
    const totalToneladas = silos.reduce((sum, silo) => {
      const toneladasSilo = silo.batches.reduce((batchSum, batch) => {
        const cantidad = batch.unit === 'tonnes' ? batch.quantity : batch.quantity / 1000;
        return batchSum + cantidad;
      }, 0);
      return sum + toneladasSilo;
    }, 0);

    return {
      totalMuestreos,
      silosConGrano,
      totalFumigaciones,
      perdidaEconomicaTotal,
      acidoUricoTotal,
      totalBatches,
      ultimoMuestreo,
      silosNecesitanFumigacion,
      tiposGrano: Array.from(tiposGrano),
      batchesPorTipoGrano,
      toneladasPorTipoGrano,
      muestreosPorMes,
      totalToneladas,
    };
  }, [muestreos, silos, fumigaciones, historial]);

  const loading = muestreosLoading || silosLoading || fumigacionesLoading || historialLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 size={32} />
            Dashboard de Monitoreo de Granos
          </h1>
          <p className="text-gray-600 mt-2">
            Resumen general de la sección de monitoreo de granos
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Muestreos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total de Muestreos</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalMuestreos}</p>
                    <p className="text-xs text-gray-400 mt-1">Reportes registrados</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Silos con Grano */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Silos con Grano</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.silosConGrano}</p>
                    <p className="text-xs text-gray-400 mt-1">De {silos.length} silos totales</p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <Warehouse className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Pérdida Económica Total */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pérdida Económica Total</p>
                    <p className="text-3xl font-bold text-orange-600">
                      Q. {Math.round(stats.perdidaEconomicaTotal).toLocaleString('es-GT')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Acumulada</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>

              {/* Ácido Úrico Total */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Ácido Úrico Total</p>
                    <p className="text-3xl font-bold text-red-600">
                      {stats.acidoUricoTotal.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">mg/100g acumulado</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <Activity className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Total Fumigaciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Fumigaciones</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalFumigaciones}</p>
                    <p className="text-xs text-gray-400 mt-1">Registradas</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Bug className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Total Batches */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total de Batches</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBatches}</p>
                    <p className="text-xs text-gray-400 mt-1">Batches activos</p>
                  </div>
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Package className="h-6 w-6 text-indigo-600" />
                  </div>
                </div>
              </div>

              {/* Silos que Necesitan Fumigación */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Silos que Necesitan Fumigación</p>
                    <p className="text-3xl font-bold text-red-600">{stats.silosNecesitanFumigacion}</p>
                    <p className="text-xs text-gray-400 mt-1">Requieren atención</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              {/* Último Muestreo */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Último Muestreo</p>
                    <p className="text-xl font-bold text-gray-900">
                      {stats.ultimoMuestreo 
                        ? format(new Date(stats.ultimoMuestreo.fechaServicio || stats.ultimoMuestreo.fechaReporte), 'dd/MM/yyyy', { locale: es })
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.ultimoMuestreo ? `Reporte #${stats.ultimoMuestreo.numeroReporte}` : 'Sin muestreos'}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Breakdown por Tipo de Grano */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Package size={20} />
                    Granos Almacenados
                  </h2>
                  <Link to="/admin/silos-lotes" className="text-xs text-blue-600 hover:text-blue-700">
                    Ver detalles
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="text-xs text-gray-500 mb-1">Total de Toneladas</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(stats.totalToneladas).toLocaleString('es-GT')} T
                    </div>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.tiposGrano.length > 0 ? (
                      stats.tiposGrano.map((tipo) => (
                        <div key={tipo} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{tipo}</div>
                            <div className="text-xs text-gray-500">
                              {stats.batchesPorTipoGrano[tipo] || 0} batch{stats.batchesPorTipoGrano[tipo] !== 1 ? 'es' : ''}
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm font-bold text-gray-900">
                              {Math.round(stats.toneladasPorTipoGrano[tipo] || 0).toLocaleString('es-GT')} T
                            </div>
                            <div className="text-xs text-gray-500">
                              {stats.totalToneladas > 0 
                                ? Math.round(((stats.toneladasPorTipoGrano[tipo] || 0) / stats.totalToneladas) * 100)
                                : 0}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No hay granos almacenados</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumen de Fumigaciones */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Bug size={20} />
                    Fumigaciones
                  </h2>
                  <Link to="/admin/fumigacion-silos" className="text-xs text-blue-600 hover:text-blue-700">
                    Ver todas
                  </Link>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="text-xs text-gray-500 mb-1">Total Fumigaciones</div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalFumigaciones}</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-xs text-gray-500 mb-1">Silos que Necesitan</div>
                      <div className="text-2xl font-bold text-red-600">{stats.silosNecesitanFumigacion}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-gray-500 mb-2">Últimas Fumigaciones</div>
                    <div className="space-y-2">
                      {fumigaciones
                        .sort((a, b) => new Date(b.fechaFumigacion).getTime() - new Date(a.fechaFumigacion).getTime())
                        .slice(0, 5)
                        .map((fumigacion) => (
                          <div key={fumigacion.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{fumigacion.silo}</div>
                              <div className="text-xs text-gray-500">{fumigacion.tipoGrano}</div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(fumigacion.fechaFumigacion), 'dd/MM/yyyy')}
                            </div>
                          </div>
                        ))}
                      {fumigaciones.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No hay fumigaciones registradas</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Link
                  to="/admin/silos-lotes"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Warehouse className="h-5 w-5 text-emerald-600" />
                  <span className="font-medium text-gray-900">Silos y Granos</span>
                </Link>
                <Link
                  to="/historial-lotes"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingDown className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Movimientos</span>
                </Link>
                <Link
                  to="/admin/monitoreo-granos-ap"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Muestreos</span>
                </Link>
                <Link
                  to="/admin/fumigacion-silos"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bug className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">Fumigación de Silos</span>
                </Link>
                <Link
                  to="/admin/historial-perdida"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Trazabilidad</span>
                </Link>
                <Link
                  to="/perdida-economica"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-gray-900">Análisis de Pérdidas</span>
                </Link>
                <Link
                  to="/admin/fondeo-barcos"
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Ship className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-gray-900">Fondeo de Barcos</span>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardMonitoreoGranos;

