import React, { useState, useMemo } from 'react';
import { FileCheck, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { useAllReportes } from '@/hooks/useAllReportes';
import { useFacturas } from '@/hooks/useFacturas';
import { format } from 'date-fns';

const ReportesFacturas: React.FC = () => {
  const { reportes } = useAllReportes();
  const { facturas } = useFacturas();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroServicio, setFiltroServicio] = useState<string>('todos');
  const [filtroFacturado, setFiltroFacturado] = useState<string>('todos');

  // Obtener lista única de servicios
  const serviciosUnicos = useMemo(() => {
    const servicios = new Set<string>();
    reportes.forEach(reporte => {
      servicios.add(reporte.servicioTitulo);
    });
    return Array.from(servicios).sort();
  }, [reportes]);

  // Verificar qué reportes tienen facturas vinculadas
  const reportesConFactura = useMemo(() => {
    const reportesFacturados = new Set<string>();
    facturas.forEach(factura => {
      const reporteIds = factura.reporteIds || ((factura as any).reporteId ? [(factura as any).reporteId] : []);
      reporteIds.forEach(id => reportesFacturados.add(id));
    });
    return reportesFacturados;
  }, [facturas]);

  // Mapa de reporteId -> numeroFactura para obtener el número de factura de cada reporte
  const reporteAFacturaMap = useMemo(() => {
    const mapa = new Map<string, string>();
    facturas.forEach(factura => {
      const reporteIds = factura.reporteIds || ((factura as any).reporteId ? [(factura as any).reporteId] : []);
      reporteIds.forEach(reporteId => {
        mapa.set(reporteId, factura.numeroFactura);
      });
    });
    return mapa;
  }, [facturas]);

  // Filtrar reportes
  const reportesFiltrados = useMemo(() => {
    return reportes.filter(reporte => {
      // Filtro por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchSearch = 
          reporte.numeroReporte.toLowerCase().includes(query) ||
          reporte.servicioTitulo.toLowerCase().includes(query) ||
          reporte.id.toLowerCase().includes(query) ||
          format(new Date(reporte.fechaServicio), 'dd/MM/yyyy').includes(query);
        if (!matchSearch) return false;
      }

      // Filtro por servicio
      if (filtroServicio !== 'todos') {
        if (reporte.servicioTitulo !== filtroServicio) return false;
      }

      // Filtro por estado de facturación
      const tieneFactura = reportesConFactura.has(reporte.id);
      if (filtroFacturado === 'facturados' && !tieneFactura) return false;
      if (filtroFacturado === 'sin-facturar' && tieneFactura) return false;

      return true;
    });
  }, [reportes, searchQuery, filtroServicio, filtroFacturado, reportesConFactura]);

  // Estadísticas
  const estadisticas = useMemo(() => {
    const total = reportes.length;
    const facturados = Array.from(reportesConFactura).length;
    const sinFacturar = total - facturados;
    return { total, facturados, sinFacturar };
  }, [reportes.length, reportesConFactura]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <FileCheck size={32} />
            Reportes y Facturas
          </h1>
          <p className="text-gray-600">
            Visualiza todos los reportes y su estado de facturación
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total de Reportes</div>
            <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200 p-4">
            <div className="text-sm text-emerald-700 mb-1">Facturados</div>
            <div className="text-2xl font-bold text-emerald-900">{estadisticas.facturados}</div>
          </div>
          <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-4">
            <div className="text-sm text-amber-700 mb-1">Sin Facturar</div>
            <div className="text-2xl font-bold text-amber-900">{estadisticas.sinFacturar}</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Número, servicio, ID, fecha..."
                  className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>

            {/* Filtro por servicio */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo de Servicio
              </label>
              <select
                value={filtroServicio}
                onChange={(e) => setFiltroServicio(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="todos">Todos los servicios</option>
                {serviciosUnicos.map((servicio) => (
                  <option key={servicio} value={servicio}>
                    {servicio}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estado de facturación */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Estado de Facturación
              </label>
              <select
                value={filtroFacturado}
                onChange={(e) => setFiltroFacturado(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="todos">Todos</option>
                <option value="facturados">Facturados</option>
                <option value="sin-facturar">Sin facturar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {reportesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <FileCheck size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {reportes.length === 0
                  ? 'No hay reportes registrados.'
                  : 'No se encontraron reportes con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Reporte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID de Factura
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportesFiltrados.map((reporte) => {
                    const tieneFactura = reportesConFactura.has(reporte.id);
                    const facturaId = reporteAFacturaMap.get(reporte.id);
                    return (
                      <tr
                        key={reporte.id}
                        className={`hover:bg-gray-50 transition-colors ${
                          tieneFactura ? 'bg-emerald-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          {tieneFactura ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 size={18} className="text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">Facturado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle size={18} className="text-amber-600" />
                              <span className="text-xs font-medium text-amber-700">Sin facturar</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">
                            {reporte.numeroReporte}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {reporte.servicioTitulo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {format(new Date(reporte.fechaServicio), 'dd/MM/yyyy')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {facturaId ? (
                            <span className="text-sm font-medium text-gray-900">
                              {facturaId}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {reportesFiltrados.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {reportesFiltrados.length} de {reportes.length} reportes
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesFacturas;

