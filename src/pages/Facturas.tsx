import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Search, Edit, Trash2, Eye, Download, FileText } from 'lucide-react';
import { useFacturas } from '@/hooks/useFacturas';
import { useAllReportes } from '@/hooks/useAllReportes';
import AddFacturaModal from '@/components/facturas/AddFacturaModal';
import { Factura } from '@/types/factura';
import { format } from 'date-fns';

const Facturas: React.FC = () => {
  const { facturas, agregarFactura, actualizarFactura, eliminarFactura } = useFacturas();
  const { reportes } = useAllReportes();
  const [showModal, setShowModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtrar facturas según el rol del usuario
  const facturasVisibles = React.useMemo(() => {
    if (isAdmin) {
      return facturas; // Admin ve todas las facturas
    } else {
      // Cliente solo ve sus facturas asignadas
      return facturas.filter(f => f.clienteEmail === userEmail);
    }
  }, [facturas, isAdmin, userEmail]);

  const getReportesByIds = (reporteIds?: string[]) => {
    if (!reporteIds || reporteIds.length === 0) return [];
    return reportes.filter(r => reporteIds.includes(r.id));
  };

  const handleAdd = () => {
    setEditingFactura(null);
    setShowModal(true);
  };

  const handleEdit = (factura: Factura) => {
    setEditingFactura(factura);
    setShowModal(true);
  };

  const handleDelete = (facturaId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      eliminarFactura(facturaId);
    }
  };

  const handleSubmit = (factura: Omit<Factura, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    if (editingFactura) {
      actualizarFactura(editingFactura.id, factura);
    } else {
      agregarFactura(factura);
    }
    setShowModal(false);
    setEditingFactura(null);
  };

  const handleViewPDF = (factura: Factura) => {
    if (factura.archivo) {
      const byteCharacters = atob(factura.archivo.contenido);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  };

  const handleDownloadPDF = (factura: Factura) => {
    if (factura.archivo) {
      const byteCharacters = atob(factura.archivo.contenido);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = factura.archivo.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const facturasFiltradas = facturasVisibles
    .filter(factura => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        factura.numeroFactura.toLowerCase().includes(query) ||
        factura.notas?.toLowerCase().includes(query) ||
        factura.archivo?.nombre.toLowerCase().includes(query) ||
        format(new Date(factura.fechaFactura), 'dd/MM/yyyy').includes(query)
      );
    })
    .sort((a, b) => new Date(b.fechaFactura).getTime() - new Date(a.fechaFactura).getTime());

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt size={32} />
                Facturas
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión de facturas
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Factura
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por fecha, número de factura, notas, archivo..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Tabla de Facturas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {facturasFiltradas.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {facturasVisibles.length === 0 
                  ? isAdmin
                    ? 'No hay facturas registradas. Agrega tu primera factura.'
                    : 'No tienes facturas asignadas.'
                  : 'No se encontraron facturas con la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Factura
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reporte Asociado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isAdmin ? 'Acciones' : 'Ver'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturasFiltradas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(factura.fechaFactura), 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {factura.numeroFactura}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          // Migración: si tiene reporteId antiguo, convertirlo
                          const reporteIds = factura.reporteIds || ((factura as any).reporteId ? [(factura as any).reporteId] : []);
                          const reportesAsociados = getReportesByIds(reporteIds);
                          
                          if (reportesAsociados.length === 0) {
                            return <span className="text-xs text-gray-400">Sin reportes</span>;
                          }
                          
                          return (
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {reportesAsociados.map((reporte, idx) => (
                                <div key={reporte.id} className="text-xs border-l-2 border-emerald-500 pl-2">
                                  <div className="font-medium text-gray-900">{reporte.numeroReporte}</div>
                                  <div className="text-gray-500">{reporte.servicioTitulo}</div>
                                  <div className="text-gray-400">{format(new Date(reporte.fechaServicio), 'dd/MM/yyyy')}</div>
                                </div>
                              ))}
                              {reporteIds.length > reportesAsociados.length && (
                                <div className="text-xs text-amber-600">
                                  {reporteIds.length - reportesAsociados.length} reporte(s) no encontrado(s)
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {factura.archivo ? (
                          <div className="mb-3 p-2 bg-red-50 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={16} className="text-red-600 flex-shrink-0" />
                              <span className="text-xs text-red-700 font-medium break-words flex-1">{factura.archivo.nombre}</span>
                            </div>
                            <button
                              onClick={() => handleViewPDF(factura)}
                              className="w-full px-2 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center justify-center gap-1"
                              title="Ver PDF"
                            >
                              <Eye size={14} />
                              Ver PDF
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 line-clamp-2 max-w-xs">
                          {factura.notas || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {factura.archivo && (
                            <>
                              <button
                                onClick={() => handleViewPDF(factura)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Ver PDF"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(factura)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                title="Descargar PDF"
                              >
                                <Download size={16} />
                              </button>
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEdit(factura)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(factura.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {facturasFiltradas.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {facturasFiltradas.length} de {facturasVisibles.length} facturas
          </div>
        )}

        {/* Modal */}
        <AddFacturaModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingFactura(null);
          }}
          onSubmit={handleSubmit}
          existingFactura={editingFactura || undefined}
        />
      </div>
    </div>
  );
};

export default Facturas;

