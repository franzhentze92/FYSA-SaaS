import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Receipt, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Map,
  Thermometer,
  Ship,
  Warehouse,
  BarChart3
} from 'lucide-react';
import { useAllReportes } from '@/hooks/useAllReportes';
import { useFacturas } from '@/hooks/useFacturas';
import { useDocumentacion } from '@/hooks/useDocumentacion';
import { useBarcos } from '@/hooks/useBarcos';
import { useSilos } from '@/hooks/useSilos';
import { getCurrentUser } from '@/services/userService';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface MapaCalor {
  id: string;
  fecha: string;
  archivoNombre: string;
  archivoUrl: string;
  tipo: 'control-roedores' | 'monitoreo-trampas-luz';
  fechaCreacion: string;
}

const Dashboard: React.FC = () => {
  const { reportes } = useAllReportes();
  const { facturas } = useFacturas();
  const { barcos } = useBarcos();
  const { silos } = useSilos();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || '';

  // Fetch all documentation types
  const { documentos: docsAuditoria } = useDocumentacion('auditoria', { clienteEmail: userEmail, isAdmin });
  const { documentos: docsTecnicos } = useDocumentacion('tecnicos', { clienteEmail: userEmail, isAdmin });
  const { documentos: docsCroquis } = useDocumentacion('croquis', { clienteEmail: userEmail, isAdmin });

  // Fetch heat maps
  const [mapasCalor, setMapasCalor] = useState<MapaCalor[]>([]);
  const [loadingMapas, setLoadingMapas] = useState(true);

  const fetchMapasCalor = useCallback(async () => {
    try {
      setLoadingMapas(true);
      let query = supabase
        .from('mapas_calor')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      // If not admin, filter by client email
      if (!isAdmin && userEmail) {
        query = query.eq('cliente_email', userEmail);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted: MapaCalor[] = (data || []).map(m => ({
        id: m.id,
        fecha: m.fecha,
        archivoNombre: m.archivo_nombre,
        archivoUrl: m.archivo_url,
        tipo: m.tipo as 'control-roedores' | 'monitoreo-trampas-luz',
        fechaCreacion: m.fecha_creacion,
      }));

      setMapasCalor(formatted);
    } catch (err) {
      console.error('Error fetching mapas calor:', err);
    } finally {
      setLoadingMapas(false);
    }
  }, [isAdmin, userEmail]);

  useEffect(() => {
    fetchMapasCalor();
  }, [fetchMapasCalor]);

  // Real-time subscription for heat maps
  useEffect(() => {
    const subscription = supabase
      .channel('dashboard-mapas-calor-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mapas_calor' }, () => {
        fetchMapasCalor();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMapasCalor]);

  // Estadísticas de Servicios
  const estadisticasServicios = useMemo(() => {
    const totalReportes = reportes.length;
    const reportesPorServicio = reportes.reduce((acc, r) => {
      acc[r.servicioTitulo] = (acc[r.servicioTitulo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReportes,
      reportesPorServicio,
    };
  }, [reportes]);

  // Estadísticas de Facturas
  const estadisticasFacturas = useMemo(() => {
    const totalFacturas = facturas.length;
    const reportesFacturados = new Set<string>();
    facturas.forEach(factura => {
      const reporteIds = factura.reporteIds || ((factura as any).reporteId ? [(factura as any).reporteId] : []);
      reporteIds.forEach(id => reportesFacturados.add(id));
    });
    const reportesSinFacturar = reportes.length - reportesFacturados.size;

    return {
      totalFacturas,
      reportesFacturados: reportesFacturados.size,
      reportesSinFacturar,
    };
  }, [facturas, reportes.length]);

  // Estadísticas de Mapas de Calor
  const estadisticasMapas = useMemo(() => {
    const total = mapasCalor.length;
    const controlRoedores = mapasCalor.filter(m => m.tipo === 'control-roedores').length;
    const monitoreoTrampas = mapasCalor.filter(m => m.tipo === 'monitoreo-trampas-luz').length;
    const esteMes = mapasCalor.filter(m => {
      const fecha = new Date(m.fechaCreacion);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;

    return {
      total,
      controlRoedores,
      monitoreoTrampas,
      esteMes,
    };
  }, [mapasCalor]);

  // Estadísticas de Documentación
  const estadisticasDocumentacion = useMemo(() => {
    const totalDocs = docsAuditoria.length + docsTecnicos.length + docsCroquis.length;
    return {
      total: totalDocs,
      auditoria: docsAuditoria.length,
      tecnicos: docsTecnicos.length,
      croquis: docsCroquis.length,
    };
  }, [docsAuditoria, docsTecnicos, docsCroquis]);

  // Estadísticas de Barcos
  const estadisticasBarcos = useMemo(() => {
    const barcosFiltrados = isAdmin ? barcos : barcos.filter(b => b.clienteEmail === userEmail);
    const totalBarcos = barcosFiltrados.length;
    const esteMes = barcosFiltrados.filter(b => {
      const fecha = new Date(b.fechaFondeo);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;
    const requiereTratamientoOIRSA = barcosFiltrados.filter(b => b.requiereTratamientoOIRSA).length;

    return {
      total: totalBarcos,
      esteMes,
      requiereTratamientoOIRSA,
    };
  }, [barcos, isAdmin, userEmail]);

  // Estadísticas de Silos
  const estadisticasSilos = useMemo(() => {
    const silosFiltrados = isAdmin ? silos : silos.filter(s => s.clienteEmail === userEmail);
    const totalSilos = silosFiltrados.length;
    const silosActivos = silosFiltrados.filter(s => s.batches.length > 0).length;
    const totalBatches = silosFiltrados.reduce((sum, silo) => sum + silo.batches.length, 0);
    const totalCapacidad = silosFiltrados.reduce((sum, silo) => sum + (silo.capacity || 0), 0);
    const capacidadUsada = silosFiltrados.reduce((sum, silo) => {
      const capacidadSilo = silo.batches.reduce((batchSum, batch) => {
        const cantidad = batch.unit === 'tonnes' ? batch.quantity : batch.quantity / 1000;
        return batchSum + cantidad;
      }, 0);
      return sum + capacidadSilo;
    }, 0);
    const porcentajeUso = totalCapacidad > 0 ? (capacidadUsada / totalCapacidad) * 100 : 0;

    return {
      total: totalSilos,
      activos: silosActivos,
      totalBatches,
      totalCapacidad,
      capacidadUsada,
      porcentajeUso,
    };
  }, [silos, isAdmin, userEmail]);

  // Actividad reciente
  const actividadReciente = useMemo(() => {
    const ultimosReportes = [...reportes]
      .sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime())
      .slice(0, 5);

    const ultimasFacturas = [...facturas]
      .sort((a, b) => new Date(b.fechaFactura).getTime() - new Date(a.fechaFactura).getTime())
      .slice(0, 5);

    const ultimosMapas = [...mapasCalor]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);

    const todosDocs = [...docsAuditoria, ...docsTecnicos, ...docsCroquis];
    const ultimosDocs = todosDocs
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5);

    return {
      ultimosReportes,
      ultimasFacturas,
      ultimosMapas,
      ultimosDocs,
    };
  }, [reportes, facturas, mapasCalor, docsAuditoria, docsTecnicos, docsCroquis]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenido, {currentUser?.nombre || 'Usuario'} 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Tu centro de gestión para servicios, facturas, mapas de calor, documentación y monitoreo de granos.
          </p>
        </div>

        {/* Quick Actions for Grain Monitoring */}
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BarChart3 size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Monitoreo de Granos</h2>
                <p className="text-sm text-gray-600">Acceso rápido al dashboard de monitoreo de granos</p>
              </div>
            </div>
            <Link 
              to="/admin/dashboard-monitoreo-granos" 
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Ver Dashboard
            </Link>
          </div>
        </div>

        {/* Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Reportes */}
          <Link to="/reportes-facturas" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList size={24} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasServicios.totalReportes}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Reportes de Servicios</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasFacturas.reportesFacturados} facturados
            </div>
          </Link>

          {/* Facturas */}
          <Link to="/facturas" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Receipt size={24} className="text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasFacturas.totalFacturas}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Facturas</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasFacturas.reportesSinFacturar} reportes sin facturar
            </div>
          </Link>

          {/* Mapas de Calor */}
          <Link to={isAdmin ? "/admin/mapas-calor" : "/mapas-calor/control-roedores"} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Thermometer size={24} className="text-red-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasMapas.total}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Mapas de Calor</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasMapas.controlRoedores} roedores • {estadisticasMapas.monitoreoTrampas} trampas
            </div>
          </Link>

          {/* Documentación */}
          <Link to="/documentacion" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText size={24} className="text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasDocumentacion.total}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Documentación</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasDocumentacion.auditoria} auditoría • {estadisticasDocumentacion.tecnicos} técnicos • {estadisticasDocumentacion.croquis} croquis
            </div>
          </Link>
        </div>

        {/* Additional Statistics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Barcos */}
          <Link to="/barcos" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Ship size={24} className="text-indigo-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasBarcos.total}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Barcos Fondeados</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasBarcos.esteMes} este mes • {estadisticasBarcos.requiereTratamientoOIRSA} requieren OIRSA
            </div>
          </Link>

          {/* Silos */}
          <Link to="/admin/silos-lotes" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Warehouse size={24} className="text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasSilos.activos}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Silos Activos</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasSilos.total} totales • {estadisticasSilos.totalBatches} batches • {estadisticasSilos.porcentajeUso.toFixed(1)}% capacidad
            </div>
          </Link>

          {/* Resumen de Servicios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardList size={24} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{Object.keys(estadisticasServicios.reportesPorServicio).length}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Tipos de Servicios</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasServicios.totalReportes} reportes totales
            </div>
          </div>

          {/* Resumen de Facturación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp size={24} className="text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                {estadisticasFacturas.totalFacturas > 0 
                  ? Math.round((estadisticasFacturas.reportesFacturados / reportes.length) * 100)
                  : 0}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">Tasa de Facturación</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasFacturas.reportesFacturados} de {reportes.length} reportes
            </div>
          </div>
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Estado de Facturación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} />
                Estado de Facturación
              </h2>
              <Link to="/facturas" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todas
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">Reportes Facturados</span>
                </div>
                <span className="text-lg font-bold text-emerald-900">{estadisticasFacturas.reportesFacturados}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-sm font-medium text-amber-900">Sin Facturar</span>
                </div>
                <span className="text-lg font-bold text-amber-900">{estadisticasFacturas.reportesSinFacturar}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-1">Total de Facturas</div>
                <div className="text-2xl font-bold text-gray-900">{estadisticasFacturas.totalFacturas}</div>
              </div>
            </div>
          </div>

          {/* Resumen de Mapas de Calor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Map size={20} />
                Mapas de Calor
              </h2>
              <Link to={isAdmin ? "/admin/mapas-calor" : "/mapas-calor/control-roedores"} className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs text-gray-500 mb-1">Control de Roedores</div>
                  <div className="text-xl font-bold text-gray-900">{estadisticasMapas.controlRoedores}</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-xs text-gray-500 mb-1">Trampas de Luz</div>
                  <div className="text-xl font-bold text-gray-900">{estadisticasMapas.monitoreoTrampas}</div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-1">Este Mes</div>
                <div className="text-2xl font-bold text-gray-900">{estadisticasMapas.esteMes}</div>
              </div>
            </div>
          </div>

          {/* Desglose de Servicios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList size={20} />
                Servicios por Tipo
              </h2>
              <Link to="/reportes-facturas" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {Object.entries(estadisticasServicios.reportesPorServicio)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([servicio, count]) => (
                  <div key={servicio} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {servicio}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-sm font-bold text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500 ml-1">reporte{count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              {Object.keys(estadisticasServicios.reportesPorServicio).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay servicios registrados</p>
              )}
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Últimos Reportes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardList size={20} />
                Últimos Reportes
              </h2>
              <Link to="/reportes-facturas" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {actividadReciente.ultimosReportes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay reportes registrados</p>
              ) : (
                actividadReciente.ultimosReportes.map((reporte) => (
                  <div key={reporte.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {reporte.numeroReporte}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {reporte.servicioTitulo}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(reporte.fechaServicio), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Últimas Facturas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt size={20} />
                Últimas Facturas
              </h2>
              <Link to="/facturas" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todas
              </Link>
            </div>
            <div className="space-y-3">
              {actividadReciente.ultimasFacturas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay facturas registradas</p>
              ) : (
                actividadReciente.ultimasFacturas.map((factura) => (
                  <div key={factura.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {factura.numeroFactura}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(factura.fechaFactura), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    {factura.reporteIds && factura.reporteIds.length > 0 && (
                      <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {factura.reporteIds.length} reporte{factura.reporteIds.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Últimos Mapas de Calor */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Thermometer size={20} />
                Últimos Mapas
              </h2>
              <Link to={isAdmin ? "/admin/mapas-calor" : "/mapas-calor/control-roedores"} className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {actividadReciente.ultimosMapas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay mapas registrados</p>
              ) : (
                actividadReciente.ultimosMapas.map((mapa) => (
                  <div key={mapa.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {mapa.archivoNombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {mapa.tipo === 'control-roedores' ? 'Control de Roedores' : 'Trampas de Luz'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(mapa.fecha), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Última Documentación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText size={20} />
                Última Documentación
              </h2>
              <Link to="/documentacion" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {actividadReciente.ultimosDocs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay documentos registrados</p>
              ) : (
                actividadReciente.ultimosDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {doc.titulo}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {doc.tipo}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(doc.fechaCreacion), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
