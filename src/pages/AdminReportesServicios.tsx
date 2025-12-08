import React, { useState, useMemo } from 'react';
import { FileText, Plus, Search, X, Users, Building2, Calendar, FileCheck, Eye, Download } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useServicios } from '@/hooks/useServicios';
import { DocumentoServicio } from '@/types/servicio';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

const AdminReportesServicios: React.FC = () => {
  const { serviciosAsignados, clientes, getServiciosPorCliente } = useAdminServicios();

  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedServicio, setSelectedServicio] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReporte, setNewReporte] = useState({
    fechaServicio: new Date().toISOString().split('T')[0],
    numeroReporte: '',
    notas: '',
    archivo: null as File | null,
  });

  // Obtener servicios del cliente seleccionado
  const serviciosDelCliente = useMemo(() => {
    if (!selectedCliente) return [];
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) return [];
    return getServiciosPorCliente(cliente.email);
  }, [selectedCliente, clientes, getServiciosPorCliente]);

  // Obtener documentos del servicio seleccionado
  const servicioId = selectedServicio || 0;
  const { documentos, agregarDocumento } = useServicios(servicioId);

  // Filtrar documentos por búsqueda
  const documentosFiltrados = useMemo(() => {
    if (!searchQuery) return documentos;
    const query = searchQuery.toLowerCase();
    return documentos.filter(doc =>
      doc.numeroReporte.toLowerCase().includes(query) ||
      doc.notas?.toLowerCase().includes(query) ||
      doc.archivo?.nombre.toLowerCase().includes(query) ||
      format(new Date(doc.fechaServicio), 'dd/MM/yyyy').includes(query)
    );
  }, [documentos, searchQuery]);

  const handleAgregarReporte = () => {
    if (!selectedCliente || !selectedServicio) {
      alert('Por favor selecciona un cliente y un servicio');
      return;
    }

    if (!newReporte.fechaServicio || !newReporte.numeroReporte) {
      alert('Por favor completa la fecha de servicio y el número de reporte');
      return;
    }

    const documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'> = {
      fechaServicio: newReporte.fechaServicio,
      numeroReporte: newReporte.numeroReporte,
      notas: newReporte.notas || undefined,
    };

    // Si hay un archivo, leerlo y convertirlo a base64
    if (newReporte.archivo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const archivoData = {
          nombre: newReporte.archivo!.name,
          tipo: newReporte.archivo!.type,
          tamaño: newReporte.archivo!.size,
          contenido: base64String.split(',')[1], // Remover el prefijo data:application/pdf;base64,
        };

        agregarDocumento({
          ...documento,
          archivo: archivoData,
        });

        // Resetear formulario
        setNewReporte({
          fechaServicio: new Date().toISOString().split('T')[0],
          numeroReporte: '',
          notas: '',
          archivo: null,
        });
        setShowAddModal(false);
      };
      reader.readAsDataURL(newReporte.archivo);
    } else {
      agregarDocumento(documento);
      // Resetear formulario
      setNewReporte({
        fechaServicio: new Date().toISOString().split('T')[0],
        numeroReporte: '',
        notas: '',
        archivo: null,
      });
      setShowAddModal(false);
    }
  };

  const handleViewPDF = (documento: DocumentoServicio) => {
    if (!documento.archivo) return;
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
  };

  const handleDownloadPDF = (documento: DocumentoServicio) => {
    if (!documento.archivo) return;
    const base64Content = `data:${documento.archivo.tipo};base64,${documento.archivo.contenido}`;
    const link = document.createElement('a');
    link.href = base64Content;
    link.download = documento.archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const servicioSeleccionado = serviciosAsignados.find(s => s.servicioId === selectedServicio);
  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);

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

        {/* Selectores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={selectedCliente}
                onChange={(e) => {
                  setSelectedCliente(e.target.value);
                  setSelectedServicio(null); // Resetear servicio al cambiar cliente
                }}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">Selecciona un cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicio
              </label>
              <select
                value={selectedServicio || ''}
                onChange={(e) => setSelectedServicio(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!selectedCliente}
                className="w-full border rounded-lg p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona un servicio</option>
                {serviciosDelCliente.map((servicio) => (
                  <option key={servicio.servicioId} value={servicio.servicioId}>
                    {servicio.servicioTitulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCliente && selectedServicio && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Cliente:</span> {clienteSeleccionado?.nombre}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Servicio:</span> {servicioSeleccionado?.servicioTitulo}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Plus size={18} />
                  Agregar Reporte
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabla de Reportes */}
        {selectedServicio && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={24} />
                Reportes del Servicio
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

            {documentosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  {documentos.length === 0
                    ? 'No hay reportes registrados para este servicio. Agrega el primer reporte.'
                    : 'No se encontraron reportes con la búsqueda.'}
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
                    {documentosFiltrados
                      .sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime())
                      .map((documento) => (
                        <tr key={documento.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(documento.fechaServicio), 'dd/MM/yyyy')}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal para Agregar Reporte */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-lg font-semibold">Agregar Nuevo Reporte</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewReporte({
                      fechaServicio: new Date().toISOString().split('T')[0],
                      numeroReporte: '',
                      notas: '',
                      archivo: null,
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Servicio *
                  </label>
                  <input
                    type="date"
                    value={newReporte.fechaServicio}
                    onChange={(e) => setNewReporte({ ...newReporte, fechaServicio: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Reporte *
                  </label>
                  <input
                    type="text"
                    value={newReporte.numeroReporte}
                    onChange={(e) => setNewReporte({ ...newReporte, numeroReporte: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Ej: REP-2025-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={newReporte.notas}
                    onChange={(e) => setNewReporte({ ...newReporte, notas: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    rows={3}
                    placeholder="Notas adicionales sobre el servicio..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo PDF (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.type !== 'application/pdf') {
                          alert('Por favor selecciona un archivo PDF');
                          return;
                        }
                        setNewReporte({ ...newReporte, archivo: file });
                      }
                    }}
                    className="w-full border rounded-lg p-2.5"
                  />
                  {newReporte.archivo && (
                    <p className="mt-2 text-sm text-gray-600">
                      Archivo seleccionado: {newReporte.archivo.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewReporte({
                        fechaServicio: new Date().toISOString().split('T')[0],
                        numeroReporte: '',
                        notas: '',
                        archivo: null,
                      });
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarReporte}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                  >
                    Agregar Reporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReportesServicios;

