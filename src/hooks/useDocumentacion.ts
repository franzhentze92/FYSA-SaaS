import { useState, useEffect, useCallback } from 'react';
import { Documento } from '@/types/documentacion';
import { supabase } from '@/lib/supabase';

interface UseDocumentacionOptions {
  clienteEmail?: string; // Filter by client (for clients viewing their docs)
  isAdmin?: boolean; // If admin, show all docs
}

export const useDocumentacion = (tipo: 'auditoria' | 'tecnicos' | 'croquis', options?: UseDocumentacionOptions) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const { clienteEmail, isAdmin } = options || {};

  const fetchDocumentos = useCallback(async () => {
    try {
      let query = supabase
        .from('documentos')
        .select('*')
        .eq('tipo', tipo);

      // If not admin and clienteEmail is provided, filter by client
      // Show documents assigned to this client OR documents with no client (public)
      if (!isAdmin && clienteEmail) {
        query = query.or(`cliente_email.eq.${clienteEmail},cliente_email.is.null`);
      }

      const { data, error } = await query.order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const formattedDocumentos: Documento[] = (data || []).map(doc => ({
        id: doc.id,
        tipo: doc.tipo,
        titulo: doc.titulo,
        descripcion: doc.descripcion,
        fechaCreacion: doc.fecha_creacion,
        fechaModificacion: doc.fecha_modificacion,
        clienteEmail: doc.cliente_email,
        clienteNombre: doc.cliente_nombre,
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
  }, [tipo, clienteEmail, isAdmin]);

  // Initial fetch
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
    const subscription = supabase
      .channel(`documentos-${tipo}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documentos',
        filter: `tipo=eq.${tipo}`
      }, () => {
        fetchDocumentos();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tipo, fetchDocumentos]);

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, documentoId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${documentoId}.${fileExt}`;
      const filePath = `documentacion/${tipo}/${fileName}`;

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

  const agregarDocumento = async (documento: Omit<Documento, 'id' | 'fechaCreacion' | 'fechaModificacion' | 'tipo'> & { clienteEmail?: string; clienteNombre?: string }) => {
    try {
      const insertData: Record<string, unknown> = {
        tipo,
        titulo: documento.titulo,
        descripcion: documento.descripcion,
      };
      
      // Add client info if provided
      if (documento.clienteEmail) {
        insertData.cliente_email = documento.clienteEmail;
        insertData.cliente_nombre = documento.clienteNombre;
      }

      const { data, error } = await (supabase
        .from('documentos') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

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

        const fileUrl = await uploadFile(file, data.id);

        if (fileUrl) {
          await supabase
            .from('documentos')
            .update({
              archivo_url: fileUrl,
              archivo_nombre: documento.archivo.nombre,
            })
            .eq('id', data.id);
        }
      }

      await fetchDocumentos();
      return data;
    } catch (err) {
      console.error('Error adding documento:', err);
      throw err;
    }
  };

  const actualizarDocumento = async (id: string, updates: Partial<Documento>) => {
    try {
      const dbUpdates: any = {
        fecha_modificacion: new Date().toISOString(),
      };

      if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
      if (updates.descripcion !== undefined) dbUpdates.descripcion = updates.descripcion;

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
        .from('documentos')
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
        const filePath = `documentacion/${tipo}/${id}.pdf`;
        await supabase.storage.from('documentos').remove([filePath]);
      }

      const { error } = await supabase
        .from('documentos')
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
