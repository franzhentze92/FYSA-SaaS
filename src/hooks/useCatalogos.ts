import { useState, useEffect, useCallback } from 'react';
import { BarcoMaestro, VariedadGrano, GRAIN_TYPES } from '@/types/grain';
import { supabase } from '@/lib/supabase';

export const useCatalogos = () => {
  const [barcosMaestros, setBarcosMaestros] = useState<BarcoMaestro[]>([]);
  const [variedadesGrano, setVariedadesGrano] = useState<VariedadGrano[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch barcos maestros from Supabase
  const fetchBarcosMaestros = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('barcos_maestros')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const formatted: BarcoMaestro[] = (data || []).map(b => ({
        id: b.id,
        nombre: b.nombre,
        clienteEmail: b.cliente_email,
        activo: b.activo,
        fechaCreacion: b.fecha_creacion,
        fechaModificacion: b.fecha_creacion, // Use creation date as fallback
      }));

      setBarcosMaestros(formatted);
    } catch (err) {
      console.error('Error fetching barcos maestros:', err);
    }
  }, []);

  // Fetch variedades grano from Supabase
  const fetchVariedadesGrano = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('variedades_grano')
        .select('*')
        .order('tipo_grano', { ascending: true });

      if (error) throw error;

      const formatted: VariedadGrano[] = (data || []).map(v => ({
        id: v.id,
        tipoGrano: v.tipo_grano,
        variedad: v.variedad,
        activo: v.activo,
        costoPorKg: v.costo_por_kg != null ? parseFloat(v.costo_por_kg) : undefined,
      }));

      setVariedadesGrano(formatted);
    } catch (err) {
      console.error('Error fetching variedades grano:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBarcosMaestros(), fetchVariedadesGrano()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBarcosMaestros, fetchVariedadesGrano]);

  // Real-time subscriptions
  useEffect(() => {
    const barcosSubscription = supabase
      .channel('barcos-maestros-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcos_maestros' }, () => {
        fetchBarcosMaestros();
      })
      .subscribe();

    const variedadesSubscription = supabase
      .channel('variedades-grano-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variedades_grano' }, () => {
        fetchVariedadesGrano();
      })
      .subscribe();

    return () => {
      barcosSubscription.unsubscribe();
      variedadesSubscription.unsubscribe();
    };
  }, [fetchBarcosMaestros, fetchVariedadesGrano]);

  // Barcos Maestros functions
  const addBarcoMaestro = async (barco: Omit<BarcoMaestro, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    try {
      const { data, error } = await supabase
        .from('barcos_maestros')
        .insert({
          nombre: barco.nombre,
          cliente_email: barco.clienteEmail,
          activo: barco.activo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchBarcosMaestros();
      return data;
    } catch (err) {
      console.error('Error adding barco maestro:', err);
      throw err;
    }
  };

  const updateBarcoMaestro = async (id: string, updates: Partial<BarcoMaestro>) => {
    try {
      const dbUpdates: any = {};
      if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
      if (updates.clienteEmail !== undefined) dbUpdates.cliente_email = updates.clienteEmail;
      if (updates.activo !== undefined) dbUpdates.activo = updates.activo;

      const { error } = await supabase
        .from('barcos_maestros')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchBarcosMaestros();
    } catch (err) {
      console.error('Error updating barco maestro:', err);
      throw err;
    }
  };

  const deleteBarcoMaestro = async (id: string) => {
    try {
      // Check if there are any related records in barcos_detalle
      const { data: relatedRecords, error: checkError } = await supabase
        .from('barcos_detalle')
        .select('id')
        .eq('barco_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (relatedRecords && relatedRecords.length > 0) {
        throw new Error('No se puede eliminar este barco porque tiene registros de fondeo asociados. Primero elimine los registros de fondeo relacionados.');
      }

      const { error } = await supabase
        .from('barcos_maestros')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBarcosMaestros();
    } catch (err: any) {
      console.error('Error deleting barco maestro:', err);
      // Throw a user-friendly error message
      if (err.code === '23503') {
        throw new Error('No se puede eliminar este barco porque tiene registros de fondeo asociados. Primero elimine los registros de fondeo relacionados.');
      }
      throw err instanceof Error ? err : new Error(err.message || 'Error al eliminar el barco');
    }
  };

  const getBarcoMaestroById = (id: string): BarcoMaestro | undefined => {
    return barcosMaestros.find(b => b.id === id);
  };

  const getBarcosActivos = () => {
    return barcosMaestros.filter(b => b.activo);
  };

  // Variedades Grano functions
  const addVariedadGrano = async (variedad: Omit<VariedadGrano, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('variedades_grano')
        .insert({
          tipo_grano: variedad.tipoGrano,
          variedad: variedad.variedad,
          activo: variedad.activo ?? true,
          costo_por_kg: variedad.costoPorKg ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchVariedadesGrano();
      return data;
    } catch (err) {
      console.error('Error adding variedad grano:', err);
      throw err;
    }
  };

  const updateVariedadGrano = async (id: string, updates: Partial<VariedadGrano>) => {
    try {
      const dbUpdates: any = {};
      if (updates.tipoGrano !== undefined) dbUpdates.tipo_grano = updates.tipoGrano;
      if (updates.variedad !== undefined) dbUpdates.variedad = updates.variedad;
      if (updates.activo !== undefined) dbUpdates.activo = updates.activo;
      if (updates.costoPorKg !== undefined) dbUpdates.costo_por_kg = updates.costoPorKg ?? null;

      const { error } = await supabase
        .from('variedades_grano')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchVariedadesGrano();
    } catch (err) {
      console.error('Error updating variedad grano:', err);
      throw err;
    }
  };

  const deleteVariedadGrano = async (id: string) => {
    try {
      const { error } = await supabase
        .from('variedades_grano')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchVariedadesGrano();
    } catch (err) {
      console.error('Error deleting variedad grano:', err);
      throw err;
    }
  };

  const deleteAllVariedades = async () => {
    try {
      const { error } = await supabase
        .from('variedades_grano')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;
      await fetchVariedadesGrano();
    } catch (err) {
      console.error('Error deleting all variedades:', err);
      throw err;
    }
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

  const getTiposGranoConVariedades = (soloActivas: boolean = false) => {
    const tipos = GRAIN_TYPES.map(tipo => ({
      tipo,
      variedades: getVariedadesByTipoGrano(tipo, soloActivas),
    }));
    return tipos;
  };

  return {
    // Loading state
    loading,
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
    // Refetch
    refetch: () => Promise.all([fetchBarcosMaestros(), fetchVariedadesGrano()]),
  };
};
