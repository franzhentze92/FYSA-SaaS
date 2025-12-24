import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { FumigacionSilo } from '@/types/grain';
import { format } from 'date-fns';

export const useFumigacionSilos = () => {
  const [fumigaciones, setFumigaciones] = useState<FumigacionSilo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all fumigaciones
  const fetchFumigaciones = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fumigaciones_silos')
        .select('*')
        .order('fecha_fumigacion', { ascending: false });

      if (error) throw error;

      const formattedFumigaciones: FumigacionSilo[] = (data || []).map((item: any) => ({
        id: item.id,
        silo: item.silo,
        tipoGrano: item.tipo_grano,
        batchId: item.batch_id || undefined,
        servicioId: item.servicio_id || undefined,
        fechaFumigacion: item.fecha_fumigacion,
        productoUtilizado: item.producto_utilizado || undefined,
        dosis: item.dosis || undefined,
        unidadMedida: item.unidad_medida || undefined,
        tecnico: item.tecnico || undefined,
        notas: item.notas || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      setFumigaciones(formattedFumigaciones);
    } catch (error) {
      console.error('Error fetching fumigaciones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFumigaciones();
  }, [fetchFumigaciones]);

  // Add fumigacion
  const addFumigacion = async (fumigacion: Omit<FumigacionSilo, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabase
        .from('fumigaciones_silos')
        .insert({
          silo: fumigacion.silo,
          tipo_grano: fumigacion.tipoGrano,
          batch_id: fumigacion.batchId || null,
          servicio_id: fumigacion.servicioId || null,
          fecha_fumigacion: fumigacion.fechaFumigacion,
          producto_utilizado: fumigacion.productoUtilizado || null,
          dosis: fumigacion.dosis || null,
          unidad_medida: fumigacion.unidadMedida || null,
          tecnico: fumigacion.tecnico || null,
          notas: fumigacion.notas || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchFumigaciones();
      return data.id;
    } catch (error) {
      console.error('Error adding fumigacion:', error);
      throw error;
    }
  };

  // Update fumigacion
  const updateFumigacion = async (id: string, fumigacion: Partial<Omit<FumigacionSilo, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const updateData: any = {};
      if (fumigacion.silo !== undefined) updateData.silo = fumigacion.silo;
      if (fumigacion.tipoGrano !== undefined) updateData.tipo_grano = fumigacion.tipoGrano;
      if (fumigacion.batchId !== undefined) updateData.batch_id = fumigacion.batchId || null;
      if (fumigacion.servicioId !== undefined) updateData.servicio_id = fumigacion.servicioId || null;
      if (fumigacion.fechaFumigacion !== undefined) updateData.fecha_fumigacion = fumigacion.fechaFumigacion;
      if (fumigacion.productoUtilizado !== undefined) updateData.producto_utilizado = fumigacion.productoUtilizado || null;
      if (fumigacion.dosis !== undefined) updateData.dosis = fumigacion.dosis || null;
      if (fumigacion.unidadMedida !== undefined) updateData.unidad_medida = fumigacion.unidadMedida || null;
      if (fumigacion.tecnico !== undefined) updateData.tecnico = fumigacion.tecnico || null;
      if (fumigacion.notas !== undefined) updateData.notas = fumigacion.notas || null;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('fumigaciones_silos')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchFumigaciones();
    } catch (error) {
      console.error('Error updating fumigacion:', error);
      throw error;
    }
  };

  // Delete fumigacion
  const deleteFumigacion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fumigaciones_silos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchFumigaciones();
    } catch (error) {
      console.error('Error deleting fumigacion:', error);
      throw error;
    }
  };

  // Get last fumigacion for a silo and grain type
  const getLastFumigacion = useCallback((silo: string, tipoGrano: string): FumigacionSilo | null => {
    const matchingFumigaciones = fumigaciones.filter(
      f => f.silo === silo && f.tipoGrano === tipoGrano
    );
    
    if (matchingFumigaciones.length === 0) return null;
    
    // Sort by date descending and return the most recent
    const sorted = matchingFumigaciones.sort((a, b) => 
      new Date(b.fechaFumigacion).getTime() - new Date(a.fechaFumigacion).getTime()
    );
    
    return sorted[0];
  }, [fumigaciones]);

  return {
    fumigaciones,
    loading,
    addFumigacion,
    updateFumigacion,
    deleteFumigacion,
    getLastFumigacion,
    refetch: fetchFumigaciones,
  };
};

