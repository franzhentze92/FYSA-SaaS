import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Map, Upload, Search, Filter, Download, Trash2, Eye, Calendar, User, FileText } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type TipoMapaCalor = 'control-roedores' | 'monitoreo-trampas-luz';

interface MapaCalor {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  tipo: TipoMapaCalor;
  fecha: string;
  archivoNombre: string;
  archivoUrl: string;
  fechaCreacion: string;
}

const AdminMapasCalor: React.FC = () => {
  const { clientes, loading: clientesLoading } = useAdminServicios();
  const [mapasCalor, setMapasCalor] = useState<MapaCalor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Form state
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<TipoMapaCalor>('control-roedores');
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch mapas from Supabase
  const fetchMapasCalor = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mapas_calor')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      const formatted: MapaCalor[] = (data || []).map(m => ({
        id: m.id,
        clienteId: m.cliente_id,
        clienteNombre: m.cliente_nombre,
        clienteEmail: m.cliente_email,
        tipo: m.tipo as TipoMapaCalor,
        fecha: m.fecha,
        archivoNombre: m.archivo_nombre,
        archivoUrl: m.archivo_url,
        fechaCreacion: m.fecha_creacion,
      }));

      setMapasCalor(formatted);
    } catch (err: any) {
      console.error('Error fetching mapas calor:', err);
      toast.error('Error al cargar los mapas de calor', {
        description: err.message || 'Por favor recarga la página',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMapasCalor();
  }, [fetchMapasCalor]);

  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('mapas-calor-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mapas_calor' }, () => {
        fetchMapasCalor();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchMapasCalor]);

  // Filtered mapas
  const mapasFiltrados = useMemo(() => {
    return mapasCalor.filter(mapa => {
      const matchesSearch = !searchQuery || 
        mapa.clienteNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mapa.archivoNombre.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCliente = !filterCliente || mapa.clienteId === filterCliente;
      const matchesTipo = !filterTipo || mapa.tipo === filterTipo;
      
      return matchesSearch && matchesCliente && matchesTipo;
    });
  }, [mapasCalor, searchQuery, filterCliente, filterTipo]);

  // KPIs
  const kpis = useMemo(() => {
    const total = mapasCalor.length;
    const controlRoedores = mapasCalor.filter(m => m.tipo === 'control-roedores').length;
    const monitoreoTrampas = mapasCalor.filter(m => m.tipo === 'monitoreo-trampas-luz').length;
    const esteMes = mapasCalor.filter(m => {
      const fecha = new Date(m.fechaCreacion);
      const ahora = new Date();
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    }).length;
    
    return { total, controlRoedores, monitoreoTrampas, esteMes };
  }, [mapasCalor]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload file to Supabase Storage
  const uploadFile = async (file: File, mapaId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mapaId}.${fileExt}`;
      const filePath = `mapas-calor/${selectedTipo}/${fileName}`;

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

  const handleUpload = async () => {
    if (!selectedCliente || !selectedTipo || !selectedFecha || !selectedFile) {
      toast.error('Por favor completa todos los campos', {
        description: 'Cliente, tipo, fecha y archivo son requeridos',
      });
      return;
    }

    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      toast.error('Cliente no encontrado');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Subiendo mapa de calor...', {
      description: 'Por favor espera mientras se procesa el archivo',
    });

    try {
      // First, insert the mapa record to get the ID
      toast.loading('Creando registro...', { id: toastId });
      const { data: mapaData, error: insertError } = await supabase
        .from('mapas_calor')
        .insert({
          cliente_id: cliente.id,
          cliente_email: cliente.email,
          cliente_nombre: cliente.nombre,
          tipo: selectedTipo,
          fecha: selectedFecha,
          archivo_nombre: selectedFile.name,
          archivo_url: '', // Will be updated after upload
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload file to Storage
      toast.loading('Subiendo archivo PDF...', { id: toastId });
      const publicUrl = await uploadFile(selectedFile, mapaData.id);
      
      if (!publicUrl) {
        // Delete the record if upload failed
        await supabase.from('mapas_calor').delete().eq('id', mapaData.id);
        throw new Error('Error al subir el archivo a Storage');
      }

      // Update the record with the file URL
      toast.loading('Finalizando...', { id: toastId });
      const { error: updateError } = await supabase
        .from('mapas_calor')
        .update({ archivo_url: publicUrl })
        .eq('id', mapaData.id);

      if (updateError) throw updateError;

      // Refresh the list
      await fetchMapasCalor();

      setShowUploadModal(false);
      setSelectedCliente('');
      setSelectedTipo('control-roedores');
      setSelectedFecha('');
      setSelectedFile(null);
      
      toast.success('Mapa de calor subido exitosamente', {
        id: toastId,
        description: `Archivo "${selectedFile.name}" guardado correctamente`,
      });
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error('Error al subir el mapa de calor', {
        id: toastId,
        description: error.message || 'Por favor intenta de nuevo',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const mapa = mapasCalor.find(m => m.id === id);
    if (!mapa) return;

    // Use toast.promise for better UX
    const deletePromise = async () => {
      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/documentos/mapas-calor/...
      const urlParts = mapa.archivoUrl.split('/');
      const documentosIndex = urlParts.findIndex(part => part === 'documentos');
      if (documentosIndex !== -1) {
        const filePath = urlParts.slice(documentosIndex + 1).join('/');
        
        // Delete from Storage
        const { error: storageError } = await supabase.storage
          .from('documentos')
          .remove([filePath]);

        if (storageError) {
          console.warn('Error deleting from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('mapas_calor')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the list
      await fetchMapasCalor();
    };

    toast.promise(
      deletePromise(),
      {
        loading: 'Eliminando mapa de calor...',
        success: () => {
          return 'Mapa de calor eliminado exitosamente';
        },
        error: (error) => {
          console.error('Error deleting:', error);
          return 'Error al eliminar el mapa de calor';
        },
      }
    );
  };

  const getTipoLabel = (tipo: TipoMapaCalor) => {
    return tipo === 'control-roedores' ? 'Control de Roedores' : 'Monitoreo de Trampas de Luz';
  };

  const getTipoBadgeClasses = (tipo: TipoMapaCalor) => {
    if (tipo === 'control-roedores') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Map size={32} />
            Mapas de Calor
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona los mapas de calor de control de roedores y monitoreo de trampas de luz
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mapas</p>
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
                <p className="text-sm text-gray-600">Control de Roedores</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.controlRoedores}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monitoreo Trampas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.monitoreoTrampas}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.esteMes}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente o archivo..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterCliente}
                onChange={(e) => setFilterCliente(e.target.value)}
                className="border rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="border rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value="">Todos los tipos</option>
                <option value="control-roedores">Control de Roedores</option>
                <option value="monitoreo-trampas-luz">Monitoreo de Trampas de Luz</option>
              </select>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Upload size={18} />
                Subir Mapa de Calor
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archivo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Carga
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      Cargando...
                    </td>
                  </tr>
                ) : mapasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No hay mapas de calor registrados
                    </td>
                  </tr>
                ) : (
                  mapasFiltrados.map((mapa) => (
                    <tr key={mapa.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{mapa.clienteNombre}</span>
                          <p className="text-xs text-gray-500">{mapa.clienteEmail}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTipoBadgeClasses(mapa.tipo)}`}>
                          {getTipoLabel(mapa.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {format(new Date(mapa.fecha), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{mapa.archivoNombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {format(new Date(mapa.fechaCreacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={mapa.archivoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver PDF"
                          >
                            <Eye size={18} />
                          </a>
                          <a
                            href={mapa.archivoUrl}
                            download
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Descargar"
                          >
                            <Download size={18} />
                          </a>
                          <button
                            onClick={() => handleDelete(mapa.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Subir Mapa de Calor</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedCliente('');
                    setSelectedTipo('control-roedores');
                    setSelectedFecha('');
                    setSelectedFile(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedCliente}
                    onChange={(e) => setSelectedCliente(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                    disabled={clientesLoading}
                  >
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} ({cliente.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Mapa de Calor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedTipo}
                    onChange={(e) => setSelectedTipo(e.target.value as TipoMapaCalor)}
                    className="w-full border rounded-lg p-2.5"
                  >
                    <option value="control-roedores">Control de Roedores</option>
                    <option value="monitoreo-trampas-luz">Monitoreo de Trampas de Luz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedFecha}
                    onChange={(e) => setSelectedFecha(e.target.value)}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo PDF <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="w-full border rounded-lg p-2.5"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Archivo seleccionado: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedCliente('');
                      setSelectedTipo('control-roedores');
                      setSelectedFecha('');
                      setSelectedFile(null);
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                    disabled={uploading}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !selectedCliente || !selectedTipo || !selectedFecha || !selectedFile}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Subiendo...' : 'Subir Mapa de Calor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMapasCalor;

