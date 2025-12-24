import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Map, TrendingUp, AlertCircle, Search, Calendar, FileText, Download, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Custom rat icon
const RatIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {/* Head - circle */}
    <circle cx="8" cy="10" r="3.5" fill="currentColor"/>
    {/* Body - oval behind head */}
    <ellipse cx="11" cy="12" rx="3.5" ry="4" fill="currentColor"/>
    {/* Large round ears */}
    <circle cx="6" cy="8" r="1.8" fill="currentColor"/>
    <circle cx="10" cy="8" r="1.8" fill="currentColor"/>
    {/* Small eyes */}
    <circle cx="7" cy="10" r="0.8" fill="white"/>
    <circle cx="9" cy="10" r="0.8" fill="white"/>
    {/* Pointed nose */}
    <ellipse cx="5.5" cy="11" rx="0.6" ry="0.8" fill="white"/>
    {/* Whiskers - three lines from nose */}
    <line x1="4.5" y1="10.5" x2="2.5" y2="10.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="4.5" y1="11.5" x2="2" y2="12.5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="4.5" y1="9.5" x2="2" y2="8.5" stroke="currentColor" strokeWidth="1.5"/>
    {/* Long curved tail */}
    <path d="M14.5 12 Q18 10, 20 8 Q21.5 6, 21.5 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

interface MapaCalor {
  id: string;
  fecha: string;
  archivoNombre: string;
  archivoUrl: string;
  fechaCreacion: string;
}

const ControlRoedores: React.FC = () => {
  const [mapasCalor, setMapasCalor] = useState<MapaCalor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFecha, setFilterFecha] = useState<string>('');

  // Obtener usuario actual
  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);

  const userEmail = currentUser?.email || '';

  // Fetch mapas from Supabase
  const fetchMapasCalor = useCallback(async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mapas_calor')
        .select('*')
        .eq('cliente_email', userEmail)
        .eq('tipo', 'control-roedores')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const formatted: MapaCalor[] = (data || []).map(m => ({
        id: m.id,
        fecha: m.fecha,
        archivoNombre: m.archivo_nombre,
        archivoUrl: m.archivo_url,
        fechaCreacion: m.fecha_creacion,
      }));

      setMapasCalor(formatted);
    } catch (err: any) {
      console.error('Error fetching mapas calor:', err);
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
      .channel('mapas-calor-cliente-changes')
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
            <RatIcon size={32} />
            Roedores - Mapa de Calor
          </h1>
          <p className="text-gray-600 mt-2">
            Visualización de datos de control de roedores mediante mapas de calor
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
              Lista de mapas de calor de control de roedores
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

export default ControlRoedores;

