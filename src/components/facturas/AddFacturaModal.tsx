import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, FileText, XCircle, Search, Check } from 'lucide-react';
import { Factura } from '@/types/factura';
import { useAllReportes } from '@/hooks/useAllReportes';
import { format } from 'date-fns';

interface AddFacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (factura: Omit<Factura, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => void;
  existingFactura?: Factura;
}

const AddFacturaModal: React.FC<AddFacturaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingFactura,
}) => {
  const { reportes } = useAllReportes();
  const [fechaFactura, setFechaFactura] = useState(new Date().toISOString().split('T')[0]);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [reporteIds, setReporteIds] = useState<string[]>([]);
  const [searchReporte, setSearchReporte] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoPreview, setArchivoPreview] = useState<string | null>(null);
  const [notas, setNotas] = useState('');

  const reportesFiltrados = useMemo(() => {
    if (!searchReporte.trim()) return reportes;
    const query = searchReporte.toLowerCase();
    return reportes.filter(reporte => 
      reporte.id.toLowerCase().includes(query) ||
      reporte.numeroReporte.toLowerCase().includes(query) ||
      reporte.servicioTitulo.toLowerCase().includes(query) ||
      format(new Date(reporte.fechaServicio), 'dd/MM/yyyy').includes(query)
    );
  }, [reportes, searchReporte]);

  useEffect(() => {
    if (existingFactura) {
      setFechaFactura(existingFactura.fechaFactura || new Date().toISOString().split('T')[0]);
      setNumeroFactura(existingFactura.numeroFactura || '');
      // Migración: si tiene reporteId antiguo, convertirlo a array
      if (existingFactura.reporteIds) {
        setReporteIds(existingFactura.reporteIds);
      } else if ((existingFactura as any).reporteId) {
        setReporteIds([(existingFactura as any).reporteId]);
      } else {
        setReporteIds([]);
      }
      setNotas(existingFactura.notas || '');
      if (existingFactura.archivo) {
        setArchivoPreview(existingFactura.archivo.nombre);
      }
    } else {
      setFechaFactura(new Date().toISOString().split('T')[0]);
      setNumeroFactura('');
      setReporteIds([]);
      setSearchReporte('');
      setArchivo(null);
      setArchivoPreview(null);
      setNotas('');
    }
  }, [existingFactura, isOpen]);

  const toggleReporte = (reporteId: string) => {
    setReporteIds(prev => 
      prev.includes(reporteId)
        ? prev.filter(id => id !== reporteId)
        : [...prev, reporteId]
    );
  };

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
    if (!fechaFactura) {
      alert('La fecha de factura es requerida');
      return;
    }
    if (!numeroFactura.trim()) {
      alert('El número de factura es requerido');
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
          fechaFactura,
          numeroFactura: numeroFactura.trim(),
          reporteIds: reporteIds.length > 0 ? reporteIds : undefined,
          archivo: archivoData,
          notas: notas.trim() || undefined,
        });
        onClose();
      };
      reader.readAsDataURL(archivo);
    } else if (existingFactura?.archivo) {
      // Mantener el archivo existente si no se sube uno nuevo
      archivoData = existingFactura.archivo;
      onSubmit({
        fechaFactura,
        numeroFactura: numeroFactura.trim(),
        reporteIds: reporteIds.length > 0 ? reporteIds : undefined,
        archivo: archivoData,
        notas: notas.trim() || undefined,
      });
      onClose();
    } else {
      // Sin archivo
      onSubmit({
        fechaFactura,
        numeroFactura: numeroFactura.trim(),
        reporteIds: reporteIds.length > 0 ? reporteIds : undefined,
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
              {existingFactura ? 'Editar Factura' : 'Agregar Factura'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Factura *
            </label>
            <input
              type="date"
              value={fechaFactura}
              onChange={e => setFechaFactura(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Factura *
            </label>
            <input
              type="text"
              value={numeroFactura}
              onChange={e => setNumeroFactura(e.target.value)}
              className="w-full border rounded-lg p-2.5"
              required
              placeholder="Número de factura"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reportes de Servicio (opcional)
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchReporte}
                  onChange={e => setSearchReporte(e.target.value)}
                  placeholder="Buscar por ID, número de reporte, servicio o fecha..."
                  className="w-full border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto bg-gray-50">
                {reportesFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No se encontraron reportes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {reportesFiltrados.map((reporte) => {
                      const isSelected = reporteIds.includes(reporte.id);
                      return (
                        <label
                          key={reporte.id}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border border-emerald-200'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center mt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleReporte(reporte.id)}
                              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {reporte.numeroReporte}
                              </span>
                              {isSelected && (
                                <Check size={14} className="text-emerald-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {reporte.servicioTitulo}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {format(new Date(reporte.fechaServicio), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1">
                              ID: {reporte.id.substring(0, 8)}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {reporteIds.length > 0 
                ? `${reporteIds.length} reporte${reporteIds.length !== 1 ? 's' : ''} seleccionado${reporteIds.length !== 1 ? 's' : ''}`
                : reportesFiltrados.length > 0
                  ? `${reportesFiltrados.length} reporte${reportesFiltrados.length !== 1 ? 's' : ''} disponible${reportesFiltrados.length !== 1 ? 's' : ''} - Selecciona uno o más reportes`
                  : 'Busca reportes para asociar a esta factura'}
            </p>
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
              placeholder="Notas adicionales sobre la factura"
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
              {existingFactura ? 'Actualizar' : 'Agregar'} Factura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFacturaModal;

