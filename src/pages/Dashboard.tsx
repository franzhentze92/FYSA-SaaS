import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Warehouse, 
  Ship, 
  ClipboardList, 
  Receipt, 
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useSilos } from '@/hooks/useSilos';
import { useBarcos } from '@/hooks/useBarcos';
import { useAllReportes } from '@/hooks/useAllReportes';
import { useFacturas } from '@/hooks/useFacturas';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { silos, getTotalQuantityInSilo } = useSilos();
  const { barcos, totalBarcos, barcosConTratamiento, totalGrano } = useBarcos();
  const { reportes } = useAllReportes();
  const { facturas } = useFacturas();

  // Estadísticas de Silos
  const estadisticasSilos = useMemo(() => {
    const totalSilos = silos.length;
    const silosActivos = silos.filter(s => s.isActive).length;
    const totalBatches = silos.reduce((sum, s) => sum + s.batches.length, 0);
    const capacidadTotal = silos.reduce((sum, s) => sum + s.capacity, 0);
    const capacidadUtilizada = silos.reduce((sum, s) => {
      const qty = getTotalQuantityInSilo(s.id);
      return sum + qty;
    }, 0);
    const porcentajeUtilizado = capacidadTotal > 0 
      ? (capacidadUtilizada / capacidadTotal) * 100 
      : 0;

    return {
      totalSilos,
      silosActivos,
      totalBatches,
      capacidadTotal,
      capacidadUtilizada,
      porcentajeUtilizado,
    };
  }, [silos, getTotalQuantityInSilo]);

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

  // Actividad reciente
  const actividadReciente = useMemo(() => {
    const ultimosBarcos = [...barcos]
      .sort((a, b) => new Date(b.fechaFondeo).getTime() - new Date(a.fechaFondeo).getTime())
      .slice(0, 5);

    const ultimosReportes = [...reportes]
      .sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime())
      .slice(0, 5);

    const ultimasFacturas = [...facturas]
      .sort((a, b) => new Date(b.fechaFactura).getTime() - new Date(a.fechaFactura).getTime())
      .slice(0, 5);

    return {
      ultimosBarcos,
      ultimosReportes,
      ultimasFacturas,
    };
  }, [barcos, reportes, facturas]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Bienvenido, Aprovigra 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Tu centro de gestión para monitoreo de granos, servicios, facturas y documentación.
          </p>
        </div>

        {/* Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Silos */}
          <Link to="/lotes" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Warehouse size={24} className="text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{estadisticasSilos.totalSilos}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Silos Totales</div>
            <div className="text-xs text-gray-500 mt-1">
              {estadisticasSilos.silosActivos} activos • {estadisticasSilos.totalBatches} batches
            </div>
          </Link>

          {/* Barcos */}
          <Link to="/barcos" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Ship size={24} className="text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{totalBarcos}</span>
            </div>
            <div className="text-sm font-medium text-gray-700">Barcos Registrados</div>
            <div className="text-xs text-gray-500 mt-1">
              {barcosConTratamiento} con tratamiento OIRSA
            </div>
          </Link>

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
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Capacidad de Silos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package size={20} />
                Capacidad de Silos
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Capacidad Utilizada</span>
                  <span className="font-medium text-gray-900">
                    {estadisticasSilos.capacidadUtilizada.toFixed(2)} / {estadisticasSilos.capacidadTotal.toFixed(2)} ton
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      estadisticasSilos.porcentajeUtilizado > 80
                        ? 'bg-red-500'
                        : estadisticasSilos.porcentajeUtilizado > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(estadisticasSilos.porcentajeUtilizado, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {estadisticasSilos.porcentajeUtilizado.toFixed(1)}% de capacidad utilizada
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-xs text-gray-500">Silos Activos</div>
                  <div className="text-lg font-semibold text-gray-900">{estadisticasSilos.silosActivos}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Total Batches</div>
                  <div className="text-lg font-semibold text-gray-900">{estadisticasSilos.totalBatches}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Facturación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp size={20} />
                Estado de Facturación
              </h2>
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
        </div>

        {/* Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Últimos Barcos */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Ship size={20} />
                Últimos Barcos
              </h2>
              <Link to="/barcos" className="text-xs text-blue-600 hover:text-blue-700">
                Ver todos
              </Link>
            </div>
            <div className="space-y-3">
              {actividadReciente.ultimosBarcos.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay barcos registrados</p>
              ) : (
                actividadReciente.ultimosBarcos.map((barco) => (
                  <div key={barco.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {barco.barcoId}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(barco.fechaFondeo), 'dd/MM/yyyy')}
                      </div>
                    </div>
                    {barco.requiereTratamientoOIRSA && (
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

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
        </div>

        {/* Resumen de Granos Recibidos */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Activity size={20} />
            Resumen de Granos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Total Grano Recibido</div>
              <div className="text-2xl font-bold text-gray-900">
                {totalGrano.toLocaleString('es-ES', { maximumFractionDigits: 2 })} ton
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Total Grano en Silos</div>
              <div className="text-2xl font-bold text-gray-900">
                {estadisticasSilos.capacidadUtilizada.toFixed(2)} ton
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">Barcos con Tratamiento</div>
              <div className="text-2xl font-bold text-gray-900">
                {barcosConTratamiento} / {totalBarcos}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
