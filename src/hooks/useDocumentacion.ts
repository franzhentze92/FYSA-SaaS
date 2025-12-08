import { useState, useEffect } from 'react';
import { Documento } from '@/types/documentacion';
import { v4 as uuidv4 } from 'uuid';

export const useDocumentacion = (tipo: 'auditoria' | 'tecnicos' | 'croquis') => {
  const [documentos, setDocumentos] = useState<Documento[]>(() => {
    const saved = localStorage.getItem(`documentos-${tipo}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`documentos-${tipo}`, JSON.stringify(documentos));
  }, [documentos, tipo]);

  const agregarDocumento = (documento: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'tipo'>) => {
    const nuevoDocumento: Documento = {
      ...documento,
      id: uuidv4(),
      tipo,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    setDocumentos(prev => [...prev, nuevoDocumento]);
  };

  const actualizarDocumento = (id: string, updates: Partial<Documento>) => {
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

