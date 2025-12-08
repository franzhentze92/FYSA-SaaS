import React, { useState, useEffect } from 'react';
import { FileText, Search, Eye, Settings, AlertCircle, CheckCircle2, XCircle, RefreshCw, ExternalLink, Calendar, User, MapPin, DollarSign, Building2 } from 'lucide-react';
import { FormitizeQuote } from '@/types/formitize';
import { fetchFormitizeQuote, fetchAllFormitizeQuotes, setFormitizeCredentials, getFormitizeCredentials } from '@/services/formitizeApi';
import { format } from 'date-fns';

const CotizacionesFormitize: React.FC = () => {
  const [quoteId, setQuoteId] = useState('');
  const [quote, setQuote] = useState<FormitizeQuote | null>(null);
  const [allQuotes, setAllQuotes] = useState<FormitizeQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAllQuotes, setShowAllQuotes] = useState(true);
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
    value: '',
    clientID: '',
    datecreatedFrom: '',
    datecreatedTo: '',
    page: 1,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setQuote(null);

    if (!quoteId.trim()) {
      setError('Por favor ingresa un ID de cotización');
      return;
    }

    const id = parseInt(quoteId);
    if (isNaN(id)) {
      setError('El ID de cotización debe ser un número');
      return;
    }

    setLoading(true);
    setQuote(null);
    try {
      const quoteData = await fetchFormitizeQuote(id);
      if (quoteData) {
        console.log('Cotización completa obtenida:', quoteData);
        setQuote(quoteData);
        setError(null);
        setShowAllQuotes(false);
      } else {
        setError('La respuesta de la API no contiene datos de cotización');
        setQuote(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la cotización';
      setError(errorMessage);
      setQuote(null);
      console.error('Error al obtener cotización de Formitize:', err);
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
    loadAllQuotes();
  }, []);

  const loadAllQuotes = async () => {
    setLoadingAll(true);
    setError(null);
    try {
      const quotes = await fetchAllFormitizeQuotes({
        value: filters.value || undefined,
        clientID: filters.clientID ? parseInt(filters.clientID) : undefined,
        datecreatedFrom: filters.datecreatedFrom || undefined,
        datecreatedTo: filters.datecreatedTo || undefined,
        page: filters.page,
      });
      setAllQuotes(quotes);
      console.log('Cotizaciones cargadas:', quotes.length);
      if (quotes.length === 0) {
        setError('No se encontraron cotizaciones con los filtros especificados.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las cotizaciones';
      console.error('Error al cargar cotizaciones:', err);
      setError(errorMessage);
      setAllQuotes([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleRefresh = () => {
    loadAllQuotes();
  };

  const handleViewQuote = async (quoteId: number) => {
    setQuoteId(quoteId.toString());
    setLoading(true);
    setError(null);
    try {
      const quoteData = await fetchFormitizeQuote(quoteId);
      if (quoteData) {
        console.log('Cotización completa obtenida:', quoteData);
        setQuote(quoteData);
        setError(null);
        setShowAllQuotes(false);
      } else {
        setError('La respuesta de la API no contiene datos de cotización');
        setQuote(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la cotización';
      setError(errorMessage);
      setQuote(null);
      console.error('Error al obtener cotización de Formitize:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTable = () => {
    setQuote(null);
    setQuoteId('');
    setShowAllQuotes(true);
    setError(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const ts = parseInt(timestamp);
    if (isNaN(ts) || ts === 0) return 'N/A';
    return format(new Date(ts * 1000), 'dd/MM/yyyy');
  };

  const formatCurrency = (amount: string, currency: string = 'AUD') => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
                <FileText size={32} />
                Cotizaciones Formitize
              </h1>
              <p className="text-gray-600 mt-2">
                Consulta cotizaciones desde el CRM Formitize
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
                value={quoteId}
                onChange={(e) => setQuoteId(e.target.value)}
                placeholder="Ingresa el ID de la cotización (ej: 485)"
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
                  Buscar Cotización
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

        {/* Back Button when viewing single quote */}
        {quote && (
          <div className="mb-4">
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink size={18} className="rotate-180" />
              Volver a la lista de cotizaciones
            </button>
          </div>
        )}

        {/* Quote Details */}
        {quote && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Cotización #{quote.quoteNumber}</h2>
                  <p className="text-slate-200">ID: {quote.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información de la Cotización</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Cotización:</span>
                      <span className="font-medium">{quote.quoteNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Cotización:</span>
                      <span className="font-medium">{formatTimestamp(quote.quoteDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Moneda:</span>
                      <span className="font-medium">{quote.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Impuesto:</span>
                      <span className="font-medium">{quote.taxType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Orden:</span>
                      <span className="font-medium">{quote.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referencia:</span>
                      <span className="font-medium">{quote.reference || 'N/A'}</span>
                    </div>
                    {quote.attachedTo && quote.attachedTo.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-600 text-sm">Vinculado A:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {quote.attachedTo.map((item: any, idx: number) => (
                            <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {JSON.stringify(item)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información del Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Empresa:</span>
                      <p className="font-medium">{quote.companyname}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contacto:</span>
                      <p className="font-medium">{quote.primaryContactName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{quote.primaryContactEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Teléfono:</span>
                      <p className="font-medium">{quote.primaryContactPhone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <p className="font-medium">{quote.primaryAddress}</p>
                    </div>
                    {quote.addressTo && (
                      <div>
                        <span className="text-gray-600">Dirección de Envío:</span>
                        <p className="font-medium">{quote.addressTo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(quote.subtotal, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impuesto ({quote.taxType}):</span>
                      <span className="font-medium">{formatCurrency(quote.tax, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(quote.total, quote.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Pagado:</span>
                      <span>{formatCurrency(quote.amountPaid, quote.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title, Summary, Terms */}
              {(quote.title || quote.summary || quote.terms) && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  {quote.title && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Título</h3>
                      <p className="text-sm text-gray-700">{quote.title}</p>
                    </div>
                  )}
                  {quote.summary && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Resumen</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.summary}</p>
                    </div>
                  )}
                  {quote.terms && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Términos</h3>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.terms}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Quotes Table */}
        {showAllQuotes && !quote && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cotizaciones</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {allQuotes.length > 0 ? `${allQuotes.length} cotizaciones encontradas` : 'Cargando cotizaciones...'}
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Búsqueda
                    </label>
                    <input
                      type="text"
                      value={filters.value}
                      onChange={(e) => setFilters({ ...filters, value: e.target.value })}
                      onBlur={() => loadAllQuotes()}
                      placeholder="Buscar en cotizaciones"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID del Cliente
                    </label>
                    <input
                      type="number"
                      value={filters.clientID}
                      onChange={(e) => setFilters({ ...filters, clientID: e.target.value })}
                      onBlur={() => loadAllQuotes()}
                      placeholder="Filtrar por Client ID"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creada Desde
                    </label>
                    <input
                      type="date"
                      value={filters.datecreatedFrom}
                      onChange={(e) => setFilters({ ...filters, datecreatedFrom: e.target.value })}
                      onBlur={() => loadAllQuotes()}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Creada Hasta
                    </label>
                    <input
                      type="date"
                      value={filters.datecreatedTo}
                      onChange={(e) => setFilters({ ...filters, datecreatedTo: e.target.value })}
                      onBlur={() => loadAllQuotes()}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {loadingAll ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="mx-auto text-gray-400 mb-4 animate-spin" />
                <p className="text-gray-500">Cargando cotizaciones...</p>
              </div>
            ) : allQuotes.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  No se encontraron cotizaciones. Intenta ajustar los filtros o buscar por ID específico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número / ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allQuotes.map((q) => (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{q.quoteNumber}</div>
                          <div className="text-xs text-gray-500">ID: {q.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{q.companyname}</div>
                          {q.primaryContactName && (
                            <div className="text-xs text-gray-500">{q.primaryContactName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(q.total, q.currency)}
                          </div>
                          {parseFloat(q.tax) > 0 && (
                            <div className="text-xs text-gray-500">Tax: {formatCurrency(q.tax, q.currency)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatTimestamp(q.quoteDate)}</div>
                          {q.quoteDateFormatted && (
                            <div className="text-xs text-gray-500">{q.quoteDateFormatted}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(q.status)}`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewQuote(parseInt(q.id))}
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
        {!quote && !showAllQuotes && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Ingresa un ID de cotización para buscar y visualizar la información
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

export default CotizacionesFormitize;

