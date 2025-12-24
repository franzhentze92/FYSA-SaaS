import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Search, FileText, Eye, Download, Edit, Trash2 } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useFacturas } from '@/hooks/useFacturas';
import { useAllReportes } from '@/hooks/useAllReportes';
import { Factura } from '@/types/factura';
import AddFacturaModal from '@/components/facturas/AddFacturaModal';
import { format } from 'date-fns';
import { toast } from 'sonner';

const AdminFacturas: React.FC = () => {
  const { clientes } = useAdminServicios();
  const { facturas, agregarFactura, actualizarFactura, eliminarFactura } = useFacturas();
  const { reportes } = useAllReportes();

  const [selectedCliente, setSelectedCliente] = useState<string>('');

  const getReportesByIds = (reporteIds?: string[]) => {
    if (!reporteIds || reporteIds.length === 0) return [];
    return reportes.filter(r => reporteIds.includes(r.id));
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener facturas del cliente seleccionado
  const facturasDelCliente = useMemo(() => {
    if (!selectedCliente) return facturas;
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) return [];
    // Filtrar facturas asignadas a este cliente
    return facturas.filter(f => {
      // Verificar si la factura tiene el email del cliente en algún campo
      // Por ahora, asumimos que las facturas tienen un campo clienteEmail o similar
      // Si no existe, necesitaremos agregarlo al tipo Factura
      return (f as any).clienteEmail === cliente.email;
    });
  }, [selectedCliente, facturas, clientes]);

  // Filtrar facturas por búsqueda
  const facturasFiltradas = useMemo(() => {
    if (!searchQuery) return facturasDelCliente;
    const query = searchQuery.toLowerCase();
    return facturasDelCliente.filter(factura =>
      factura.numeroFactura.toLowerCase().includes(query) ||
      factura.notas?.toLowerCase().includes(query) ||
      format(new Date(factura.fechaFactura), 'dd/MM/yyyy').includes(query)
    );
  }, [facturasDelCliente, searchQuery]);

  const handleAdd = () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente');
      return;
    }
    setEditingFactura(null);
    setShowModal(true);
  };

  const handleEdit = (factura: Factura) => {
    setEditingFactura(factura);
    setShowModal(true);
  };

  const handleDelete = async (facturaId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
      try {
        await eliminarFactura(facturaId);
        toast.success('Factura eliminada correctamente');
      } catch (error) {
        toast.error('Error al eliminar la factura');
        console.error(error);
      }
    }
  };

  const handleSubmit = async (factura: Omit<Factura, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    setIsSubmitting(true);
    try {
      if (editingFactura) {
        // Mantener el clienteEmail del factura siendo editada
        await actualizarFactura(editingFactura.id, {
          ...factura,
          clienteEmail: editingFactura.clienteEmail,
        });
        toast.success('Factura actualizada correctamente');
      } else {
        // Nueva factura: asignar al cliente seleccionado
        const cliente = clientes.find(c => c.id === selectedCliente);
        if (!cliente) {
          toast.error('Cliente no encontrado');
          return;
        }
        await agregarFactura({
          ...factura,
          clienteEmail: cliente.email,
        });
        toast.success('Factura creada correctamente');
      }
      setShowModal(false);
      setEditingFactura(null);
    } catch (error) {
      toast.error('Error al guardar la factura');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = (factura: Factura) => {
    if (!factura.archivo) return;
    const base64Content = `data:${factura.archivo.tipo};base64,${factura.archivo.contenido}`;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${factura.archivo.nombre}</title></head>
          <body style="margin:0;padding:0;">
            <embed src="${base64Content}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;"/>
          </body>
        </html>
      `);
    }
  };

  const handleDownloadPDF = (factura: Factura) => {
    if (!factura.archivo) return;
    const base64Content = `data:${factura.archivo.tipo};base64,${factura.archivo.contenido}`;
    const link = document.createElement('a');
    link.href = base64Content;
    link.download = factura.archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt size={32} />
            Administración de Facturas
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega y asigna facturas a los clientes
          </p>
        </div>

        {/* Selector de Cliente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
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
            <div className="ml-4">
              <button
                onClick={handleAdd}
                disabled={!selectedCliente}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Agregar Factura
              </button>
            </div>
          </div>
          {selectedCliente && clienteSeleccionado && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cliente seleccionado:</span> {clienteSeleccionado.nombre}
              </p>
            </div>
          )}
        </div>

        {/* Tabla de Facturas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText size={24} />
              Facturas {selectedCliente ? `de ${clienteSeleccionado?.nombre}` : ''}
            </h2>
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar facturas..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {facturasFiltradas.length === 0 ? (
            <div className="text-center py-12">
              <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {facturasDelCliente.length === 0
                  ? selectedCliente
                    ? 'No hay facturas registradas para este cliente. Agrega la primera factura.'
                    : 'Selecciona un cliente para agregar facturas.'
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
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reportes Asociados
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
                  {facturasFiltradas
                    .sort((a, b) => new Date(b.fechaFactura).getTime() - new Date(a.fechaFactura).getTime())
                    .map((factura) => {
                      const facturaCliente = clientes.find(c => c.email === (factura as any).clienteEmail);
                      return (
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
                            <span className="text-sm text-gray-700">
                              {facturaCliente?.nombre || (factura as any).clienteEmail || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const reporteIds = factura.reporteIds || ((factura as any).reporteId ? [(factura as any).reporteId] : []);
                              const reportesAsociados = getReportesByIds(reporteIds);
                              
                              if (reportesAsociados.length === 0) {
                                return <span className="text-xs text-gray-400">-</span>;
                              }
                              
                              return (
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {reportesAsociados.map((reporte) => (
                                    <div key={reporte.id} className="text-xs border-l-2 border-emerald-500 pl-2">
                                      <div className="font-medium text-gray-900">{reporte.numeroReporte}</div>
                                      <div className="text-gray-500 text-[10px]">{reporte.servicioTitulo}</div>
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
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-red-600" />
                                <span className="text-xs text-gray-700 truncate max-w-xs">
                                  {factura.archivo.nombre}
                                </span>
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
                          <td className="px-4 py-3 text-right">
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
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Descargar PDF"
                                  >
                                    <Download size={16} />
                                  </button>
                                </>
                              )}
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Agregar/Editar Factura */}
        <AddFacturaModal
          isOpen={showModal}
          onClose={() => {
            if (!isSubmitting) {
              setShowModal(false);
              setEditingFactura(null);
            }
          }}
          onSubmit={handleSubmit}
          existingFactura={editingFactura || undefined}
          isLoading={isSubmitting}
          clienteEmail={clienteSeleccionado?.email}
        />
      </div>
    </div>
  );
};

export default AdminFacturas;

