import React, { useState, useEffect } from 'react';
import { FileText, Search, Eye, Settings, AlertCircle, CheckCircle2, XCircle, RefreshCw, ExternalLink, Calendar, User, MapPin, Link as LinkIcon, Download, Upload, File } from 'lucide-react';
import { FormitizeSubmittedForm } from '@/types/formitize';
import { fetchFormitizeSubmittedForm, fetchAllFormitizeSubmittedForms, fetchAllFormitizeJobs, setFormitizeCredentials, getFormitizeCredentials } from '@/services/formitizeApi';
import { format } from 'date-fns';

const FormulariosFormitize: React.FC = () => {
  const [formId, setFormId] = useState('');
  const [form, setForm] = useState<FormitizeSubmittedForm | null>(null);
  const [allForms, setAllForms] = useState<FormitizeSubmittedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAllForms, setShowAllForms] = useState(true);
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
    title: '',
    jobID: '',
    formID: '',
    modifiedAfterDate: '',
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [allPagesLoaded, setAllPagesLoaded] = useState(false);
  const [formsPerPage] = useState(200); // Número de formularios por página en el frontend
  const [formPdfs, setFormPdfs] = useState<Record<string, { nombre: string; tipo: string; tamaño: number; contenido: string }>>({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForm(null);

    if (!formId.trim()) {
      setError('Por favor ingresa un ID de formulario');
      return;
    }

    const id = parseInt(formId);
    if (isNaN(id)) {
      setError('El ID de formulario debe ser un número');
      return;
    }

    setLoading(true);
    setForm(null);
    try {
      // Buscar el formulario y agregarlo a la lista para mostrarlo en la tabla
      const formData = await fetchFormitizeSubmittedForm(id);
      if (formData) {
        console.log('Formulario completo obtenido:', formData);
        // Agregar el formulario a la lista si no está ya presente
        setAllForms(prevForms => {
          const exists = prevForms.some(f => {
            const formIdNum = typeof f.submittedFormID === 'string' 
              ? parseInt(f.submittedFormID) 
              : f.submittedFormID;
            return formIdNum === id;
          });
          if (!exists) {
            return [formData, ...prevForms];
          }
          return prevForms;
        });
        setError(null);
        setShowAllForms(true); // Mostrar la tabla en lugar de la vista detallada
        setForm(null); // No mostrar la vista detallada
      } else {
        setError('La respuesta de la API no contiene datos de formulario');
        setForm(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener el formulario';
      setError(errorMessage);
      setForm(null);
      console.error('Error al obtener formulario de Formitize:', err);
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
    // Cargar todas las páginas inicialmente para obtener todos los formularios
    loadAllForms(1, true).catch(console.error);
    
    // Cargar PDFs guardados desde localStorage
    const savedPdfs = localStorage.getItem('formitizeFormPdfs');
    if (savedPdfs) {
      try {
        setFormPdfs(JSON.parse(savedPdfs));
      } catch (err) {
        console.error('Error al cargar PDFs guardados:', err);
      }
    }
  }, []);

  // Guardar PDFs en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('formitizeFormPdfs', JSON.stringify(formPdfs));
  }, [formPdfs]);

  const handleOpenPdfModal = (formId: string) => {
    setSelectedFormId(formId);
    setPdfFile(null);
    setShowPdfModal(true);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor selecciona un archivo PDF');
        return;
      }
      setPdfFile(file);
    }
  };

  const handleSavePdf = () => {
    if (!selectedFormId || !pdfFile) {
      alert('Por favor selecciona un archivo PDF');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const pdfData = {
        nombre: pdfFile.name,
        tipo: pdfFile.type,
        tamaño: pdfFile.size,
        contenido: base64String.split(',')[1], // Remover el prefijo data:application/pdf;base64,
      };

      setFormPdfs(prev => ({
        ...prev,
        [selectedFormId]: pdfData,
      }));

      setShowPdfModal(false);
      setSelectedFormId(null);
      setPdfFile(null);
    };
    reader.readAsDataURL(pdfFile);
  };

  const handleViewPdf = (formId: string) => {
    const pdf = formPdfs[formId];
    if (pdf) {
      const base64Content = `data:${pdf.tipo};base64,${pdf.contenido}`;
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${pdf.nombre}</title></head>
            <body style="margin:0;padding:0;">
              <embed src="${base64Content}" type="application/pdf" width="100%" height="100%" style="position:absolute;top:0;left:0;"/>
            </body>
          </html>
        `);
      }
    }
  };

  const handleDeletePdf = (formId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar el PDF adjunto?')) {
      setFormPdfs(prev => {
        const newPdfs = { ...prev };
        delete newPdfs[formId];
        return newPdfs;
      });
    }
  };

  const loadAllForms = async (page: number = 1, loadAllPages: boolean = false) => {
    setLoadingAll(true);
    setError(null);
    try {
      // 1. Primero cargar jobs del cliente Aprovigra para obtener los job IDs válidos
      console.log('Cargando jobs del cliente Aprovigra...');
      const allJobs = await fetchAllFormitizeJobs({
        finished: true, // Incluir trabajos finalizados
      });
      
      // Filtrar solo por el cliente "Aprovigra - Molinos Modernos S.A"
      const clienteFiltro = 'Aprovigra - Molinos Modernos S.A';
      const jobsFiltrados = allJobs.filter(job => 
        job.billingName === clienteFiltro || 
        job.contactName === clienteFiltro ||
        (job.billingName && job.billingName.includes('Aprovigra')) ||
        (job.contactName && job.contactName.includes('Aprovigra'))
      );
      
      // Crear un Set con los job IDs válidos
      const jobIdsValidos = new Set<number>();
      jobsFiltrados.forEach(job => {
        const jobIdNum = parseInt(job.id);
        if (!isNaN(jobIdNum)) {
          jobIdsValidos.add(jobIdNum);
        }
      });
      
      console.log(`Jobs del cliente "${clienteFiltro}": ${jobsFiltrados.length} (Job IDs: ${jobIdsValidos.size})`);
      
      // 2. Cargar formularios
      let allFormsData: FormitizeSubmittedForm[] = [];
      
      if (loadAllPages) {
        // Cargar todas las páginas disponibles
        let currentPageNum = 1;
        let hasMorePages = true;
        const maxPages = 100; // Aumentar el límite para cargar más páginas
        let consecutiveEmptyPages = 0;
        const maxConsecutiveEmpty = 3; // Si hay 3 páginas vacías consecutivas, detener
        
        while (hasMorePages && currentPageNum <= maxPages) {
          console.log(`Cargando página ${currentPageNum} de formularios...`);
          const forms = await fetchAllFormitizeSubmittedForms({
            title: filters.title || undefined,
            jobID: filters.jobID ? parseInt(filters.jobID) : undefined,
            formID: filters.formID || undefined,
            modifiedAfterDate: filters.modifiedAfterDate || undefined,
            page: currentPageNum,
          });
          
          if (forms.length > 0) {
            allFormsData = [...allFormsData, ...forms];
            consecutiveEmptyPages = 0; // Resetear contador de páginas vacías
            currentPageNum++;
            console.log(`Página ${currentPageNum - 1}: ${forms.length} formularios cargados (Total: ${allFormsData.length})`);
            
            // Si obtenemos menos de 200 (el límite por página según la documentación), podría ser la última página
            // Pero continuar buscando por si hay más
            if (forms.length < 200) {
              // Intentar cargar una página más para asegurarnos
              const nextPageForms = await fetchAllFormitizeSubmittedForms({
                title: filters.title || undefined,
                jobID: filters.jobID ? parseInt(filters.jobID) : undefined,
                formID: filters.formID || undefined,
                modifiedAfterDate: filters.modifiedAfterDate || undefined,
                page: currentPageNum,
              });
              
              if (nextPageForms.length === 0) {
                hasMorePages = false;
              } else {
                allFormsData = [...allFormsData, ...nextPageForms];
                currentPageNum++;
                console.log(`Página ${currentPageNum - 1}: ${nextPageForms.length} formularios cargados (Total: ${allFormsData.length})`);
              }
            }
          } else {
            consecutiveEmptyPages++;
            if (consecutiveEmptyPages >= maxConsecutiveEmpty) {
              hasMorePages = false;
              console.log(`Deteniendo carga: ${consecutiveEmptyPages} páginas vacías consecutivas`);
            } else {
              currentPageNum++;
            }
          }
          
          // Pequeña pausa para no sobrecargar la API
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Calcular total de páginas para paginación en frontend
        const totalFrontendPages = Math.ceil(allFormsData.length / formsPerPage);
        setTotalPages(totalFrontendPages);
        setCurrentPage(1);
        setAllPagesLoaded(true);
        console.log(`Total de páginas cargadas: ${currentPageNum - 1}, Total formularios: ${allFormsData.length}, Páginas frontend: ${totalFrontendPages}`);
      } else {
        // Cargar solo la página especificada
        const forms = await fetchAllFormitizeSubmittedForms({
          title: filters.title || undefined,
          jobID: filters.jobID ? parseInt(filters.jobID) : undefined,
          formID: filters.formID || undefined,
          modifiedAfterDate: filters.modifiedAfterDate || undefined,
          page: page,
        });
        allFormsData = forms;
        setCurrentPage(page);
        // Si obtenemos 200 formularios, probablemente hay más páginas
        if (forms.length === 200) {
          setTotalPages(page + 1); // Asumimos que hay al menos una página más
        } else {
          setTotalPages(page);
        }
      }
      
      // 3. Filtrar formularios que tengan job IDs válidos (del cliente Aprovigra)
      const formsFiltrados = allFormsData.filter(form => {
        if (!form.jobID) return false;
        const jobId = typeof form.jobID === 'string' ? parseInt(form.jobID) : form.jobID;
        return !isNaN(jobId) && jobIdsValidos.has(jobId);
      });
      
      setAllForms(formsFiltrados);
      console.log(`Formularios cargados: ${allFormsData.length}, filtrados por cliente "${clienteFiltro}": ${formsFiltrados.length}`);
      if (formsFiltrados.length === 0) {
        setError(`No se encontraron formularios del cliente "${clienteFiltro}" con los filtros especificados.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar los formularios';
      console.error('Error al cargar formularios:', err);
      setError(errorMessage);
      setAllForms([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleRefresh = () => {
    loadAllForms(1, false).catch(console.error);
  };

  const handleLoadAllPages = () => {
    loadAllForms(1, true).catch(console.error);
  };

  const handleViewForm = async (formId: number) => {
    setFormId(formId.toString());
    setLoading(true);
    setError(null);
    try {
      const formData = await fetchFormitizeSubmittedForm(formId);
      if (formData) {
        console.log('Formulario completo obtenido:', formData);
        setForm(formData);
        setError(null);
        setShowAllForms(false);
      } else {
        setError('La respuesta de la API no contiene datos de formulario');
        setForm(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener el formulario';
      setError(errorMessage);
      setForm(null);
      console.error('Error al obtener formulario de Formitize:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTable = () => {
    setForm(null);
    setFormId('');
    setShowAllForms(true);
    setError(null);
  };

  const formatTimestamp = (timestamp: number | string) => {
    const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    if (isNaN(ts) || ts === 0) return 'N/A';
    return format(new Date(ts * 1000), 'dd/MM/yyyy HH:mm');
  };

  const renderFormContent = (content: any, depth: number = 0): React.ReactNode => {
    if (!content || typeof content !== 'object') return null;

    return Object.entries(content).map(([key, value]: [string, any]) => {
      if (value && typeof value === 'object') {
        if (value.type && value.name) {
          // Es un campo del formulario
          return (
            <div key={key} className={`ml-${depth * 4} mb-2 p-2 bg-gray-50 rounded border border-gray-200`}>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-gray-500">{value.type}:</span>
                <span className="text-sm font-medium text-gray-900">{value.name}</span>
              </div>
              {value.value !== undefined && (
                <div className="mt-1 text-sm text-gray-700">
                  {typeof value.value === 'object' ? JSON.stringify(value.value) : String(value.value)}
                </div>
              )}
              {value.image && (
                <div className="mt-2">
                  <img src={value.image} alt="Signature" className="max-w-xs border rounded" />
                </div>
              )}
              {value.children && renderFormContent(value.children, depth + 1)}
            </div>
          );
        } else {
          // Es un contenedor
          return (
            <div key={key} className={`ml-${depth * 4} mb-3`}>
              <div className="text-sm font-semibold text-gray-700 mb-2">{key}</div>
              {renderFormContent(value, depth + 1)}
            </div>
          );
        }
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText size={32} />
                  Formularios Formitize
                </h1>
              </div>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="Ingresa el ID del formulario enviado (ej: 3)"
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
                  Buscar Formulario
                </>
              )}
            </button>
          </form>

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

        {/* Back Button when viewing single form */}
        {form && (
          <div className="mb-4">
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink size={18} className="rotate-180" />
              Volver a la lista de formularios
            </button>
          </div>
        )}

        {/* Form Details */}
        {form && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{form.title || 'Sin título'}</h2>
                  <p className="text-slate-200">ID: {form.submittedFormID}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    form.status === 'Ok' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {form.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información del Formulario</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID del Formulario:</span>
                      <span className="font-medium">{form.formID}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID del Trabajo:</span>
                      <span className="font-medium">{form.jobID || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Versión:</span>
                      <span className="font-medium">{form.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Creación:</span>
                      <span className="font-medium">{formatTimestamp(form.dateCreated)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Envío:</span>
                      <span className="font-medium">{formatTimestamp(form.dateSubmitted)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Última Modificación:</span>
                      <span className="font-medium">{formatTimestamp(form.dateModified)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información del Usuario</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Usuario:</span>
                      <p className="font-medium">{form.userName || form.userID || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">ID de Usuario:</span>
                      <p className="font-medium">{form.userID}</p>
                    </div>
                    {form.location && typeof form.location === 'string' && (
                      <div>
                        <span className="text-gray-600">Ubicación:</span>
                        <p className="font-medium">{form.location}</p>
                      </div>
                    )}
                    {form.latitude && form.longitude && (
                      <div>
                        <span className="text-gray-600">Coordenadas:</span>
                        <p className="font-medium">
                          {typeof form.latitude === 'string' ? form.latitude : 'N/A'}, {typeof form.longitude === 'string' ? form.longitude : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              {form.content && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Contenido del Formulario</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                    {renderFormContent(form.content)}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {form.attachments && Object.keys(form.attachments).length > 0 && (
                <div className="mb-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Archivos Adjuntos</h3>
                  <div className="space-y-2">
                    {Object.values(form.attachments).map((attachment, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={20} className="text-blue-600" />
                          <div>
                            <p className="font-medium text-sm">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.type.toUpperCase()}</p>
                          </div>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Download size={16} />
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Forms Table */}
        {showAllForms && !form && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
            </div>

            {loadingAll ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="mx-auto text-gray-400 mb-4 animate-spin" />
                <p className="text-gray-500">Cargando formularios...</p>
              </div>
            ) : allForms.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  No se encontraron formularios. Intenta ajustar los filtros o buscar por ID específico.
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
                        ID Formulario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Job ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de Envío
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(() => {
                      // Filtrar y ordenar formularios
                      const filteredAndSorted = allForms
                        .filter(f => {
                          // Si hay un ID de búsqueda, filtrar por ese ID
                          if (formId.trim()) {
                            const searchId = parseInt(formId);
                            if (!isNaN(searchId)) {
                              const formIdNum = typeof f.submittedFormID === 'string' 
                                ? parseInt(f.submittedFormID) 
                                : f.submittedFormID;
                              return formIdNum === searchId;
                            }
                          }
                          return true; // Mostrar todos si no hay búsqueda
                        })
                        .sort((a, b) => {
                          // Ordenar por fecha de envío: más nuevo primero
                          const dateA = typeof a.dateSubmitted === 'string' ? parseInt(a.dateSubmitted) : a.dateSubmitted;
                          const dateB = typeof b.dateSubmitted === 'string' ? parseInt(b.dateSubmitted) : b.dateSubmitted;
                          return dateB - dateA; // Orden descendente (más nuevo primero)
                        });

                      // Si todas las páginas están cargadas, paginar en el frontend
                      if (allPagesLoaded) {
                        const startIndex = (currentPage - 1) * formsPerPage;
                        const endIndex = startIndex + formsPerPage;
                        return filteredAndSorted.slice(startIndex, endIndex);
                      }
                      
                      // Si no todas las páginas están cargadas, mostrar todos los filtrados
                      return filteredAndSorted;
                    })().map((f) => {
                        const formIdNum = typeof f.submittedFormID === 'string' 
                          ? parseInt(f.submittedFormID) 
                          : f.submittedFormID;
                        const formIdStr = formIdNum.toString();
                        const isSearchResult = formId.trim() && parseInt(formId) === formIdNum;
                        return (
                      <tr 
                        key={f.submittedFormID} 
                        className={`hover:bg-gray-50 transition-colors ${
                          isSearchResult ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{f.title || 'Sin título'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{f.submittedFormID}</div>
                          {f.version && (
                            <div className="text-xs text-gray-500">v{f.version}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{f.jobID || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatTimestamp(f.dateSubmitted)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            f.status === 'Ok' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {formPdfs[formIdStr] ? (
                              <>
                                <button
                                  onClick={() => handleViewPdf(formIdStr)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                  title="Ver PDF"
                                >
                                  <File size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeletePdf(formIdStr)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Eliminar PDF"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleOpenPdfModal(formIdStr)}
                                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                                title="Agregar PDF"
                              >
                                <Upload size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loadingAll && allForms.length > 0 && totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Mostrando página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (allPagesLoaded) {
                        // Paginación en frontend
                        setCurrentPage(Math.max(1, currentPage - 1));
                      } else {
                        // Cargar página desde API
                        loadAllForms(Math.max(1, currentPage - 1), false).catch(console.error);
                      }
                    }}
                    disabled={currentPage === 1 || loadingAll}
                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => {
                      if (allPagesLoaded) {
                        // Paginación en frontend
                        setCurrentPage(Math.min(totalPages, currentPage + 1));
                      } else {
                        // Cargar página desde API
                        loadAllForms(currentPage + 1, false).catch(console.error);
                      }
                    }}
                    disabled={currentPage >= totalPages || loadingAll}
                    className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!form && !showAllForms && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Ingresa un ID de formulario para buscar y visualizar la información
            </p>
          </div>
        )}

        {/* PDF Upload Modal */}
        {showPdfModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="border-b p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Agregar PDF al Formulario</h2>
                <button
                  onClick={() => {
                    setShowPdfModal(false);
                    setSelectedFormId(null);
                    setPdfFile(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar archivo PDF
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfFileChange}
                    className="w-full border rounded-lg p-2.5"
                  />
                  {pdfFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Archivo seleccionado: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
                <div className="flex gap-3 pt-2 border-t">
                  <button
                    onClick={() => {
                      setShowPdfModal(false);
                      setSelectedFormId(null);
                      setPdfFile(null);
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePdf}
                    disabled={!pdfFile}
                    className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Guardar PDF
                  </button>
                </div>
              </div>
            </div>
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

export default FormulariosFormitize;

