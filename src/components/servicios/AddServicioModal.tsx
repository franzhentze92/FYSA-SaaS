import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, XCircle, Loader2 } from 'lucide-react';
import { DocumentoServicio } from '@/types/servicio';

interface AddServicioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'>) => Promise<void> | void;
  existingDocumento?: DocumentoServicio;
  isLoading?: boolean;
}

const AddServicioModal: React.FC<AddServicioModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingDocumento,
  isLoading = false,
}) => {
  const [fechaServicio, setFechaServicio] = useState(new Date().toISOString().split('T')[0]);
  const [numeroReporte, setNumeroReporte] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (existingDocumento) {
      setFechaServicio(existingDocumento.fechaServicio || new Date().toISOString().split('T')[0]);
      setNumeroReporte(existingDocumento.numeroReporte || '');
      setNotas(existingDocumento.notas || '');
      if (existingDocumento.archivo) {
        setArchivoPreview(existingDocumento.archivo.nombre);
      }
    } else {
      setFechaServicio(new Date().toISOString().split('T')[0]);
      setNumeroReporte('');
      setArchivo(null);
      setArchivoPreview(null);
      setNotas('');
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
    if (!fechaServicio) {
      alert('La fecha de servicio es requerida');
      return;
    }
    if (!numeroReporte.trim()) {
      alert('El número de reporte es requerido');
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
          fechaServicio,
          numeroReporte: numeroReporte.trim(),
          archivo: archivoData,
          notas: notas.trim() || undefined,
        });
        onClose();
      };
      reader.readAsDataURL(archivo);
    } else if (existingDocumento?.archivo) {
      // Mantener el archivo existente si no se sube uno nuevo
      archivoData = existingDocumento.archivo;
      onSubmit({
        fechaServicio,
        numeroReporte: numeroReporte.trim(),
        archivo: archivoData,
        notas: notas.trim() || undefined,
      });
      onClose();
    } else {
      // Sin archivo
      onSubmit({
        fechaServicio,
        numeroReporte: numeroReporte.trim(),
        notas: notas.trim() || undefined,
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
              {existingDocumento ? 'Editar Servicio' : 'Agregar Servicio'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Servicio *
            </label>
            <input
              type="date"
              value={fechaServicio}
              onChange={e => setFechaServicio(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Reporte *
            </label>
            <input
              type="text"
              value={numeroReporte}
              onChange={e => setNumeroReporte(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
              placeholder="Número de reporte"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Archivo PDF
            </label>
            {archivoPreview ? (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-red-600 flex-shrink-0" />
                  <span className="text-xs text-red-700 font-medium break-words flex-1">{archivoPreview}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="w-full px-2 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center justify-center gap-1"
                >
                  <XCircle size={14} />
                  Eliminar archivo
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
              Notas (opcional)
            </label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={3}
              placeholder="Notas adicionales sobre el servicio"
              className="w-full border rounded-lg p-2.5 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>{existingDocumento ? 'Actualizar' : 'Agregar'} Servicio</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServicioModal;

