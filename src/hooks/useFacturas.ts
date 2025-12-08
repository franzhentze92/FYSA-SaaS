import { useState, useEffect } from 'react';
import { Factura } from '@/types/factura';
import { v4 as uuidv4 } from 'uuid';

export const useFacturas = () => {
  const [facturas, setFacturas] = useState<Factura[]>(() => {
    const saved = localStorage.getItem('facturas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migración: convertir reporteId (string) a reporteIds (array)
        return parsed.map((factura: any) => {
          if (factura.reporteId && !factura.reporteIds) {
            return {
              ...factura,
              reporteIds: [factura.reporteId],
              reporteId: undefined,
            };
          }
          return factura;
        });
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('facturas', JSON.stringify(facturas));
  }, [facturas]);

  const agregarFactura = (factura: Omit<Factura, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    const nuevaFactura: Factura = {
      ...factura,
      id: uuidv4(),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    setFacturas(prev => [...prev, nuevaFactura]);
  };

  const actualizarFactura = (id: string, updates: Partial<Factura>) => {
    setFacturas(prev => prev.map(factura => 
      factura.id === id 
        ? { ...factura, ...updates, fechaModificacion: new Date().toISOString() }
        : factura
    ));
  };

  const eliminarFactura = (id: string) => {
    setFacturas(prev => prev.filter(factura => factura.id !== id));
  };

  return {
    facturas,
    agregarFactura,
    actualizarFactura,
    eliminarFactura,
  };
};

