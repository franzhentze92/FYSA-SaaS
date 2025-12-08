import { useState, useEffect, useMemo } from 'react';
import { Barco } from '@/types/grain';
import { v4 as uuidv4 } from 'uuid';

export const useBarcos = () => {
  const [barcos, setBarcos] = useState<Barco[]>(() => {
    // Cargar desde localStorage si existe
    const saved = localStorage.getItem('barcos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Asegurar que todos los granos tengan ID
        return parsed.map((barco: Barco) => ({
          ...barco,
          granos: barco.granos.map((grano) => ({
            ...grano,
            id: grano.id || uuidv4(),
          })),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Guardar en localStorage cuando cambien los barcos
  useEffect(() => {
    localStorage.setItem('barcos', JSON.stringify(barcos));
  }, [barcos]);

  const addBarco = (barco: Omit<Barco, 'id'>) => {
    const newBarco: Barco = {
      ...barco,
      id: uuidv4(),
      granos: barco.granos.map(g => ({
        ...g,
        id: g.id || uuidv4(),
      })),
    };
    setBarcos(prev => [...prev, newBarco]);
  };

  const updateBarco = (id: string, updates: Partial<Barco>) => {
    setBarcos(prev => prev.map(barco => {
      if (barco.id === id) {
        const updated = { ...barco, ...updates };
        // Asegurar que todos los granos tengan ID
        if (updated.granos) {
          updated.granos = updated.granos.map(g => ({
            ...g,
            id: g.id || uuidv4(),
          }));
        }
        return updated;
      }
      return barco;
    }));
  };

  const deleteBarco = (id: string) => {
    setBarcos(prev => prev.filter(barco => barco.id !== id));
  };

  const getBarcoById = (id: string): Barco | undefined => {
    return barcos.find(b => b.id === id);
  };

  // Estadísticas
  const totalBarcos = useMemo(() => barcos.length, [barcos]);
  const barcosConTratamiento = useMemo(() => 
    barcos.filter(b => b.requiereTratamientoOIRSA).length, 
    [barcos]
  );
  const totalGrano = useMemo(() => 
    barcos.reduce((sum, b) => 
      sum + b.granos.reduce((gSum, g) => gSum + g.cantidad, 0), 0
    ), 
    [barcos]
  );

  return {
    barcos,
    addBarco,
    updateBarco,
    deleteBarco,
    getBarcoById,
    totalBarcos,
    barcosConTratamiento,
    totalGrano,
  };
};

