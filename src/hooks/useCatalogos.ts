import { useState, useEffect } from 'react';
import { BarcoMaestro, VariedadGrano, GRAIN_TYPES } from '@/types/grain';
import { v4 as uuidv4 } from 'uuid';

export const useCatalogos = () => {
  // Barcos Maestros
  const [barcosMaestros, setBarcosMaestros] = useState<BarcoMaestro[]>(() => {
    const saved = localStorage.getItem('barcosMaestros');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migración: agregar fechas si no existen
        return parsed.map((barco: any) => ({
          ...barco,
          fechaCreacion: barco.fechaCreacion || new Date().toISOString(),
          fechaModificacion: barco.fechaModificacion || new Date().toISOString(),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Variedades de Granos
  const [variedadesGrano, setVariedadesGrano] = useState<VariedadGrano[]>(() => {
    const saved = localStorage.getItem('variedadesGrano');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('barcosMaestros', JSON.stringify(barcosMaestros));
  }, [barcosMaestros]);

  useEffect(() => {
    localStorage.setItem('variedadesGrano', JSON.stringify(variedadesGrano));
  }, [variedadesGrano]);

  // Funciones para Barcos Maestros
  const addBarcoMaestro = (barco: Omit<BarcoMaestro, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    const newBarco: BarcoMaestro = {
      ...barco,
      id: uuidv4(),
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };
    setBarcosMaestros(prev => [...prev, newBarco]);
  };

  const updateBarcoMaestro = (id: string, updates: Partial<BarcoMaestro>) => {
    setBarcosMaestros(prev => prev.map(barco => 
      barco.id === id ? { ...barco, ...updates, fechaModificacion: new Date().toISOString() } : barco
    ));
  };

  const deleteBarcoMaestro = (id: string) => {
    setBarcosMaestros(prev => prev.filter(barco => barco.id !== id));
  };

  const getBarcoMaestroById = (id: string): BarcoMaestro | undefined => {
    return barcosMaestros.find(b => b.id === id);
  };

  const getBarcosActivos = () => {
    return barcosMaestros.filter(b => b.activo);
  };

  // Funciones para Variedades de Grano
  const addVariedadGrano = (variedad: Omit<VariedadGrano, 'id'>) => {
    const newVariedad: VariedadGrano = {
      ...variedad,
      id: uuidv4(),
    };
    setVariedadesGrano(prev => [...prev, newVariedad]);
  };

  const updateVariedadGrano = (id: string, updates: Partial<VariedadGrano>) => {
    setVariedadesGrano(prev => prev.map(v => 
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  const deleteVariedadGrano = (id: string) => {
    setVariedadesGrano(prev => prev.filter(v => v.id !== id));
  };

  const deleteAllVariedades = () => {
    setVariedadesGrano([]);
  };

  const getVariedadesByTipoGrano = (tipoGrano: string, soloActivas: boolean = false): VariedadGrano[] => {
    if (soloActivas) {
      return variedadesGrano.filter(v => v.tipoGrano === tipoGrano && v.activo);
    }
    return variedadesGrano.filter(v => v.tipoGrano === tipoGrano);
  };

  const getVariedadesActivas = () => {
    return variedadesGrano.filter(v => v.activo);
  };

  const getVariedadNombre = (variedadId?: string): string | null => {
    if (!variedadId) return null;
    const variedad = variedadesGrano.find(v => v.id === variedadId);
    return variedad?.variedad || null;
  };

  // Obtener tipos de grano únicos con sus variedades
  const getTiposGranoConVariedades = (soloActivas: boolean = false) => {
    const tipos = GRAIN_TYPES.map(tipo => ({
      tipo,
      variedades: getVariedadesByTipoGrano(tipo, soloActivas),
    }));
    return tipos;
  };

  return {
    // Barcos Maestros
    barcosMaestros,
    addBarcoMaestro,
    updateBarcoMaestro,
    deleteBarcoMaestro,
    getBarcoMaestroById,
    getBarcosActivos,
    // Variedades de Grano
    variedadesGrano,
    addVariedadGrano,
    updateVariedadGrano,
    deleteVariedadGrano,
    deleteAllVariedades,
    getVariedadesByTipoGrano,
    getVariedadesActivas,
    getVariedadNombre,
    getTiposGranoConVariedades,
  };
};

