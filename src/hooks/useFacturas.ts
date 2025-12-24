import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Factura } from '@/types/factura';

export const useFacturas = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch facturas from Supabase
  const fetchFacturas = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const formattedFacturas: Factura[] = (data || []).map(f => ({
        id: f.id,
        fechaFactura: f.fecha_factura,
        numeroFactura: f.numero_factura,
        clienteEmail: f.cliente_email,
        reporteIds: f.reporte_ids || [],
        notas: f.notas,
        fechaCreacion: f.fecha_creacion,
        fechaModificacion: f.fecha_modificacion,
        archivo: f.archivo_url ? {
          nombre: f.archivo_nombre || 'documento.pdf',
          tipo: 'application/pdf',
          tamaño: 0,
          contenido: '', // We'll load content on demand
          url: f.archivo_url,
        } : undefined,
      }));

      setFacturas(formattedFacturas);
    } catch (err) {
      console.error('Error fetching facturas:', err);
      setError(err instanceof Error ? err.message : 'Error fetching facturas');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchFacturas();
      setLoading(false);
    };
    loadData();
  }, [fetchFacturas]);

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('facturas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facturas' }, () => {
        fetchFacturas();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchFacturas]);

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, facturaId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${facturaId}.${fileExt}`;
      const filePath = `facturas/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      return null;
    }
  };

  const agregarFactura = async (factura: Omit<Factura, 'id' | 'fechaCreacion' | 'fechaModificacion'>) => {
    try {
      // First, insert the factura without the file
      const { data, error } = await supabase
        .from('facturas')
        .insert({
          fecha_factura: factura.fechaFactura,
          numero_factura: factura.numeroFactura,
          cliente_email: factura.clienteEmail,
          reporte_ids: factura.reporteIds || [],
          notas: factura.notas,
        })
        .select()
        .single();

      if (error) throw error;

      // If there's a file with base64 content, upload it to storage
      if (factura.archivo?.contenido) {
        // Convert base64 to blob
        const byteCharacters = atob(factura.archivo.contenido);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const file = new File([blob], factura.archivo.nombre, { type: 'application/pdf' });

        const fileUrl = await uploadFile(file, data.id);

        if (fileUrl) {
          // Update the factura with the file URL
          await supabase
            .from('facturas')
            .update({
              archivo_url: fileUrl,
              archivo_nombre: factura.archivo.nombre,
            })
            .eq('id', data.id);
        }
      }

      await fetchFacturas();
      return data;
    } catch (err) {
      console.error('Error adding factura:', err);
      throw err;
    }
  };

  const actualizarFactura = async (id: string, updates: Partial<Factura>) => {
    try {
      const dbUpdates: any = {
        fecha_modificacion: new Date().toISOString(),
      };

      if (updates.fechaFactura !== undefined) dbUpdates.fecha_factura = updates.fechaFactura;
      if (updates.numeroFactura !== undefined) dbUpdates.numero_factura = updates.numeroFactura;
      if (updates.clienteEmail !== undefined) dbUpdates.cliente_email = updates.clienteEmail;
      if (updates.reporteIds !== undefined) dbUpdates.reporte_ids = updates.reporteIds;
      if (updates.notas !== undefined) dbUpdates.notas = updates.notas;

      // Handle file upload if there's new file content
      if (updates.archivo?.contenido) {
        const byteCharacters = atob(updates.archivo.contenido);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const file = new File([blob], updates.archivo.nombre, { type: 'application/pdf' });

        const fileUrl = await uploadFile(file, id);
        if (fileUrl) {
          dbUpdates.archivo_url = fileUrl;
          dbUpdates.archivo_nombre = updates.archivo.nombre;
        }
      }

      const { error } = await supabase
        .from('facturas')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      await fetchFacturas();
    } catch (err) {
      console.error('Error updating factura:', err);
      throw err;
    }
  };

  const eliminarFactura = async (id: string) => {
    try {
      // Delete file from storage if exists
      const factura = facturas.find(f => f.id === id);
      if (factura?.archivo) {
        const filePath = `facturas/${id}.pdf`;
        await supabase.storage.from('documentos').remove([filePath]);
      }

      const { error } = await supabase
        .from('facturas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFacturas(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Error deleting factura:', err);
      throw err;
    }
  };

  return {
    facturas,
    loading,
    error,
    agregarFactura,
    actualizarFactura,
    eliminarFactura,
    refetch: fetchFacturas,
  };
};
