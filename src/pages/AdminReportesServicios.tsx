import React, { useState, useMemo } from 'react';
import { FileText, Plus, Search, Users, Building2, Calendar, FileCheck, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { useAdminServicios, SERVICIOS_DISPONIBLES } from '@/hooks/useAdminServicios';
import { useAllReportes, ReporteConServicio } from '@/hooks/useAllReportes';
import { useServicios } from '@/hooks/useServicios';
import { DocumentoServicio } from '@/types/servicio';
import AddServicioModal from '@/components/servicios/AddServicioModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminReportesServicios: React.FC = () => {
  const { serviciosAsignados, clientes, getServiciosPorCliente } = useAdminServicios();
  const { reportes, loading: reportesLoading, refetch: refetchReportes } = useAllReportes();

  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedServicio, setSelectedServicio] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoServicio | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener cliente seleccionado
  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);

  // Obtener servicios disponibles para el filtro
  const serviciosDisponibles = useMemo(() => {
    if (selectedCliente && clienteSeleccionado) {
      // Si hay cliente seleccionado, mostrar solo sus servicios
      return getServiciosPorCliente(clienteSeleccionado.email);
    }
    // Si no hay cliente, mostrar todos los servicios disponibles
    return SERVICIOS_DISPONIBLES.map(s => ({
      servicioId: s.id,
      servicioTitulo: s.titulo,
    }));
  }, [selectedCliente, clienteSeleccionado, getServiciosPorCliente]);

  // Para agregar/editar, necesitamos usar useServicios con el servicio seleccionado
  const servicioId = selectedServicio || 0;
  const { agregarDocumento, actualizarDocumento, eliminarDocumento } = useServicios(servicioId, clienteSeleccionado?.email);

  // Filtrar reportes por búsqueda, cliente y servicio
  const reportesFiltrados = useMemo(() => {
    let filtered = [...reportes];

    // Filtrar por cliente si está seleccionado
    if (selectedCliente && clienteSeleccionado) {
      filtered = filtered.filter(reporte => 
        reporte.clienteEmail === clienteSeleccionado.email
      );
    }

    // Filtrar por servicio si está seleccionado
    if (selectedServicio) {
      filtered = filtered.filter(reporte => 
        reporte.servicioId === selectedServicio
      );
    }

    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reporte =>
        reporte.numeroReporte.toLowerCase().includes(query) ||
        reporte.notas?.toLowerCase().includes(query) ||
        reporte.archivo?.nombre.toLowerCase().includes(query) ||
        reporte.servicioTitulo.toLowerCase().includes(query) ||
        reporte.clienteNombre?.toLowerCase().includes(query) ||
        reporte.clienteEmail?.toLowerCase().includes(query) ||
        format(new Date(reporte.fechaServicio), 'dd/MM/yyyy').includes(query)
      );
    }

    // Ya están ordenados por fecha más reciente desde useAllReportes
    return filtered;
  }, [reportes, searchQuery, selectedCliente, selectedServicio, clienteSeleccionado]);

  const handleAdd = () => {
    if (!selectedCliente || !selectedServicio) {
      toast.error('Por favor selecciona un cliente y un servicio');
      return;
    }
    setEditingDocumento(null);
    setShowModal(true);
  };

  const handleEdit = (documento: DocumentoServicio) => {
    setEditingDocumento(documento);
    setShowModal(true);
  };

  const handleDelete = async (documento: ReporteConServicio) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      return;
    }

    try {
      // Delete from Supabase directly
      const { supabase } = await import('@/lib/supabase');
      
      // If there's a file, delete it from storage first
      if (documento.archivo?.url) {
        try {
          // Extract file path from URL
          const urlParts = documento.archivo.url.split('/');
          const documentosIndex = urlParts.findIndex(part => part === 'documentos');
          if (documentosIndex !== -1) {
            const filePath = urlParts.slice(documentosIndex + 1).join('/');
            await supabase.storage
              .from('documentos')
              .remove([filePath]);
          }
        } catch (storageError) {
          console.warn('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('documentos_servicio')
        .delete()
        .eq('id', documento.id);

      if (error) throw error;

      // Refresh the list
      await refetchReportes();
      
      toast.success('Reporte eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar el reporte');
      console.error(error);
    }
  };

  const handleSubmit = async (documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'>) => {
    setIsSubmitting(true);
    try {
      if (editingDocumento) {
        await actualizarDocumento(editingDocumento.id, documento);
        toast.success('Reporte actualizado correctamente');
      } else {
        // Include client info when creating new reports
        await agregarDocumento({
          ...documento,
          clienteEmail: clienteSeleccionado?.email,
          clienteNombre: clienteSeleccionado?.nombre,
        });
        toast.success('Reporte creado correctamente');
      }
      
      // Refresh the list
      await refetchReportes();
      
      setShowModal(false);
      setEditingDocumento(null);
    } catch (error) {
      toast.error('Error al guardar el reporte');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = (documento: ReporteConServicio) => {
    if (!documento.archivo) return;
    // If we have a URL from Supabase storage, use it directly
    if ((documento.archivo as any).url) {
      window.open((documento.archivo as any).url, '_blank');
      return;
    }
    // Fallback to base64 content
    if (documento.archivo.contenido) {
      const base64Content = `data:${documento.archivo.tipo};base64,${documento.archivo.contenido}`;
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${documento.archivo.nombre}</title></head>
            <body style="margin:0;padding:0;">
              <embed src="${base64Content}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;"/>
            </body>
          </html>
        `);
      }
    }
  };

  const handleDownloadPDF = (documento: ReporteConServicio) => {
    if (!documento.archivo) return;
    // If we have a URL from Supabase storage, use it directly
    if ((documento.archivo as any).url) {
      const link = document.createElement('a');
      link.href = (documento.archivo as any).url;
      link.download = documento.archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    // Fallback to base64 content
    if (documento.archivo.contenido) {
      const base64Content = `data:${documento.archivo.tipo};base64,${documento.archivo.contenido}`;
      const link = document.createElement('a');
      link.href = base64Content;
      link.download = documento.archivo.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileCheck size={32} />
            Agregar Reportes a Servicios
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega reportes y documentos a los servicios asignados a los clientes
          </p>
        </div>

        {/* Filtros y Agregar Reporte */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            {selectedCliente && selectedServicio && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Plus size={18} />
                Agregar Reporte
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Cliente
              </label>
              <select
                value={selectedCliente}
                onChange={(e) => {
                  setSelectedCliente(e.target.value);
                  setSelectedServicio(null); // Resetear servicio al cambiar cliente
                }}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Servicio
              </label>
              <select
                value={selectedServicio || ''}
                onChange={(e) => setSelectedServicio(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">Todos los servicios</option>
                {serviciosDisponibles.map((servicio) => (
                  <option key={servicio.servicioId} value={servicio.servicioId}>
                    {servicio.servicioTitulo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              Todos los Reportes
            </h2>
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar reportes..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {reportesLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando reportes...</p>
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {reportes.length === 0
                  ? 'No hay reportes registrados. Agrega el primer reporte seleccionando un cliente y servicio.'
                  : 'No se encontraron reportes con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Reporte
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportesFiltrados.map((documento) => (
                    <tr key={documento.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {format(new Date(documento.fechaServicio), 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {documento.clienteNombre || '-'}
                          </span>
                          {documento.clienteEmail && (
                            <p className="text-xs text-gray-500">{documento.clienteEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {documento.servicioTitulo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {documento.numeroReporte}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {documento.archivo ? (
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-red-600" />
                            <span className="text-xs text-gray-700 truncate max-w-xs">
                              {documento.archivo.nombre}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin archivo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600 line-clamp-2 max-w-xs">
                          {documento.notas || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {documento.archivo && (
                            <>
                              <button
                                onClick={() => handleViewPDF(documento)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Ver PDF"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(documento)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Descargar PDF"
                              >
                                <Download size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEdit(documento)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(documento)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Agregar/Editar Reporte */}
        <AddServicioModal
          isOpen={showModal}
          onClose={() => {
            if (!isSubmitting) {
              setShowModal(false);
              setEditingDocumento(null);
            }
          }}
          onSubmit={handleSubmit}
          existingDocumento={editingDocumento || undefined}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AdminReportesServicios;
