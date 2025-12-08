import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, XCircle } from 'lucide-react';
import { Documento } from '@/types/documentacion';

interface AddDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documento: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'tipo'>) => void;
  existingDocumento?: Documento;
}

const AddDocumentoModal: React.FC<AddDocumentoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingDocumento,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [creadoPor, setCreadoPor] = useState('');

  useEffect(() => {
    if (existingDocumento) {
      setTitulo(existingDocumento.titulo);
      setDescripcion(existingDocumento.descripcion || '');
      setTags(existingDocumento.tags?.join(', ') || '');
      setCreadoPor(existingDocumento.creadoPor || '');
      if (existingDocumento.archivo) {
        setArchivoPreview(existingDocumento.archivo.nombre);
      }
    } else {
      setTitulo('');
      setDescripcion('');
      setArchivo(null);
      setArchivoPreview(null);
      setTags('');
      setCreadoPor('');
    }
  }, [existingDocumento, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert('El archivo no puede ser mayor a 10MB');
        return;
      }
      setArchivo(file);
      setArchivoPreview(file.name);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    setArchivoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      alert('El título es requerido');
      return;
    }

    let archivoData = undefined;
    if (archivo) {
      // Convertir archivo a base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        archivoData = {
          nombre: archivo.name,
          tipo: archivo.type,
          tamaño: archivo.size,
          contenido: base64String.split(',')[1], // Remover el prefijo data:application/pdf;base64,
        };
        
        onSubmit({
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || undefined,
          archivo: archivoData,
          tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
          creadoPor: creadoPor.trim() || undefined,
        });
        onClose();
      };
      reader.readAsDataURL(archivo);
    } else if (existingDocumento?.archivo) {
      // Mantener el archivo existente si no se sube uno nuevo
      archivoData = existingDocumento.archivo;
      onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        archivo: archivoData,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        creadoPor: creadoPor.trim() || undefined,
      });
      onClose();
    } else {
      // Sin archivo
      onSubmit({
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        creadoPor: creadoPor.trim() || undefined,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-semibold">
              {existingDocumento ? 'Editar Documento' : 'Agregar Documento'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
              placeholder="Título del documento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción del documento"
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo PDF
            </label>
            {archivoPreview ? (
              <div className="border rounded-lg p-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-red-600" />
                  <span className="text-sm font-medium">{archivoPreview}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload size={32} className="text-gray-400 mb-2" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (separados por comas)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="Ej: auditoría, calidad, ISO"
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Creado por
            </label>
            <input
              type="text"
              value={creadoPor}
              onChange={e => setCreadoPor(e.target.value)}
              placeholder="Nombre del creador"
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
            >
              {existingDocumento ? 'Actualizar' : 'Agregar'} Documento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDocumentoModal;

