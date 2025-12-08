import { useState, useEffect } from 'react';
import { DocumentoServicio } from '@/types/servicio';
import { v4 as uuidv4 } from 'uuid';

export const useServicios = (servicioId: number) => {
  const [documentos, setDocumentos] = useState<DocumentoServicio[]>(() => {
    if (servicioId === 0) return [];
    const saved = localStorage.getItem(`servicios-${servicioId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filtrar solo los documentos que pertenecen a este servicio
        return parsed.filter((doc: DocumentoServicio) => doc.servicioId === servicioId);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Recargar documentos cuando cambie el servicioId
  useEffect(() => {
    if (servicioId === 0) {
      setDocumentos([]);
      return;
    }
    const saved = localStorage.getItem(`servicios-${servicioId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Filtrar solo los documentos que pertenecen a este servicio
        const documentosFiltrados = parsed.filter((doc: DocumentoServicio) => doc.servicioId === servicioId);
        setDocumentos(documentosFiltrados);
      } catch {
        setDocumentos([]);
      }
    } else {
      setDocumentos([]);
    }
  }, [servicioId]);

  useEffect(() => {
    if (servicioId === 0) return;
    // Asegurar que todos los documentos tengan el servicioId correcto antes de guardar
    const documentosValidados = documentos
      .filter(doc => doc.servicioId === servicioId)
      .map(doc => ({ ...doc, servicioId })); // Forzar el servicioId correcto
    localStorage.setItem(`servicios-${servicioId}`, JSON.stringify(documentosValidados));
  }, [documentos, servicioId]);

  const agregarDocumento = (documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'>) => {
    if (servicioId === 0) {
      console.error('No se puede agregar documento: servicioId es 0');
      return;
    }
    const nuevoDocumento: DocumentoServicio = {
      ...documento,
      id: uuidv4(),
      servicioId, // Asegurar que siempre use el servicioId correcto
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    setDocumentos(prev => {
      // Filtrar cualquier documento duplicado y asegurar que todos tengan el servicioId correcto
      const documentosActualizados = [...prev, nuevoDocumento].filter(doc => doc.servicioId === servicioId);
      return documentosActualizados;
    });
  };

  const actualizarDocumento = (id: string, updates: Partial<DocumentoServicio>) => {
    setDocumentos(prev => prev.map(doc => 
      doc.id === id 
        ? { ...doc, ...updates, fechaModificacion: new Date().toISOString() }
        : doc
    ));
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

  return {
    documentos,
    agregarDocumento,
    actualizarDocumento,
    eliminarDocumento,
  };
};

