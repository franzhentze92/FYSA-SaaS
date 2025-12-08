import React, { useState, useEffect, useMemo } from 'react';
import { Link2, RefreshCw, Settings, AlertCircle, CheckCircle2, XCircle, Search, Eye } from 'lucide-react';
import { FormitizeJob, FormitizeInvoice, FormitizeSubmittedForm } from '@/types/formitize';
import { fetchAllFormitizeJobs, fetchAllFormitizeSubmittedForms, fetchFormitizeInvoice, fetchFormitizeInvoicesByRange, setFormitizeCredentials, getFormitizeCredentials } from '@/services/formitizeApi';
import { format } from 'date-fns';

interface ServicioFacturacionRow {
  servicioId: string; // ID del servicio (submittedFormID)
  nombreServicio: string; // Nombre del servicio (form title)
  cliente: string; // Nombre del cliente (del job)
  jobId: string; // Job ID (del formulario)
  invoiceId: string | null; // Invoice ID (del job, puede ser null si no está vinculado)
  invoiceNumber?: string; // Número de factura (de la factura)
}

const ServiciosFacturacion: React.FC = () => {
  const [forms, setForms] = useState<FormitizeSubmittedForm[]>([]);
  const [jobs, setJobs] = useState<FormitizeJob[]>([]);
  const [invoices, setInvoices] = useState<FormitizeInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Vincular formularios → jobs → facturas
  const linkedData = useMemo(() => {
    const rows: ServicioFacturacionRow[] = [];

    // Crear un mapa de jobs por ID
    const jobById = new Map<number, FormitizeJob>();
    jobs.forEach(job => {
      const jobIdNum = parseInt(job.id);
      if (!isNaN(jobIdNum)) {
        jobById.set(jobIdNum, job);
      }
    });

    // Crear un mapa de facturas por invoice ID (para búsqueda directa)
    const invoiceById = new Map<number, FormitizeInvoice>();
    invoices.forEach(invoice => {
      invoiceById.set(invoice.id, invoice);
    });

    // Crear un mapa de facturas por job ID (usando attachedTo.job)
    const invoiceByJobId = new Map<number, FormitizeInvoice>();
    invoices.forEach(invoice => {
      if (invoice.attachedTo?.job) {
        invoice.attachedTo.job.forEach(jobId => {
          invoiceByJobId.set(jobId, invoice);
        });
      }
    });

    // Procesar cada formulario
    forms.forEach(form => {
      const formId = typeof form.submittedFormID === 'string' 
        ? parseInt(form.submittedFormID) 
        : form.submittedFormID;
      const jobIdFromForm = form.jobID 
        ? (typeof form.jobID === 'string' ? parseInt(form.jobID) : form.jobID)
        : null;
      
      // Buscar el job asociado al formulario
      let linkedJob: FormitizeJob | null = null;
      if (jobIdFromForm && !isNaN(jobIdFromForm)) {
        linkedJob = jobById.get(jobIdFromForm) || null;
      }
      
      // Buscar factura vinculada al job
      let linkedInvoice: FormitizeInvoice | null = null;
      
      if (linkedJob) {
        // Método 1: Buscar por attachedTo.job en las facturas
        if (!isNaN(jobIdFromForm!)) {
          linkedInvoice = invoiceByJobId.get(jobIdFromForm!) || null;
        }
        
        // Método 2: Si el job tiene invoiceID, buscar directamente
        if (!linkedInvoice && linkedJob.invoiceID && linkedJob.invoiceID !== '0' && linkedJob.invoiceID !== '') {
          const invoiceIdNum = parseInt(linkedJob.invoiceID);
          if (!isNaN(invoiceIdNum)) {
            linkedInvoice = invoiceById.get(invoiceIdNum) || null;
          }
        }
      }

      rows.push({
        servicioId: formId.toString(),
        nombreServicio: form.title || 'Sin título',
        cliente: linkedJob ? (linkedJob.billingName || linkedJob.contactName || 'N/A') : 'N/A',
        jobId: jobIdFromForm ? jobIdFromForm.toString() : 'N/A',
        invoiceId: linkedInvoice ? linkedInvoice.id.toString() : null,
        invoiceNumber: linkedInvoice?.invoiceNumber,
      });
    });

    return rows;
  }, [forms, jobs, invoices]);

  // Filtrar datos según búsqueda
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return linkedData;
    }

    const search = searchTerm.toLowerCase();
    return linkedData.filter(row => 
      row.servicioId.toLowerCase().includes(search) ||
      row.nombreServicio.toLowerCase().includes(search) ||
      row.cliente.toLowerCase().includes(search) ||
      row.jobId.toLowerCase().includes(search) ||
      (row.invoiceId && row.invoiceId.toLowerCase().includes(search)) ||
      (row.invoiceNumber && row.invoiceNumber.toLowerCase().includes(search))
    );
  }, [linkedData, searchTerm]);

  useEffect(() => {
    const saved = getFormitizeCredentials();
    if (saved.username) {
      setCredentials({
        username: saved.username,
        password: saved.password || '***',
        hasToken: saved.hasToken || false,
      });
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Cargar formularios (submitted forms) - estos tienen jobID
      console.log('Cargando formularios...');
      let allForms: FormitizeSubmittedForm[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50; // Límite de seguridad
      
      // Cargar todas las páginas de formularios
      while (hasMorePages && currentPage <= maxPages) {
        try {
          const pageForms = await fetchAllFormitizeSubmittedForms({
            page: currentPage,
          });
          
          if (pageForms.length === 0) {
            hasMorePages = false;
          } else {
            allForms = [...allForms, ...pageForms];
            console.log(`Página ${currentPage}: ${pageForms.length} formularios cargados (Total: ${allForms.length})`);
            
            // Si la página tiene menos de 200 formularios, probablemente es la última
            if (pageForms.length < 200) {
              hasMorePages = false;
            } else {
              currentPage++;
              // Pequeña pausa entre páginas
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        } catch (err) {
          console.warn(`Error al cargar página ${currentPage} de formularios:`, err);
          hasMorePages = false;
        }
      }
      
      console.log(`Total formularios cargados: ${allForms.length}`);
      
      // Filtrar formularios que tengan jobID
      const formsConJobId = allForms.filter(form => form.jobID);
      console.log(`Formularios cargados: ${allForms.length}, con jobID: ${formsConJobId.length}`);
      
      // Obtener todos los job IDs únicos de los formularios
      const jobIdsFromForms = new Set<number>();
      formsConJobId.forEach(form => {
        if (form.jobID) {
          const jobId = typeof form.jobID === 'string' ? parseInt(form.jobID) : form.jobID;
          if (!isNaN(jobId)) {
            jobIdsFromForms.add(jobId);
          }
        }
      });
      
      console.log(`Job IDs únicos encontrados en formularios: ${jobIdsFromForms.size}`);
      
      // 2. Cargar los jobs correspondientes
      console.log('Cargando jobs...');
      const allJobs = await fetchAllFormitizeJobs({
        finished: true, // Incluir trabajos finalizados
      });
      
      // Filtrar jobs que estén en nuestros job IDs y que sean de Aprovigra
      const clienteFiltro = 'Aprovigra - Molinos Modernos S.A';
      const jobsFiltrados = allJobs.filter(job => {
        const jobIdNum = parseInt(job.id);
        const isInFormJobs = !isNaN(jobIdNum) && jobIdsFromForms.has(jobIdNum);
        const isAprovigra = 
          job.billingName === clienteFiltro || 
          job.contactName === clienteFiltro ||
          (job.billingName && job.billingName.includes('Aprovigra')) ||
          (job.contactName && job.contactName.includes('Aprovigra'));
        
        return isInFormJobs && isAprovigra;
      });
      
      setJobs(jobsFiltrados);
      console.log(`Jobs cargados: ${allJobs.length}, filtrados: ${jobsFiltrados.length}`);
      
      // 3. Filtrar formularios que tengan job IDs que estén en nuestros jobs filtrados
      const jobIdsFiltrados = new Set(jobsFiltrados.map(j => parseInt(j.id)).filter(id => !isNaN(id)));
      const formsFiltrados = formsConJobId.filter(form => {
        if (!form.jobID) return false;
        const jobId = typeof form.jobID === 'string' ? parseInt(form.jobID) : form.jobID;
        return !isNaN(jobId) && jobIdsFiltrados.has(jobId);
      });
      
      setForms(formsFiltrados);
      console.log(`Formularios filtrados: ${formsFiltrados.length}`);

      // 4. Cargar facturas vinculadas a los jobs
      // Obtener todos los job IDs y invoice IDs de los jobs filtrados
      const jobIds = new Set<number>();
      const invoiceIds = new Set<number>();
      
      jobsFiltrados.forEach(job => {
        const jobIdNum = parseInt(job.id);
        if (!isNaN(jobIdNum)) {
          jobIds.add(jobIdNum);
        }
        
        // Obtener invoiceIDs directos de los jobs
        if (job.invoiceID && job.invoiceID !== '0' && job.invoiceID !== '') {
          const id = parseInt(job.invoiceID);
          if (!isNaN(id)) {
            invoiceIds.add(id);
          }
        }
      });

      console.log(`Buscando facturas para ${jobIds.size} jobs...`);
      console.log(`Invoice IDs directos encontrados: ${invoiceIds.size}`);
      
      let allInvoices: FormitizeInvoice[] = [];
      
      // 2. Cargar facturas con invoiceIDs directos de los jobs
      if (invoiceIds.size > 0) {
        const invoiceIdArray = Array.from(invoiceIds);
        console.log(`Cargando ${invoiceIdArray.length} facturas con IDs directos...`);
        
        // fetchFormitizeInvoice ya está importado
        
        for (let i = 0; i < invoiceIdArray.length; i += 5) {
          const batch = invoiceIdArray.slice(i, i + 5);
          
          const batchPromises = batch.map(async (invoiceId) => {
            try {
              const invoiceData = await fetchFormitizeInvoice(invoiceId);
              if (invoiceData && invoiceData.payload) {
                return invoiceData.payload;
              }
              return null;
            } catch (err) {
              if (err instanceof Error && (err.message.includes('404') || err.message.includes('500'))) {
                return null;
              }
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach(inv => {
            if (inv && !allInvoices.find(existing => existing.id === inv.id)) {
              allInvoices.push(inv);
            }
          });
          
          if (i + 5 < invoiceIdArray.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      // 3. Buscar facturas que tengan estos job IDs en attachedTo.job
      // Estimar un rango de búsqueda basado en los job IDs
      if (jobIds.size > 0) {
        const jobIdArray = Array.from(jobIds);
        const minJobId = Math.min(...jobIdArray);
        const maxJobId = Math.max(...jobIdArray);
        
        // Buscar facturas en un rango más estrecho alrededor de los job IDs
        // Las facturas pueden tener IDs cercanos o lejanos a los jobs
        // Buscar en un rango más pequeño primero para ser más eficiente
        const searchStart = Math.max(1, minJobId - 200);
        const searchEnd = maxJobId + 200;
        
        console.log(`Buscando facturas en rango ${searchStart} - ${searchEnd} que contengan job IDs en attachedTo.job...`);
        console.log(`Job IDs a buscar: ${Array.from(jobIds).slice(0, 10).join(', ')}${jobIds.size > 10 ? '...' : ''}`);
        
        // Buscar en pasos de 50 para ser más eficiente
        const searchStep = 50;
        let foundCount = 0;
        const maxSearchRanges = 30; // Límite de seguridad para no buscar infinitamente
        let searchRanges = 0;
        
        for (let start = searchStart; start <= searchEnd && foundCount < jobIds.size && searchRanges < maxSearchRanges; start += searchStep) {
          const end = Math.min(start + searchStep - 1, searchEnd);
          searchRanges++;
          
          try {
            const rangeInvoices = await fetchFormitizeInvoicesByRange(start, end);
            
            // Filtrar facturas que tengan alguno de nuestros job IDs en attachedTo.job
            rangeInvoices.forEach(inv => {
              if (inv.attachedTo?.job && Array.isArray(inv.attachedTo.job)) {
                const hasMatchingJob = inv.attachedTo.job.some(jobId => jobIds.has(jobId));
                if (hasMatchingJob && !allInvoices.find(existing => existing.id === inv.id)) {
                  allInvoices.push(inv);
                  foundCount++;
                  const matchingJobs = inv.attachedTo.job.filter(j => jobIds.has(j));
                  console.log(`✓ Factura ${inv.id} (${inv.invoiceNumber || 'N/A'}) vinculada a job(s): ${matchingJobs.join(', ')}`);
                }
              }
            });
          } catch (err) {
            // Ignorar errores en rangos (404, 500, etc.)
          }
          
          // Pausa entre búsquedas para no sobrecargar
          if (start + searchStep <= searchEnd) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        }
        
        console.log(`Total facturas encontradas con jobs vinculados: ${foundCount} (buscadas en ${searchRanges} rangos)`);
      }

      setInvoices(allInvoices);
      console.log(`Total facturas cargadas: ${allInvoices.length}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los datos';
      setError(errorMessage);
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    // Recargar datos después de cambiar credenciales
    loadData();
  };

  const handleOpenCredentialsModal = () => {
    const saved = getFormitizeCredentials();
    setTempCredentials({
      username: saved.username || credentials.username,
      password: saved.password || credentials.password,
    });
    setShowCredentialsModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Link2 size={32} />
                Servicios y Facturación
              </h1>
              <p className="text-gray-600 mt-2">
                Vista consolidada de servicios (formularios) vinculados con jobs y facturas
              </p>
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-blue-800">
                <strong>Filtro activo:</strong> Mostrando solo servicios del cliente "Aprovigra - Molinos Modernos S.A"
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Actualizar
              </button>
              <button
                onClick={handleOpenCredentialsModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <Settings size={20} />
                Configurar Credenciales
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID de servicio, nombre, cliente, Job ID o Invoice ID..."
                className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Servicios</p>
            <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Facturas</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Servicios Vinculados</p>
            <p className="text-2xl font-bold text-emerald-600">
              {linkedData.filter(row => row.invoiceId !== null).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Sin Factura</p>
            <p className="text-2xl font-bold text-amber-600">
              {linkedData.filter(row => row.invoiceId === null).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw size={32} className="mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Cargando datos...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-12 text-center">
              <Link2 size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron resultados con los criterios de búsqueda.' : 'No hay datos disponibles.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Factura
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((row, index) => (
                    <tr 
                      key={`${row.jobId}-${index}`} 
                      className={`hover:bg-gray-50 transition-colors ${
                        row.invoiceId === null ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{row.servicioId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{row.nombreServicio}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">{row.cliente}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-mono text-gray-900">{row.jobId}</div>
                      </td>
                      <td className="px-4 py-3">
                        {row.invoiceId ? (
                          <div className="text-sm font-mono text-emerald-600 font-medium">{row.invoiceId}</div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">Sin factura</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {row.invoiceNumber ? (
                          <div className="text-sm text-gray-900">{row.invoiceNumber}</div>
                        ) : (
                          <div className="text-sm text-gray-400 italic">-</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

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

export default ServiciosFacturacion;

