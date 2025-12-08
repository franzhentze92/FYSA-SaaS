import { useState, useEffect } from 'react';
import { DocumentoServicio } from '@/types/servicio';

const SERVICIOS_IDS = [148998, 148591, 136260, 136259, 136257, 136258, 136256];

const SERVICIOS_MAESTROS = [
  { id: 148998, titulo: 'Aspersión en banda' },
  { id: 148591, titulo: 'Lib. De Encarpado' },
  { id: 136260, titulo: 'Fumigación General' },
  { id: 136259, titulo: 'Muestreo de Granos' },
  { id: 136257, titulo: 'Gas. y Encarpado' },
  { id: 136258, titulo: 'Control de Roedores' },
  { id: 136256, titulo: 'Servicios Generales' },
];

export interface ReporteConServicio extends DocumentoServicio {
  servicioTitulo: string;
}

const loadReportes = (): ReporteConServicio[] => {
  const todosLosReportes: ReporteConServicio[] = [];
  
  SERVICIOS_IDS.forEach(servicioId => {
    const saved = localStorage.getItem(`servicios-${servicioId}`);
    if (saved) {
      try {
        const documentos: DocumentoServicio[] = JSON.parse(saved);
        const servicio = SERVICIOS_MAESTROS.find(s => s.id === servicioId);
        documentos.forEach(doc => {
          todosLosReportes.push({
            ...doc,
            servicioTitulo: servicio?.titulo || `Servicio ${servicioId}`,
          });
        });
      } catch (e) {
        console.error(`Error parsing servicios-${servicioId}:`, e);
      }
    }
  });

  // Ordenar por fecha de servicio (más reciente primero)
  todosLosReportes.sort((a, b) => 
    new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime()
  );

  return todosLosReportes;
};

export const useAllReportes = () => {
  const [reportes, setReportes] = useState<ReporteConServicio[]>(() => loadReportes());

  useEffect(() => {
    // Cargar reportes inicialmente
    setReportes(loadReportes());

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      setReportes(loadReportes());
    };

    // Escuchar eventos de storage (cuando cambia en otra pestaña)
    window.addEventListener('storage', handleStorageChange);

    // Polling para detectar cambios en la misma pestaña
    const interval = setInterval(() => {
      setReportes(loadReportes());
    }, 1000); // Verificar cada segundo

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return { reportes };
};

