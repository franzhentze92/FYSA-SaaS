import { useState, useEffect, useCallback } from 'react';
import { DocumentoServicio } from '@/types/servicio';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type DocumentoServicioDB = Database['public']['Tables']['documentos_servicio']['Row'];
type DocumentoServicioInsert = Database['public']['Tables']['documentos_servicio']['Insert'];
type DocumentoServicioUpdate = Database['public']['Tables']['documentos_servicio']['Update'];

export const useServicios = (servicioId: number, clienteEmail?: string) => {
  const [documentos, setDocumentos] = useState<DocumentoServicio[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch documentos from Supabase
  const fetchDocumentos = useCallback(async () => {
    if (servicioId === 0) {
      setDocumentos([]);
      return;
    }

    try {
      let query = supabase
        .from('documentos_servicio')
        .select('*')
        .eq('servicio_id', servicioId);
      
      // If clienteEmail is provided, also filter by client
      if (clienteEmail) {
        query = query.eq('cliente_email', clienteEmail);
      }
      
      const { data, error } = await query.order('fecha_servicio', { ascending: false });

      if (error) throw error;

      const formattedDocumentos: DocumentoServicio[] = ((data || []) as DocumentoServicioDB[]).map(doc => ({
        id: doc.id,
        servicioId: doc.servicio_id,
        fechaServicio: doc.fecha_servicio,
        numeroReporte: doc.numero_reporte,
        notas: doc.notas,
        fechaCreacion: doc.fecha_creacion,
        fechaModificacion: doc.fecha_modificacion,
        archivo: doc.archivo_url ? {
          nombre: doc.archivo_nombre || 'documento.pdf',
          tipo: 'application/pdf',
          tamaño: 0,
          contenido: '',
          url: doc.archivo_url,
        } : undefined,
      }));

      setDocumentos(formattedDocumentos);
    } catch (err) {
      console.error('Error fetching documentos:', err);
    }
  }, [servicioId, clienteEmail]);

  // Initial fetch and when servicioId changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDocumentos();
      setLoading(false);
    };
    loadData();
  }, [fetchDocumentos]);

  // Real-time subscription
  useEffect(() => {
    if (servicioId === 0) return;

    const subscription = supabase
      .channel(`documentos-${servicioId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documentos_servicio',
        filter: `servicio_id=eq.${servicioId}`
      }, () => {
        fetchDocumentos();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [servicioId, fetchDocumentos]);

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, documentoId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentoId}.${fileExt}`;
      const filePath = `servicios/${servicioId}/${fileName}`;

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

  const agregarDocumento = async (documento: Omit<DocumentoServicio, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'servicioId'> & { clienteEmail?: string; clienteNombre?: string }) => {
    if (servicioId === 0) {
      console.error('No se puede agregar documento: servicioId es 0');
      return;
    }

    try {
      const insertData: DocumentoServicioInsert = {
        servicio_id: servicioId,
        fecha_servicio: documento.fechaServicio,
        numero_reporte: documento.numeroReporte,
        notas: documento.notas,
        cliente_email: documento.clienteEmail || null,
        cliente_nombre: documento.clienteNombre || null,
      };

      const { data, error } = await (supabase
        .from('documentos_servicio') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      const insertedData = data as DocumentoServicioDB;

      // If there's a file with base64 content, upload it to storage
      if (documento.archivo?.contenido) {
        const byteCharacters = atob(documento.archivo.contenido);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const file = new File([blob], documento.archivo.nombre, { type: 'application/pdf' });

        const fileUrl = await uploadFile(file, insertedData.id);

        if (fileUrl) {
          const updateData: DocumentoServicioUpdate = {
            archivo_url: fileUrl,
            archivo_nombre: documento.archivo.nombre,
          };
          await (supabase
            .from('documentos_servicio') as any)
            .update(updateData)
            .eq('id', insertedData.id);
        }
      }

      await fetchDocumentos();
      return insertedData;
    } catch (err) {
      console.error('Error adding documento:', err);
      throw err;
    }
  };

  const actualizarDocumento = async (id: string, updates: Partial<DocumentoServicio>) => {
    try {
      const dbUpdates: DocumentoServicioUpdate = {
        fecha_modificacion: new Date().toISOString(),
      };

      if (updates.fechaServicio !== undefined) dbUpdates.fecha_servicio = updates.fechaServicio;
      if (updates.numeroReporte !== undefined) dbUpdates.numero_reporte = updates.numeroReporte;
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

      const { error } = await (supabase
        .from('documentos_servicio') as any)
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await fetchDocumentos();
    } catch (err) {
      console.error('Error updating documento:', err);
      throw err;
    }
  };

  const eliminarDocumento = async (id: string) => {
    try {
      // Delete file from storage if exists
      const documento = documentos.find(d => d.id === id);
      if (documento?.archivo) {
        const filePath = `servicios/${servicioId}/${id}.pdf`;
        await supabase.storage.from('documentos').remove([filePath]);
      }

      const { error } = await supabase
        .from('documentos_servicio')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDocumentos();
    } catch (err) {
      console.error('Error deleting documento:', err);
      throw err;
    }
  };

  return {
    documentos,
    loading,
    agregarDocumento,
    actualizarDocumento,
    eliminarDocumento,
    refetch: fetchDocumentos,
  };
};
