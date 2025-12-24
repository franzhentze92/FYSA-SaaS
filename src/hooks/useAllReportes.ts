import { useState, useEffect, useCallback } from 'react';
import { DocumentoServicio } from '@/types/servicio';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type DocumentoServicioDB = Database['public']['Tables']['documentos_servicio']['Row'];

const SERVICIOS_MAESTROS = [
  { id: 148998, titulo: 'Aspersión en banda' },
  { id: 148591, titulo: 'Lib. De Encarpado' },
  { id: 136260, titulo: 'Fumigación General' },
  { id: 136259, titulo: 'Muestreo de Granos' },
  { id: 136257, titulo: 'Gas. y Encarpado' },
  { id: 136258, titulo: 'Control de Roedores' },
  { id: 136256, titulo: 'Servicios Generales' },
  { id: 1362563, titulo: 'Trampas de Luz' },
  { id: 1362564, titulo: 'Tratamiento de Contenedores' },
  { id: 1362565, titulo: 'Fum. de Silo Vacío' },
  { id: 1362566, titulo: 'Fum. Graneleras' },
];

export interface ReporteConServicio extends DocumentoServicio {
  servicioTitulo: string;
  clienteEmail?: string;
  clienteNombre?: string;
}

export const useAllReportes = () => {
  const [reportes, setReportes] = useState<ReporteConServicio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('documentos_servicio')
        .select('*')
        .order('fecha_servicio', { ascending: false });

      if (error) throw error;

      const formattedReportes: ReporteConServicio[] = ((data || []) as DocumentoServicioDB[]).map(doc => {
        const servicio = SERVICIOS_MAESTROS.find(s => s.id === doc.servicio_id);
        return {
          id: doc.id,
          servicioId: doc.servicio_id,
          fechaServicio: doc.fecha_servicio,
          numeroReporte: doc.numero_reporte,
          notas: doc.notas,
          fechaCreacion: doc.fecha_creacion,
          fechaModificacion: doc.fecha_modificacion,
          servicioTitulo: servicio?.titulo || `Servicio ${doc.servicio_id}`,
          clienteEmail: doc.cliente_email || undefined,
          clienteNombre: doc.cliente_nombre || undefined,
          archivo: doc.archivo_url ? {
            nombre: doc.archivo_nombre || 'documento.pdf',
            tipo: 'application/pdf',
            tamaño: 0,
            contenido: '',
            url: doc.archivo_url,
          } : undefined,
        };
      });

      setReportes(formattedReportes);
    } catch (err) {
      console.error('Error fetching reportes:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchReportes();
      setLoading(false);
    };
    loadData();
  }, [fetchReportes]);

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('all-reportes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documentos_servicio' }, () => {
        fetchReportes();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchReportes]);

  return { 
    reportes, 
    loading,
    refetch: fetchReportes,
  };
};
