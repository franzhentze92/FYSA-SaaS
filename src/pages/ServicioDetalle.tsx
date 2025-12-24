import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Plus, Search, Edit, Trash2, Eye, Download, FileText } from 'lucide-react';
import { useServicios } from '@/hooks/useServicios';
import AddServicioModal from '@/components/servicios/AddServicioModal';
import { DocumentoServicio } from '@/types/servicio';
import { format } from 'date-fns';
import { toast } from 'sonner';

const servicios = [
  { id: 148998, titulo: 'Aspersión en banda' },
  { id: 148591, titulo: 'Lib. De Encarpado' },
  { id: 136260, titulo: 'Fumigación General' },
  { id: 136259, titulo: 'Muestreo de Granos' },
  { id: 136257, titulo: 'Gas. y Encarpado' },
  { id: 136258, titulo: 'Control de Roedores' },
  { id: 136256, titulo: 'Servicios Generales' },
  { id: 1362563, titulo: 'Trampas de Luz' },
  { id: 1362564, titulo: 'Tratamiento de Contenedores' },
  { id: 1362565, titulo: 'Fum. de Silo Vacío' },
  { id: 1362566, titulo: 'Fum. Graneleras' },
];

const ServicioDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const servicio = servicios.find(s => s.id.toString() === id);
  const servicioId = servicio ? servicio.id : 0;

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
  const userEmail = currentUser?.email;

  // For clients, filter by their email. For admins, show all (no email filter).
  const { documentos, agregarDocumento, actualizarDocumento, eliminarDocumento } = useServicios(
    servicioId, 
    isAdmin ? undefined : userEmail
  );
  const [showModal, setShowModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<DocumentoServicio | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!servicio) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Servicio no encontrado</p>
            {isAdmin && (
              <Link
                to="/servicios"
                className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft size={16} />
                Volver a Servicios
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = () => {
    setEditingDocumento(null);
    setShowModal(true);
  };

  const handleEdit = (documento: DocumentoServicio) => {
    setEditingDocumento(documento);
    setShowModal(true);
  };

  const handleDelete = async (documentoId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este servicio?')) {
      try {
        await eliminarDocumento(documentoId);
        toast.success('Reporte eliminado correctamente');
      } catch (error) {
        toast.error('Error al eliminar el reporte');
        console.error(error);
      }
    }
  };

  const handleSubmit = async (documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'>) => {
    setIsSubmitting(true);
    try {
      if (editingDocumento) {
        await actualizarDocumento(editingDocumento.id, documento);
        toast.success('Reporte actualizado correctamente');
      } else {
        await agregarDocumento(documento);
        toast.success('Reporte creado correctamente');
      }
      setShowModal(false);
      setEditingDocumento(null);
    } catch (error) {
      toast.error('Error al guardar el reporte');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPDF = (documento: DocumentoServicio) => {
    if (documento.archivo) {
      // If we have a URL from Supabase storage, use it directly
      if ((documento.archivo as any).url) {
        window.open((documento.archivo as any).url, '_blank');
        return;
      }
      // Fallback to base64 content
      if (documento.archivo.contenido) {
        const byteCharacters = atob(documento.archivo.contenido);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      }
    }
  };

  const handleDownloadPDF = (documento: DocumentoServicio) => {
    if (documento.archivo) {
      const byteCharacters = atob(documento.archivo.contenido);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documento.archivo.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const documentosFiltrados = documentos
    .filter(doc => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        doc.numeroReporte.toLowerCase().includes(query) ||
        doc.notas?.toLowerCase().includes(query) ||
        doc.archivo?.nombre.toLowerCase().includes(query) ||
        format(new Date(doc.fechaServicio), 'dd/MM/yyyy').includes(query)
      );
    })
    .sort((a, b) => new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime());

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {isAdmin && (
            <Link
              to="/servicios"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={16} />
              Volver a Servicios
            </Link>
          )}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ClipboardList size={32} className="text-gray-700" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {servicio.titulo}
                </h1>
                <p className="text-gray-600 mt-1">
                  ID: {servicio.id}
                </p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
              >
                <Plus size={20} />
                Agregar Servicio
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
              placeholder="Buscar por fecha, número de reporte, notas, archivo..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Tabla de Servicios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {documentosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {documentos.length === 0 
                  ? 'No hay servicios registrados. Agrega tu primer servicio.'
                  : 'No se encontraron servicios con la búsqueda.'}
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
                      {isAdmin ? 'Acciones' : 'Ver'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentosFiltrados.map((documento) => (
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
                            <span className="text-xs text-gray-700 truncate max-w-xs">{documento.archivo.nombre}</span>
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
                      <td className="px-4 py-3">
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
                                onClick={() => handleEdit(documento)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(documento.id)}
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

        {documentosFiltrados.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {documentosFiltrados.length} de {documentos.length} servicios
          </div>
        )}

        {/* Modal */}
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

export default ServicioDetalle;

