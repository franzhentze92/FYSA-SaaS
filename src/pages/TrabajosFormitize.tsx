import React, { useState, useEffect } from 'react';
import { Briefcase, Search, Eye, Settings, AlertCircle, CheckCircle2, XCircle, RefreshCw, ExternalLink, Calendar, User, MapPin, Clock } from 'lucide-react';
import { FormitizeJob } from '@/types/formitize';
import { fetchFormitizeJob, fetchFormitizeJobDetails, fetchAllFormitizeJobs, setFormitizeCredentials, getFormitizeCredentials } from '@/services/formitizeApi';
import { format } from 'date-fns';

const TrabajosFormitize: React.FC = () => {
  const [jobId, setJobId] = useState('');
  const [job, setJob] = useState<FormitizeJob | null>(null);
  const [allJobs, setAllJobs] = useState<FormitizeJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAllJobs, setShowAllJobs] = useState(true);
  const [credentials, setCredentials] = useState(() => {
    return {
      username: 'oficinafysa',
      password: '***',
      hasToken: true,
    };
  });
  const [tempCredentials, setTempCredentials] = useState({
    username: 'oficinafysa',
    password: 'oficina123!!',
  });
  const [filters, setFilters] = useState({
    finished: false,
    from: '',
    to: '',
    status: '',
    agentName: '',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setJob(null);

    if (!jobId.trim()) {
      setError('Por favor ingresa un ID de trabajo');
      return;
    }

    const id = parseInt(jobId);
    if (isNaN(id)) {
      setError('El ID de trabajo debe ser un número');
      return;
    }

    setLoading(true);
    setJob(null);
    try {
      // Usar fetchFormitizeJobDetails para obtener toda la información
      const jobData = await fetchFormitizeJobDetails(id);
      if (jobData) {
        console.log('Job completo obtenido:', jobData);
        console.log('Formularios del job:', jobData.forms);
        setJob(jobData);
        setError(null);
        setShowAllJobs(false);
      } else {
        setError('La respuesta de la API no contiene datos de trabajo');
        setJob(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener el trabajo';
      setError(errorMessage);
      setJob(null);
      console.error('Error al obtener trabajo de Formitize:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = () => {
    if (!tempCredentials.username || !tempCredentials.password) {
      setError('Por favor completa ambos campos');
      return;
    }
    setFormitizeCredentials(tempCredentials.username, tempCredentials.password);
    setCredentials({ 
      username: tempCredentials.username, 
      password: '***',
      hasToken: false,
    });
    setShowCredentialsModal(false);
    setError(null);
  };

  const handleOpenCredentialsModal = () => {
    const saved = getFormitizeCredentials();
    setTempCredentials({
      username: saved.username || credentials.username,
      password: saved.password || credentials.password,
    });
    setShowCredentialsModal(true);
  };

  useEffect(() => {
    const saved = getFormitizeCredentials();
    if (saved.username) {
      setCredentials({
        username: saved.username,
        password: saved.password || '***',
        hasToken: saved.hasToken || false,
      });
    } else {
      setCredentials({ 
        username: 'oficinafysa', 
        password: '***',
        hasToken: true,
      });
    }
  }, []);

  useEffect(() => {
    loadAllJobs();
  }, []);

  const loadAllJobs = async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const jobs = await fetchAllFormitizeJobs({
        finished: filters.finished,
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        agentName: filters.agentName || undefined,
      });
      setAllJobs(jobs);
      console.log('Jobs cargados:', jobs.length);
      if (jobs.length === 0) {
        setError('No se encontraron trabajos con los filtros especificados.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los trabajos';
      console.error('Error al cargar trabajos:', err);
      setError(errorMessage);
      setAllJobs([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleRefresh = () => {
    loadAllJobs();
  };

  const handleViewJob = async (jobId: number) => {
    setJobId(jobId.toString());
    setLoading(true);
    setError(null);
    try {
      // Usar fetchFormitizeJobDetails para obtener toda la información
      const jobData = await fetchFormitizeJobDetails(jobId);
      if (jobData) {
        console.log('Job completo obtenido:', jobData);
        console.log('Formularios del job:', jobData.forms);
        setJob(jobData);
        setError(null);
        setShowAllJobs(false);
      } else {
        setError('La respuesta de la API no contiene datos de trabajo');
        setJob(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener el trabajo';
      setError(errorMessage);
      setJob(null);
      console.error('Error al obtener trabajo de Formitize:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTable = () => {
    setJob(null);
    setJobId('');
    setShowAllJobs(true);
    setError(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const ts = parseInt(timestamp);
    if (isNaN(ts) || ts === 0) return 'N/A';
    return format(new Date(ts * 1000), 'dd/MM/yyyy HH:mm');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '0':
        return 'bg-gray-100 text-gray-800';
      case '1':
        return 'bg-blue-100 text-blue-800';
      case '2':
        return 'bg-yellow-100 text-yellow-800';
      case '3':
        return 'bg-green-100 text-green-800';
      case '4':
        return 'bg-emerald-100 text-emerald-800';
      case '6':
        return 'bg-red-100 text-red-800';
      case '8':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, statusLabel?: string) => {
    if (statusLabel) return statusLabel;
    switch (status) {
      case '0': return 'Creando';
      case '1': return 'Creado';
      case '2': return 'Asignado';
      case '3': return 'Aceptado';
      case '4': return 'Completado';
      case '6': return 'Rechazado';
      case '8': return 'Reprogramado';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Briefcase size={32} />
                Trabajos Formitize
              </h1>
              <p className="text-gray-600 mt-2">
                Consulta trabajos desde el CRM Formitize
              </p>
            </div>
            <button
              onClick={handleOpenCredentialsModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Settings size={20} />
              Configurar Credenciales
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Ingresa el ID del trabajo (ej: 5555)"
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Buscar Trabajo
                </>
              )}
            </button>
          </form>

          {/* Credentials Status */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle2 size={16} className="text-green-600" />
              <span>Conectado a Formitize como: <strong>{credentials.username}</strong> (Company: FYSA) {credentials.hasToken && '• Token configurado'}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <AlertCircle size={16} className="inline mr-2" />
              <strong>Nota importante:</strong> Las peticiones desde el navegador pueden fallar debido a que el User-Agent no se puede establecer. 
              Se requiere un proxy o backend para agregar el header User-Agent: "FYSA".
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Back Button when viewing single job */}
        {job && (
          <div className="mb-4">
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink size={18} className="rotate-180" />
              Volver a la lista de trabajos
            </button>
          </div>
        )}

        {/* Job Details */}
        {job && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{job.title || 'Sin título'}</h2>
                  <p className="text-slate-200">ID: {job.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {getStatusLabel(job.status, job.statusLabel)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información del Trabajo</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Trabajo:</span>
                      <span className="font-medium">{job.jobNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Orden:</span>
                      <span className="font-medium">{job.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Vencimiento:</span>
                      <span className="font-medium">{formatTimestamp(job.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duración:</span>
                      <span className="font-medium">{job.duration ? `${parseInt(job.duration) / 3600}h` : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prioridad:</span>
                      <span className="font-medium">{job.priority || 'N/A'}</span>
                    </div>
                    {job.invoiceNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Factura:</span>
                        <span className="font-medium">{job.invoiceNumber} (ID: {job.invoiceID})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Cliente:</span>
                      <p className="font-medium">{job.billingName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contacto:</span>
                      <p className="font-medium">{job.contactName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ubicación:</span>
                      <p className="font-medium">{job.location || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Asignado a:</span>
                      <p className="font-medium">{job.assignedTo || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {job.description && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Descripción</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.description}</p>
                </div>
              )}

              {job.forms && Object.keys(job.forms).length > 0 && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Formularios</h3>
                  <div className="space-y-2">
                    {Object.values(job.forms).map((form) => (
                      <div key={form.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-sm">{form.title}</p>
                        <p className="text-xs text-gray-500">ID: {form.id}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Jobs Table */}
        {showAllJobs && !job && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Trabajos</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {allJobs.length > 0 ? `${allJobs.length} trabajos encontrados` : 'Cargando trabajos...'}
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loadingAll}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={18} className={loadingAll ? 'animate-spin' : ''} />
                  Actualizar
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mostrar Completados
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.finished}
                        onChange={(e) => {
                          setFilters({ ...filters, finished: e.target.checked });
                          setTimeout(() => loadAllJobs(), 100);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Incluir trabajos completados</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => {
                        setFilters({ ...filters, status: e.target.value });
                        setTimeout(() => loadAllJobs(), 100);
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Todos los estados</option>
                      <option value="0">Creando</option>
                      <option value="1">Creado</option>
                      <option value="2">Asignado</option>
                      <option value="3">Aceptado</option>
                      <option value="4">Completado</option>
                      <option value="6">Rechazado</option>
                      <option value="8">Reprogramado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agente
                    </label>
                    <input
                      type="text"
                      value={filters.agentName}
                      onChange={(e) => setFilters({ ...filters, agentName: e.target.value })}
                      onBlur={() => loadAllJobs()}
                      placeholder="Nombre de usuario"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {loadingAll ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="mx-auto text-gray-400 mb-4 animate-spin" />
                <p className="text-gray-500">Cargando trabajos...</p>
              </div>
            ) : allJobs.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  No se encontraron trabajos. Intenta ajustar los filtros o buscar por ID específico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID / Título
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ubicación
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Vencimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asignado a
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allJobs.map((j) => (
                      <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{j.title || 'Sin título'}</div>
                          <div className="text-xs text-gray-500">ID: {j.id}</div>
                          {j.jobNumber && (
                            <div className="text-xs text-gray-500">Job #: {j.jobNumber}</div>
                          )}
                          {j.forms && Object.keys(j.forms).length > 0 && (
                            <div className="text-xs text-emerald-600 font-medium mt-1">
                              {Object.keys(j.forms).length} formulario{Object.keys(j.forms).length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{j.billingName}</div>
                          {j.contactName && (
                            <div className="text-xs text-gray-500">{j.contactName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{j.location || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatTimestamp(j.dueDate)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(j.status)}`}>
                            {getStatusLabel(j.status, j.statusLabel)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{j.assignedTo || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewJob(parseInt(j.id))}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Ver Detalles"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!job && !showAllJobs && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Briefcase size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Ingresa un ID de trabajo para buscar y visualizar la información
            </p>
          </div>
        )}

        {/* Credentials Modal */}
        {showCredentialsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Configurar Credenciales Formitize</h2>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={tempCredentials.username}
                    onChange={(e) => setTempCredentials({ ...tempCredentials, username: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Usuario de Formitize"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={tempCredentials.password}
                    onChange={(e) => setTempCredentials({ ...tempCredentials, password: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    placeholder="Contraseña de Formitize"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <AlertCircle size={16} className="inline mr-2" />
                  Las credenciales están pre-configuradas. Puedes cambiarlas si es necesario.
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => setShowCredentialsModal(false)}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900"
                  >
                    Guardar
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

export default TrabajosFormitize;

