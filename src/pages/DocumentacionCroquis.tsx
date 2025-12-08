import React, { useState } from 'react';
import { FileText, Plus, Search, Edit, Trash2, Download, Eye } from 'lucide-react';
import { useDocumentacion } from '@/hooks/useDocumentacion';
import AddDocumentoModal from '@/components/documentacion/AddDocumentoModal';
import { Documento } from '@/types/documentacion';
import { format } from 'date-fns';

const DocumentacionCroquis: React.FC = () => {
  const { documentos, agregarDocumento, actualizarDocumento, eliminarDocumento } = useDocumentacion('croquis');
  const [showModal, setShowModal] = useState(false);
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    setEditingDocumento(null);
    setShowModal(true);
  };

  const handleEdit = (documento: Documento) => {
    setEditingDocumento(documento);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      eliminarDocumento(id);
    }
  };

  const handleSubmit = (documento: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'tipo'>) => {
    if (editingDocumento) {
      actualizarDocumento(editingDocumento.id, documento);
    } else {
      agregarDocumento(documento);
    }
    setShowModal(false);
    setEditingDocumento(null);
  };

  const handleViewPDF = (documento: Documento) => {
    if (documento.archivo) {
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
  };

  const handleDownloadPDF = (documento: Documento) => {
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

  const documentosFiltrados = documentos.filter(doc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.titulo.toLowerCase().includes(query) ||
      doc.descripcion?.toLowerCase().includes(query) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      doc.creadoPor?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText size={32} />
                Croquis
              </h1>
              <p className="text-gray-600 mt-2">
                Gestión de croquis y planos
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium"
            >
              <Plus size={20} />
              Agregar Documento
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, descripción, tags..."
              className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
        </div>

        {/* Lista de Documentos */}
        {documentosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              {documentos.length === 0 
                ? 'No hay documentos registrados. Agrega tu primer documento.'
                : 'No se encontraron documentos con la búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentosFiltrados.map((documento) => (
              <div
                key={documento.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{documento.titulo}</h3>
                    {documento.descripcion && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{documento.descripcion}</p>
                    )}
                  </div>
                </div>

                {documento.archivo && (
                  <div className="mb-3 p-2 bg-red-50 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-red-600 flex-shrink-0" />
                      <span className="text-xs text-red-700 font-medium break-words flex-1">{documento.archivo.nombre}</span>
                    </div>
                    <button
                      onClick={() => handleViewPDF(documento)}
                      className="w-full px-2 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center justify-center gap-1"
                      title="Ver PDF"
                    >
                      <Eye size={14} />
                      Ver PDF
                    </button>
                  </div>
                )}

                {documento.tags && documento.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {documento.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-3">
                  <p>Creado: {format(new Date(documento.fechaCreacion), 'dd/MM/yyyy')}</p>
                  {documento.creadoPor && <p>Por: {documento.creadoPor}</p>}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  {documento.archivo && (
                    <>
                      <button
                        onClick={() => handleViewPDF(documento)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm font-medium"
                        title="Ver PDF"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(documento)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 text-sm font-medium"
                        title="Descargar PDF"
                      >
                        <Download size={16} />
                        Descargar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleEdit(documento)}
                    className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(documento.id)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <AddDocumentoModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingDocumento(null);
          }}
          onSubmit={handleSubmit}
          existingDocumento={editingDocumento || undefined}
        />
      </div>
    </div>
  );
};

export default DocumentacionCroquis;

