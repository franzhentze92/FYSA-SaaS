import { useState, useMemo, useEffect, useCallback } from 'react';
import { Silo, GrainBatch, MovimientoSilo, ActualizacionCantidad } from '@/types/grain';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const useSilos = () => {
  const [silos, setSilos] = useState<Silo[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize default silos if none exist
  const initializeSilos = async () => {
    const { data: existingSilos } = await supabase
      .from('silos')
      .select('id')
      .limit(1);

    if (!existingSilos || existingSilos.length === 0) {
      // Create 30 default silos
      const defaultSilos = Array.from({ length: 30 }, (_, i) => ({
        nombre: `Silo ${i + 1}`,
        capacidad: 3600,
        ubicacion: 'Principal',
        activo: false,
      }));

      await (supabase.from('silos') as any).insert(defaultSilos);
    }
  };

  // Fetch silos from Supabase
  const fetchSilos = useCallback(async () => {
    try {
      const { data: silosData, error: silosError } = await supabase
        .from('silos')
        .select('*')
        .order('nombre', { ascending: true });

      if (silosError) throw silosError;

      // Fetch batches for all silos
      const { data: batchesData, error: batchesError } = await supabase
        .from('grain_batches')
        .select('*');

      if (batchesError) throw batchesError;

      // Fetch movements for all batches
      const { data: movementsData } = await supabase
        .from('batch_movements')
        .select('*')
        .order('fecha', { ascending: true });

      // Fetch quantity updates for all batches
      // Note: This table might not exist yet - handle gracefully
      const { data: quantityUpdatesData, error: quantityUpdatesError } = await supabase
        .from('batch_quantity_updates')
        .select('*')
        .order('fecha', { ascending: true });
      
      // If table doesn't exist (404 or PGRST116 error), just use empty array (table will be created later)
      if (quantityUpdatesError) {
        // Handle 404 or table not found errors gracefully
        const isTableNotFound = 
          quantityUpdatesError.code === 'PGRST116' || 
          quantityUpdatesError.code === '42P01' ||
          quantityUpdatesError.message?.toLowerCase().includes('does not exist') ||
          quantityUpdatesError.message?.toLowerCase().includes('relation') ||
          (quantityUpdatesError as any).status === 404;
        
        if (isTableNotFound) {
          console.warn('Table batch_quantity_updates does not exist yet. Run the migration script (supabase/batch-quantity-updates-schema.sql) to create it.');
        } else {
          console.error('Error fetching quantity updates:', quantityUpdatesError);
        }
      }

      // Map batches to silos
      const formattedSilos: Silo[] = ((silosData || []) as any[]).map((silo: any, index: number) => {
        const siloBatches = ((batchesData || []) as any[])
          .filter((b: any) => b.silo_id === silo.id)
          .map((b: any) => {
            const batchMovements = ((movementsData || []) as any[])
              .filter((m: any) => m.batch_id === b.id)
              .map((m: any) => ({
                fecha: m.fecha,
                siloOrigen: m.silo_origen,
                siloDestino: m.silo_destino,
                cantidad: m.cantidad,
                notas: m.notas,
              }));

            // Get quantity updates for this batch
            const batchQuantityUpdates = ((quantityUpdatesData || []) as any[])
              .filter((q: any) => q.batch_id === b.id)
              .map((q: any) => {
                // Find the silo number for this update
                const updateSilo = ((silosData || []) as any[]).find((s: any) => s.id === q.silo_id);
                const siloIndex = ((silosData || []) as any[]).findIndex((s: any) => s.id === q.silo_id);
                
                return {
                  fecha: q.fecha,
                  cantidadAnterior: Number(q.cantidad_anterior),
                  cantidadNueva: Number(q.cantidad_nueva),
                  cantidadCambio: Number(q.cantidad_cambio),
                  unit: (q.unit || 'tonnes') as 'kg' | 'tonnes',
                  siloNumero: siloIndex >= 0 ? siloIndex + 1 : (updateSilo ? Number(updateSilo.nombre?.match(/\d+/)?.[0]) || 0 : 0),
                  notas: q.notas,
                } as ActualizacionCantidad;
              });

            return {
              id: b.id,
              barcoId: b.barco_id || '',
              granoId: b.grano_id || uuidv4(),
              variedadId: b.variedad_id,
              grainType: b.grain_type,
              grainSubtype: b.grain_subtype,
              quantity: Number(b.quantity),
              unit: b.unit || 'tonnes',
              entryDate: b.entry_date,
              origin: b.origin,
              notes: b.notes,
              siloActual: b.silo_actual || silo.number || index + 1,
              historialMovimientos: batchMovements,
              historialActualizaciones: batchQuantityUpdates,
            } as GrainBatch;
          });

        return {
          id: silo.id,
          number: index + 1,
          nombre: silo.nombre,
          capacity: silo.capacidad || 3600,
          batches: siloBatches,
          isActive: siloBatches.length > 0,
          clienteEmail: silo.cliente_email,
        };
      });

      setSilos(formattedSilos);
    } catch (err) {
      console.error('Error fetching silos:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await initializeSilos();
      await fetchSilos();
      setLoading(false);
    };
    loadData();
  }, [fetchSilos]);

  // Real-time subscriptions
  useEffect(() => {
    const silosSubscription = supabase
      .channel('silos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'silos' }, () => {
        fetchSilos();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grain_batches' }, () => {
        fetchSilos();
      })
      .subscribe();

    return () => {
      silosSubscription.unsubscribe();
    };
  }, [fetchSilos]);

  const addBatchToSilo = async (siloId: string, batch: Omit<GrainBatch, 'id'>) => {
    try {
      const silo = silos.find(s => s.id === siloId);
      if (!silo) return;

      const { data, error } = await (supabase
        .from('grain_batches') as any)
        .insert({
          silo_id: siloId,
          barco_id: batch.barcoId,
          grano_id: batch.granoId || uuidv4(),
          variedad_id: batch.variedadId,
          grain_type: batch.grainType,
          grain_subtype: batch.grainSubtype,
          quantity: batch.quantity,
          unit: batch.unit,
          entry_date: batch.entryDate,
          origin: batch.origin,
          notes: batch.notes,
          silo_actual: silo.number,
        })
        .select()
        .single();

      if (error) throw error;

      // Update silo to active
      await (supabase
        .from('silos') as any)
        .update({ activo: true })
        .eq('id', siloId);

      await fetchSilos();
      return data;
    } catch (err) {
      console.error('Error adding batch:', err);
      throw err;
    }
  };

  const updateBatch = async (siloId: string, batchId: string, batch: Partial<GrainBatch>) => {
    try {
      // Si se está actualizando la cantidad, obtener la cantidad anterior para registrar el cambio
      if (batch.quantity !== undefined) {
        const { data: existingBatch } = await supabase
          .from('grain_batches')
          .select('quantity, unit, silo_actual')
          .eq('id', batchId)
          .single();

        if (existingBatch) {
          const existingBatchData = existingBatch as any;
          const cantidadAnterior = Number(existingBatchData.quantity);
          const cantidadNueva = batch.quantity;
          const cantidadCambio = cantidadNueva - cantidadAnterior;
          const unit = batch.unit || existingBatchData.unit || 'tonnes';

          // Solo registrar si la cantidad realmente cambió
          if (Math.abs(cantidadCambio) > 0.001) {
            // Obtener el silo para tener el silo_id correcto
            const silo = silos.find(s => s.id === siloId);
            if (silo) {
              const { error: insertError } = await supabase.from('batch_quantity_updates').insert({
                batch_id: batchId,
                silo_id: siloId,
                cantidad_anterior: cantidadAnterior,
                cantidad_nueva: cantidadNueva,
                cantidad_cambio: cantidadCambio,
                unit: unit,
                notas: batch.notes || null,
              } as any);
              
              // If table doesn't exist (404 error), log warning but don't fail
              if (insertError) {
                const isTableNotFound = 
                  insertError.code === 'PGRST116' || 
                  insertError.code === '42P01' ||
                  insertError.message?.toLowerCase().includes('does not exist') ||
                  insertError.message?.toLowerCase().includes('relation') ||
                  (insertError as any).status === 404;
                
                if (isTableNotFound) {
                  console.warn('Table batch_quantity_updates does not exist. Quantity update was not logged. Run the migration script (supabase/batch-quantity-updates-schema.sql) to create it.');
                } else {
                  console.error('Error inserting quantity update:', insertError);
                }
              }
            }
          }
        }
      }

      const updates: any = {};
      if (batch.barcoId !== undefined) updates.barco_id = batch.barcoId;
      if (batch.granoId !== undefined) updates.grano_id = batch.granoId;
      if (batch.variedadId !== undefined) updates.variedad_id = batch.variedadId;
      if (batch.grainType !== undefined) updates.grain_type = batch.grainType;
      if (batch.grainSubtype !== undefined) updates.grain_subtype = batch.grainSubtype;
      if (batch.quantity !== undefined) updates.quantity = batch.quantity;
      if (batch.unit !== undefined) updates.unit = batch.unit;
      if (batch.entryDate !== undefined) updates.entry_date = batch.entryDate;
      if (batch.origin !== undefined) updates.origin = batch.origin;
      if (batch.notes !== undefined) updates.notes = batch.notes;
      if (batch.siloActual !== undefined) updates.silo_actual = batch.siloActual;

      const { error } = await (supabase
        .from('grain_batches') as any)
        .update(updates)
        .eq('id', batchId);

      if (error) throw error;
      await fetchSilos();
    } catch (err) {
      console.error('Error updating batch:', err);
      throw err;
    }
  };

  // Remove batch from silo (despachar) without deleting it from the database
  // This keeps the batch in history but makes the silo empty
  const removeBatchFromSilo = async (siloId: string, batchId: string) => {
    try {
      // Set silo_id and silo_actual to null to disconnect the batch from the silo
      const { error } = await (supabase
        .from('grain_batches') as any)
        .update({ 
          silo_id: null,
          silo_actual: null,
        })
        .eq('id', batchId);

      if (error) throw error;

      // Check if silo still has batches
      const { data: remainingBatches } = await supabase
        .from('grain_batches')
        .select('id')
        .eq('silo_id', siloId);

      if (!remainingBatches || remainingBatches.length === 0) {
        await (supabase
          .from('silos') as any)
          .update({ activo: false })
          .eq('id', siloId);
      }

      await fetchSilos();
    } catch (err) {
      console.error('Error removing batch from silo:', err);
      throw err;
    }
  };

  // Delete batch completely from database
  const deleteBatch = async (siloId: string, batchId: string) => {
    try {
      const { error } = await supabase
        .from('grain_batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      // Check if silo still has batches
      const { data: remainingBatches } = await supabase
        .from('grain_batches')
        .select('id')
        .eq('silo_id', siloId);

      if (!remainingBatches || remainingBatches.length === 0) {
        await (supabase
          .from('silos') as any)
          .update({ activo: false })
          .eq('id', siloId);
      }

      await fetchSilos();
    } catch (err) {
      console.error('Error deleting batch:', err);
      throw err;
    }
  };

  const updateSilo = async (siloId: string, updates: Partial<Silo>) => {
    try {
      const dbUpdates: any = {};
      if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre;
      if (updates.capacity !== undefined) dbUpdates.capacidad = updates.capacity;
      if (updates.clienteEmail !== undefined) dbUpdates.cliente_email = updates.clienteEmail;

      const { error } = await (supabase
        .from('silos') as any)
        .update(dbUpdates)
        .eq('id', siloId);

      if (error) throw error;
      await fetchSilos();
    } catch (err) {
      console.error('Error updating silo:', err);
      throw err;
    }
  };

  const getSiloByNumber = (number: number): Silo | undefined => {
    return silos.find(s => s.number === number);
  };

  const addSilo = async (silo: Omit<Silo, 'id' | 'batches' | 'isActive'>) => {
    try {
      const { data, error } = await (supabase
        .from('silos') as any)
        .insert({
          nombre: silo.nombre || `Silo ${silos.length + 1}`,
          capacidad: silo.capacity || 3600,
          ubicacion: 'Principal',
          cliente_email: silo.clienteEmail,
          activo: false,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchSilos();
      return data;
    } catch (err) {
      console.error('Error adding silo:', err);
      throw err;
    }
  };

  const deleteSilo = async (siloId: string) => {
    try {
      const { error } = await supabase
        .from('silos')
        .delete()
        .eq('id', siloId);

      if (error) throw error;
      await fetchSilos();
    } catch (err) {
      console.error('Error deleting silo:', err);
      throw err;
    }
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

  const traspasarBatch = async (
    siloOrigenId: string,
    siloDestinoId: string,
    batchId: string,
    cantidad: number,
    notas?: string
  ) => {
    try {
      const siloOrigen = silos.find(s => s.id === siloOrigenId);
      const siloDestino = silos.find(s => s.id === siloDestinoId);
      
      if (!siloOrigen || !siloDestino) return;
      
      const batch = siloOrigen.batches.find(b => b.id === batchId);
      if (!batch) return;
      
      const cantidadDisponible = batch.quantity;
      const cantidadATraspasar = Math.min(cantidad, cantidadDisponible);

      // Record movement
      await (supabase.from('batch_movements') as any).insert({
        batch_id: batchId,
        silo_origen: siloOrigen.number,
        silo_destino: siloDestino.number,
        cantidad: cantidadATraspasar,
        notas: notas || null,
      });

      if (cantidadATraspasar >= cantidadDisponible) {
        // Full transfer - move batch to new silo
        await (supabase
          .from('grain_batches') as any)
          .update({ 
            silo_id: siloDestinoId,
            silo_actual: siloDestino.number,
          })
          .eq('id', batchId);
      } else {
        // Partial transfer - reduce original and create new batch
        await (supabase
          .from('grain_batches') as any)
          .update({ quantity: cantidadDisponible - cantidadATraspasar })
          .eq('id', batchId);

        await (supabase.from('grain_batches') as any).insert({
          silo_id: siloDestinoId,
          barco_id: batch.barcoId,
          grano_id: batch.granoId,
          variedad_id: batch.variedadId,
          grain_type: batch.grainType,
          grain_subtype: batch.grainSubtype,
          quantity: cantidadATraspasar,
          unit: batch.unit,
          entry_date: batch.entryDate,
          origin: batch.origin,
          notes: batch.notes,
          silo_actual: siloDestino.number,
        });
      }

      // Update silo active states
      const { data: origenBatches } = await supabase
        .from('grain_batches')
        .select('id')
        .eq('silo_id', siloOrigenId);

      await (supabase
        .from('silos') as any)
        .update({ activo: (origenBatches?.length || 0) > 0 })
        .eq('id', siloOrigenId);

      await (supabase
        .from('silos') as any)
        .update({ activo: true })
        .eq('id', siloDestinoId);

      await fetchSilos();
    } catch (err) {
      console.error('Error transferring batch:', err);
      throw err;
    }
  };

  const activeSilos = useMemo(() => {
    return silos.filter(s => s.isActive);
  }, [silos]);

  return {
    silos,
    activeSilos,
    loading,
    addBatchToSilo,
    updateBatch,
    deleteBatch,
    removeBatchFromSilo,
    traspasarBatch,
    updateSilo,
    addSilo,
    deleteSilo,
    getSiloByNumber,
    getTotalQuantityInSilo,
    refetch: fetchSilos,
  };
};
