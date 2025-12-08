import { useState, useMemo, useEffect } from 'react';
import { Silo, GrainBatch, MovimientoSilo } from '@/types/grain';
import { v4 as uuidv4 } from 'uuid';

// Inicializar 30 silos vacíos
const initializeSilos = (): Silo[] => {
  return Array.from({ length: 30 }, (_, i) => ({
    id: uuidv4(),
    number: i + 1,
    capacity: 3600, // Capacidad por defecto en toneladas
    batches: [],
    isActive: false,
  }));
};

export const useSilos = () => {
  const [silos, setSilos] = useState<Silo[]>(() => {
    // Cargar desde localStorage si existe, sino inicializar
    const saved = localStorage.getItem('silos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Asegurar que todos los silos tengan IDs y migrar batches antiguos
        return parsed.map((silo: Silo, index: number) => ({
          ...silo,
          id: silo.id || uuidv4(),
          number: silo.number || index + 1,
          nombre: silo.nombre || undefined, // Nombre opcional
          capacity: 3600, // Actualizar capacidad a 3600 toneladas
          batches: silo.batches.map((batch: GrainBatch) => ({
            ...batch,
            // Migración: asegurar que todos los campos requeridos existan
            id: batch.id || uuidv4(), // ID único del batch para trazabilidad
            barcoId: batch.barcoId || '',
            granoId: batch.granoId || uuidv4(),
            variedadId: batch.variedadId || undefined,
            siloActual: batch.siloActual || silo.number, // Silo actual (por defecto el silo donde está)
            historialMovimientos: batch.historialMovimientos || [],
          })),
        }));
      } catch {
        return initializeSilos();
      }
    }
    return initializeSilos();
  });

  // Guardar en localStorage cuando cambien los silos
  useEffect(() => {
    localStorage.setItem('silos', JSON.stringify(silos));
  }, [silos]);

  const addBatchToSilo = (siloId: string, batch: Omit<GrainBatch, 'id'>) => {
    setSilos(prev => prev.map(silo => {
      if (silo.id === siloId) {
        const newBatch: GrainBatch = {
          ...batch,
          id: uuidv4(),
          siloActual: silo.number,
          historialMovimientos: [],
        };
        return {
          ...silo,
          batches: [...silo.batches, newBatch],
          isActive: true,
        };
      }
      return silo;
    }));
  };

  const updateBatch = (siloId: string, batchId: string, batch: Partial<GrainBatch>) => {
    setSilos(prev => prev.map(silo => {
      if (silo.id === siloId) {
        return {
          ...silo,
          batches: silo.batches.map(b => 
            b.id === batchId ? { ...b, ...batch } : b
          ),
        };
      }
      return silo;
    }));
  };

  const deleteBatch = (siloId: string, batchId: string) => {
    setSilos(prev => prev.map(silo => {
      if (silo.id === siloId) {
        const newBatches = silo.batches.filter(b => b.id !== batchId);
        return {
          ...silo,
          batches: newBatches,
          isActive: newBatches.length > 0,
        };
      }
      return silo;
    }));
  };

  const updateSilo = (siloId: string, updates: Partial<Silo>) => {
    setSilos(prev => prev.map(silo => 
      silo.id === siloId ? { ...silo, ...updates } : silo
    ));
  };

  const getSiloByNumber = (number: number): Silo | undefined => {
    return silos.find(s => s.number === number);
  };

  const addSilo = (silo: Omit<Silo, 'id' | 'batches' | 'isActive'>) => {
    const newSilo: Silo = {
      ...silo,
      id: uuidv4(),
      batches: [],
      isActive: false,
    };
    setSilos(prev => [...prev, newSilo]);
  };

  const deleteSilo = (siloId: string) => {
    setSilos(prev => prev.filter(s => s.id !== siloId));
  };

  const getTotalQuantityInSilo = (siloId: string): number => {
    const silo = silos.find(s => s.id === siloId);
    if (!silo) return 0;
    
    return silo.batches.reduce((total, batch) => {
      const quantityInTonnes = batch.unit === 'tonnes' 
        ? batch.quantity 
        : batch.quantity / 1000;
      return total + quantityInTonnes;
    }, 0);
  };

  const traspasarBatch = (
    siloOrigenId: string,
    siloDestinoId: string,
    batchId: string,
    cantidad: number,
    notas?: string
  ) => {
    setSilos(prev => {
      const siloOrigen = prev.find(s => s.id === siloOrigenId);
      const siloDestino = prev.find(s => s.id === siloDestinoId);
      
      if (!siloOrigen || !siloDestino) return prev;
      
      const batch = siloOrigen.batches.find(b => b.id === batchId);
      if (!batch) return prev;
      
      // Validar que la cantidad no exceda la disponible
      const cantidadDisponible = batch.quantity;
      const cantidadATraspasar = Math.min(cantidad, cantidadDisponible);
      
      // Crear movimiento
      const movimiento: MovimientoSilo = {
        fecha: new Date().toISOString(),
        siloOrigen: siloOrigen.number,
        siloDestino: siloDestino.number,
        cantidad: cantidadATraspasar,
        notas: notas || undefined,
      };
      
      // Obtener historial completo del batch original
      const historialCompleto = [...(batch.historialMovimientos || []), movimiento];
      
      return prev.map(silo => {
        if (silo.id === siloOrigenId) {
          // Remover batch del silo origen o actualizar cantidad
          if (cantidadATraspasar >= cantidadDisponible) {
            // Traspaso completo: remover batch del silo origen
            const newBatches = silo.batches.filter(b => b.id !== batchId);
            return {
              ...silo,
              batches: newBatches,
              isActive: newBatches.length > 0,
            };
          } else {
            // Traspaso parcial: reducir cantidad y mantener historial
            return {
              ...silo,
              batches: silo.batches.map(b => 
                b.id === batchId 
                  ? { 
                      ...b, 
                      quantity: b.quantity - cantidadATraspasar,
                      historialMovimientos: historialCompleto
                    }
                  : b
              ),
            };
          }
        } else if (silo.id === siloDestinoId) {
          // Agregar batch al silo destino con historial completo
          const batchTraspasado: GrainBatch = {
            ...batch,
            quantity: cantidadATraspasar,
            siloActual: siloDestino.number,
            historialMovimientos: historialCompleto,
          };
          return {
            ...silo,
            batches: [...silo.batches, batchTraspasado],
            isActive: true,
          };
        }
        return silo;
      });
    });
  };

  const activeSilos = useMemo(() => {
    return silos.filter(s => s.isActive);
  }, [silos]);

  return {
    silos,
    activeSilos,
    addBatchToSilo,
    updateBatch,
    deleteBatch,
    traspasarBatch,
    updateSilo,
    addSilo,
    deleteSilo,
    getSiloByNumber,
    getTotalQuantityInSilo,
  };
};

