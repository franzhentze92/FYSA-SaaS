import { useState, useEffect, useMemo, useCallback } from 'react';
import { Barco, GranoCarga, InsectSample } from '@/types/grain';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const useBarcos = () => {
  const [barcos, setBarcos] = useState<Barco[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch barcos (fondeo records) from Supabase
  const fetchBarcos = useCallback(async () => {
    try {
      const { data: barcosData, error: barcosError } = await supabase
        .from('barcos_detalle')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (barcosError) throw barcosError;

      // Fetch granos for all barcos
      const { data: granosData, error: granosError } = await supabase
        .from('barcos_granos')
        .select('*');

      if (granosError) throw granosError;

      // Map to Barco type (fondeo records)
      const formattedBarcos: Barco[] = (barcosData || []).map(barco => {
        const barcoGranos: GranoCarga[] = (granosData || [])
          .filter(g => g.barco_id === barco.id)
          .map(g => ({
            id: g.id,
            tipoGrano: g.tipo, // Use 'tipo' column (existing in DB)
            variedadId: g.variedad_id,
            cantidad: Number(g.cantidad),
          }));

        // Parse muestreo insectos from JSON if stored
        let muestreoInsectos: InsectSample[] = [];
        if (barco.muestreo_insectos) {
          try {
            muestreoInsectos = typeof barco.muestreo_insectos === 'string' 
              ? JSON.parse(barco.muestreo_insectos) 
              : barco.muestreo_insectos;
          } catch {
            muestreoInsectos = [];
          }
        }

        return {
          id: barco.id,
          barcoId: barco.barco_id,
          fechaFondeo: barco.fecha_fondeo,
          granos: barcoGranos,
          muestreoInsectos,
          requiereTratamientoOIRSA: barco.requiere_tratamiento_oirsa || false,
          notas: barco.notas,
          clienteEmail: barco.cliente_email,
        };
      });

      setBarcos(formattedBarcos);
    } catch (err) {
      console.error('Error fetching barcos:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchBarcos();
      setLoading(false);
    };
    loadData();
  }, [fetchBarcos]);

  // Real-time subscriptions
  useEffect(() => {
    const subscription = supabase
      .channel('barcos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcos_detalle' }, () => {
        fetchBarcos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcos_granos' }, () => {
        fetchBarcos();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBarcos]);

  const addBarco = async (barco: Omit<Barco, 'id'>) => {
    try {
      // Insert fondeo record
      const insertData = {
        barco_id: barco.barcoId,
        fecha_fondeo: barco.fechaFondeo,
        requiere_tratamiento_oirsa: barco.requiereTratamientoOIRSA,
        notas: barco.notas,
        cliente_email: barco.clienteEmail,
        muestreo_insectos: barco.muestreoInsectos ? JSON.stringify(barco.muestreoInsectos) : null,
      };

      const { data: barcoData, error: barcoError } = await (supabase
        .from('barcos_detalle') as any)
        .insert(insertData)
        .select()
        .single();

      if (barcoError) throw barcoError;
      if (!barcoData) throw new Error('No data returned from insert');

      // Insert granos
      if (barco.granos && barco.granos.length > 0) {
        const granosToInsert = barco.granos.map(g => ({
          id: g.id || uuidv4(),
          barco_id: barcoData.id,
          tipo: g.tipoGrano, // Use 'tipo' column (existing in DB)
          variedad_id: g.variedadId,
          cantidad: g.cantidad,
        }));

        const { error: granosError } = await (supabase
          .from('barcos_granos') as any)
          .insert(granosToInsert);

        if (granosError) throw granosError;
      }

      await fetchBarcos();
      return barcoData;
    } catch (err) {
      console.error('Error adding barco:', err);
      throw err;
    }
  };

  const updateBarco = async (id: string, updates: Partial<Barco>) => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.barcoId !== undefined) dbUpdates.barco_id = updates.barcoId;
      if (updates.fechaFondeo !== undefined) dbUpdates.fecha_fondeo = updates.fechaFondeo;
      if (updates.requiereTratamientoOIRSA !== undefined) dbUpdates.requiere_tratamiento_oirsa = updates.requiereTratamientoOIRSA;
      if (updates.notas !== undefined) dbUpdates.notas = updates.notas;
      if (updates.clienteEmail !== undefined) dbUpdates.cliente_email = updates.clienteEmail;
      if (updates.muestreoInsectos !== undefined) dbUpdates.muestreo_insectos = JSON.stringify(updates.muestreoInsectos);

      if (Object.keys(dbUpdates).length > 0) {
        const { error } = await (supabase
          .from('barcos_detalle') as any)
          .update(dbUpdates)
          .eq('id', id);

        if (error) throw error;
      }

      // Update granos if provided
      if (updates.granos) {
        // Delete existing granos
        await supabase
          .from('barcos_granos')
          .delete()
          .eq('barco_id', id);

        // Insert new granos
        if (updates.granos.length > 0) {
          const granosToInsert = updates.granos.map(g => ({
            id: g.id || uuidv4(),
            barco_id: id,
            tipo: g.tipoGrano, // Use 'tipo' column (existing in DB)
            variedad_id: g.variedadId,
            cantidad: g.cantidad,
          }));

          await (supabase
            .from('barcos_granos') as any)
            .insert(granosToInsert);
        }
      }

      await fetchBarcos();
    } catch (err) {
      console.error('Error updating barco:', err);
      throw err;
    }
  };

  const deleteBarco = async (id: string) => {
    try {
      const { error } = await supabase
        .from('barcos_detalle')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchBarcos();
    } catch (err) {
      console.error('Error deleting barco:', err);
      throw err;
    }
  };

  const getBarcoById = (id: string): Barco | undefined => {
    return barcos.find(b => b.id === id);
  };

  // Statistics
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
    loading,
    addBarco,
    updateBarco,
    deleteBarco,
    getBarcoById,
    totalBarcos,
    barcosConTratamiento,
    totalGrano,
    refetch: fetchBarcos,
  };
};
