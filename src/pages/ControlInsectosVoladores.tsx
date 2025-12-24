import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Map, TrendingUp, AlertCircle, Search, Calendar, FileText, Download, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Custom beetle icon
const BeetleIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {/* Beetle body/elytra */}
    <ellipse cx="12" cy="12" rx="7" ry="5" fill="currentColor"/>
    {/* Head */}
    <ellipse cx="12" cy="6" rx="2.5" ry="2" fill="currentColor"/>
    {/* Antennae */}
    <path d="M10 4 Q8 2, 6 3" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    <path d="M14 4 Q16 2, 18 3" stroke="currentColor" fill="none" strokeWidth="1.5"/>
    <circle cx="6" cy="3" r="0.8" fill="currentColor"/>
    <circle cx="18" cy="3" r="0.8" fill="currentColor"/>
    {/* Legs */}
    <path d="M6 12 L4 16" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 13 L6 17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M18 12 L20 16" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 13 L18 17" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 16 L10 20" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M14 16 L14 20" stroke="currentColor" strokeWidth="1.5"/>
    {/* Wing division line */}
    <path d="M12 8 L12 16" stroke="white" strokeWidth="0.8" opacity="0.6"/>
    {/* Spots on elytra */}
    <circle cx="9" cy="11" r="1" fill="white" opacity="0.4"/>
    <circle cx="15" cy="11" r="1" fill="white" opacity="0.4"/>
  </svg>
);

interface MapaCalor {
  id: string;
  fecha: string;
  archivoNombre: string;
  archivoUrl: string;
  fechaCreacion: string;
}

/**
 * Insectos Voladores - Mapa de Calor
 * 
 * Esta página muestra los mapas de calor de tipo "monitoreo-trampas-luz"
 * que corresponden a "Monitoreo de Trampas de Luz" en el admin.
 * 
 * IMPORTANTE: El tipo en la base de datos debe ser exactamente 'monitoreo-trampas-luz'
 */
const ControlInsectosVoladores: React.FC = () => {
  const [mapasCalor, setMapasCalor] = useState<MapaCalor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFecha, setFilterFecha] = useState<string>('');

  // Obtener usuario actual
  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) {
      console.log('ControlInsectosVoladores: No user found in localStorage');
      return null;
    }
    try {
      const user = JSON.parse(userJson);
      console.log('ControlInsectosVoladores: Current user:', user);
      return user;
    } catch (err) {
      console.error('ControlInsectosVoladores: Error parsing user:', err);
      return null;
    }
  }, []);

  const userEmail = currentUser?.email || '';
  
  useEffect(() => {
    console.log('ControlInsectosVoladores: userEmail:', userEmail);
  }, [userEmail]);

  // Fetch mapas from Supabase
  const fetchMapasCalor = useCallback(async () => {
    if (!userEmail) {
      console.log('ControlInsectosVoladores: No userEmail found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('ControlInsectosVoladores: Fetching mapas for email:', userEmail, 'tipo: monitoreo-trampas-luz');
      
      // First, let's check ALL mapas for this client to see what tipos exist
      const { data: allData, error: allError } = await supabase
        .from('mapas_calor')
        .select('*')
        .eq('cliente_email', userEmail)
        .order('fecha_creacion', { ascending: false });
      
      if (allData) {
        console.log('ControlInsectosVoladores: ALL mapas for client:', allData);
        console.log('ControlInsectosVoladores: Tipos found:', allData.map(m => m.tipo));
      }
      
      // Now filter for the specific tipo
      // IMPORTANT: This must match exactly the value saved in AdminMapasCalor.tsx
      // Admin option "Monitoreo de Trampas de Luz" saves: 'monitoreo-trampas-luz'
      const TIPO_MONITOREO_TRAMPAS_LUZ = 'monitoreo-trampas-luz';
      
      const { data, error } = await supabase
        .from('mapas_calor')
        .select('*')
        .eq('cliente_email', userEmail)
        .eq('tipo', TIPO_MONITOREO_TRAMPAS_LUZ)
        .order('fecha_creacion', { ascending: false });

      if (error) {
        console.error('ControlInsectosVoladores: Supabase error:', error);
        throw error;
      }

      console.log('ControlInsectosVoladores: Raw data received (filtered):', data);
      console.log('ControlInsectosVoladores: Data count:', data?.length || 0);

      const formatted: MapaCalor[] = (data || []).map(m => ({
        id: m.id,
        fecha: m.fecha,
        archivoNombre: m.archivo_nombre,
        archivoUrl: m.archivo_url,
        fechaCreacion: m.fecha_creacion,
      }));

      console.log('ControlInsectosVoladores: Formatted data:', formatted);
      setMapasCalor(formatted);
    } catch (err: any) {
      console.error('ControlInsectosVoladores: Error fetching mapas calor:', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Initial fetch
  useEffect(() => {
    fetchMapasCalor();
  }, [fetchMapasCalor]);

  // Real-time subscription
  useEffect(() => {
    if (!userEmail) return;

    const subscription = supabase
      .channel('mapas-calor-cliente-insectos-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'mapas_calor',
          filter: `cliente_email=eq.${userEmail}`
        }, 
        () => {
          fetchMapasCalor();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMapasCalor, userEmail]);

  // Filtered mapas
  const mapasFiltrados = useMemo(() => {
    return mapasCalor.filter(mapa => {
      const matchesSearch = !searchQuery || 
        mapa.archivoNombre.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFecha = !filterFecha || mapa.fecha === filterFecha;
      
      return matchesSearch && matchesFecha;
    });
  }, [mapasCalor, searchQuery, filterFecha]);

  // KPIs
  const kpis = useMemo(() => {
    const total = mapasCalor.length;
    const esteMes = mapasCalor.filter(m => {
      const fecha = new Date(m.fechaCreacion);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;
    const ultimoMes = mapasCalor.filter(m => {
      const fecha = new Date(m.fecha);
      const ahora = new Date();
      const mesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      return fecha >= mesPasado && fecha < new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }).length;
    const ultimoAno = mapasCalor.filter(m => {
      const fecha = new Date(m.fecha);
      const ahora = new Date();
      const anoPasado = new Date(ahora.getFullYear() - 1, 0, 1);
      return fecha >= anoPasado;
    }).length;
    
    return { total, esteMes, ultimoMes, ultimoAno };
  }, [mapasCalor]);

  // Get unique dates for filter
  const fechasDisponibles = useMemo(() => {
    const fechas = mapasCalor.map(m => m.fecha).filter((fecha, index, self) => self.indexOf(fecha) === index);
    return fechas.sort((a, b) => b.localeCompare(a));
  }, [mapasCalor]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BeetleIcon size={32} />
            Insectos Voladores - Mapa de Calor
          </h1>
          <p className="text-gray-600 mt-2">
            Visualización de datos de control de insectos voladores mediante mapas de calor
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Mapas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Map className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.esteMes}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Último Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.ultimoMes}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Último Año</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.ultimoAno}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre de archivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={filterFecha}
                onChange={(e) => setFilterFecha(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las fechas</option>
                {fechasDisponibles.map(fecha => (
                  <option key={fecha} value={fecha}>
                    {format(new Date(fecha), 'dd/MM/yyyy', { locale: es })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Mapas de Calor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Lista de mapas de calor de monitoreo de trampas de luz
            </p>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-4">Cargando mapas de calor...</p>
            </div>
          ) : mapasFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No hay mapas de calor disponibles</p>
              <p className="text-gray-400 text-sm mt-2">
                {mapasCalor.length === 0 
                  ? 'Aún no se han agregado mapas de calor para este tipo'
                  : 'No se encontraron mapas que coincidan con los filtros'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mapasFiltrados.map((mapa) => (
                    <tr key={mapa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(mapa.fecha), 'dd/MM/yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span>{mapa.archivoNombre}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {mapa.archivoUrl && (
                            <>
                              <a
                                href={mapa.archivoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                title="Ver PDF"
                              >
                                <Eye className="h-4 w-4" />
                              </a>
                              <a
                                href={mapa.archivoUrl}
                                download
                                className="text-green-600 hover:text-green-800 flex items-center gap-1"
                                title="Descargar PDF"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlInsectosVoladores;

