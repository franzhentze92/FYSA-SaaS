import React, { useState, useEffect } from 'react';
import { Receipt, Search, Download, Eye, Settings, AlertCircle, CheckCircle2, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { FormitizeInvoice } from '@/types/formitize';
import { fetchFormitizeInvoice, fetchAllFormitizeInvoices, setFormitizeCredentials, getFormitizeCredentials } from '@/services/formitizeApi';
import { format } from 'date-fns';

const FacturasFormitize: React.FC = () => {
  const [invoiceId, setInvoiceId] = useState('');
  const [invoice, setInvoice] = useState<FormitizeInvoice | null>(null);
  const [allInvoices, setAllInvoices] = useState<FormitizeInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAllInvoices, setShowAllInvoices] = useState(true);
  const [showRangeInput, setShowRangeInput] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [credentials, setCredentials] = useState(() => {
    // Las credenciales están pre-configuradas en el servicio
    return {
      username: 'oficinafysa',
      password: '***', // No mostrar la contraseña real
      hasToken: true, // El token está configurado
    };
  });
  const [tempCredentials, setTempCredentials] = useState({
    username: 'oficinafysa',
    password: 'oficina123!!',
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvoice(null);

    if (!invoiceId.trim()) {
      setError('Por favor ingresa un ID de factura');
      return;
    }

    const id = parseInt(invoiceId);
    if (isNaN(id)) {
      setError('El ID de factura debe ser un número');
      return;
    }

    setLoading(true);
    setInvoice(null);
    try {
      const response = await fetchFormitizeInvoice(id);
      if (response && response.payload) {
        setInvoice(response.payload);
        setError(null);
        setShowAllInvoices(false); // Ocultar tabla cuando se muestra una factura específica
      } else {
        setError('La respuesta de la API no contiene datos de factura');
        setInvoice(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la factura';
      setError(errorMessage);
      setInvoice(null);
      console.error('Error al obtener factura de Formitize:', err);
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
      hasToken: false, // Si se cambian las credenciales, el token ya no aplica
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

  // Inicializar credenciales al cargar el componente
  useEffect(() => {
    const saved = getFormitizeCredentials();
    if (saved.username) {
      setCredentials({
        username: saved.username,
        password: saved.password || '***',
        hasToken: saved.hasToken || false,
      });
    } else {
      // Las credenciales ya están pre-configuradas en el servicio con el token
      setCredentials({ 
        username: 'oficinafysa', 
        password: '***',
        hasToken: true,
      });
    }
  }, []);

  const loadAllInvoices = async (startId?: number, endId?: number) => {
    setLoadingAll(true);
    setError(null);
    try {
      const invoices = await fetchAllFormitizeInvoices({ startId, endId });
      setAllInvoices(invoices);
      console.log('Facturas cargadas:', invoices.length);
      if (invoices.length === 0) {
        setError('No se encontraron facturas en el rango especificado.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar las facturas';
      console.error('Error al cargar facturas:', err);
      setError(errorMessage);
      setAllInvoices([]);
    } finally {
      setLoadingAll(false);
    }
  };

  const handleRefresh = () => {
    if (rangeStart && rangeEnd) {
      handleLoadByRange();
    } else {
      // Si no hay rango, intentar cargar sin parámetros (fallará pero mostrará el mensaje apropiado)
      loadAllInvoices();
    }
  };

  const handleLoadByRange = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);
    
    if (isNaN(start) || isNaN(end)) {
      setError('Por favor ingresa números válidos para el rango');
      return;
    }
    
    if (start > end) {
      setError('El ID inicial debe ser menor o igual al ID final');
      return;
    }
    
    if (end - start > 100) {
      setError('El rango no puede ser mayor a 100 facturas. Por favor, reduce el rango.');
      return;
    }
    
    loadAllInvoices(start, end);
  };

  const handleViewInvoice = async (invoiceId: number) => {
    setInvoiceId(invoiceId.toString());
    setLoading(true);
    setError(null);
    try {
      const response = await fetchFormitizeInvoice(invoiceId);
      if (response && response.payload) {
        setInvoice(response.payload);
        setError(null);
        setShowAllInvoices(false); // Ocultar tabla cuando se muestra una factura específica
      } else {
        setError('La respuesta de la API no contiene datos de factura');
        setInvoice(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener la factura';
      setError(errorMessage);
      setInvoice(null);
      console.error('Error al obtener factura de Formitize:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToTable = () => {
    setInvoice(null);
    setInvoiceId('');
    setShowAllInvoices(true);
    setError(null);
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd/MM/yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
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
                <Receipt size={32} />
                Facturas Formitize
              </h1>
              <p className="text-gray-600 mt-2">
                Consulta facturas desde el CRM Formitize
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
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                placeholder="Ingresa el ID de la factura (ej: 77)"
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
                  Buscar Factura
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

        {/* Back Button when viewing single invoice */}
        {invoice && (
          <div className="mb-4">
            <button
              onClick={handleBackToTable}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ExternalLink size={18} className="rotate-180" />
              Volver a la lista de facturas
            </button>
          </div>
        )}

        {/* Invoice Details */}
        {invoice && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Factura #{invoice.invoiceNumber}</h2>
                  <p className="text-slate-200">ID: {invoice.id}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Información de la Factura</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Factura:</span>
                      <span className="font-medium">{formatTimestamp(invoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha de Pago Esperada:</span>
                      <span className="font-medium">{formatTimestamp(invoice.expectedPayDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Moneda:</span>
                      <span className="font-medium">{invoice.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{invoice.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Orden #:</span>
                      <span className="font-medium">{invoice.orderNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referencia:</span>
                      <span className="font-medium">{invoice.reference || 'N/A'}</span>
                    </div>
                    {invoice.attachedTo && (invoice.attachedTo.job?.length > 0 || invoice.attachedTo.quote?.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-gray-600 text-sm">Vinculado A:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {invoice.attachedTo.job?.map((jobId, idx) => (
                            <span key={`job-${idx}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono">
                              Job {jobId}
                            </span>
                          ))}
                          {invoice.attachedTo.quote?.map((quoteId, idx) => (
                            <span key={`quote-${idx}`} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-mono">
                              Quote {quoteId}
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
                      <p className="font-medium">{invoice.companyName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Contacto:</span>
                      <p className="font-medium">{invoice.primaryContactName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{invoice.primaryContactEmail}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Teléfono:</span>
                      <p className="font-medium">{invoice.primaryContactPhone}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Dirección:</span>
                      <p className="font-medium">{invoice.primaryAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Items de la Factura</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unitario</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Descuento</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impuesto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.lineItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{item.description || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(parseFloat(item.unitAmount), invoice.currency)}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.discountPercentage}%</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.lineSubtotal, invoice.currency)}</td>
                          <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.taxAmount, invoice.currency)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(item.lineTotal, invoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Impuesto ({invoice.taxType}):</span>
                      <span className="font-medium">{formatCurrency(invoice.tax, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Pagado:</span>
                      <span>{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Pendiente:</span>
                      <span>{formatCurrency(invoice.total - invoice.amountPaid, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attached To */}
              {invoice.attachedTo && (invoice.attachedTo.job?.length > 0 || invoice.attachedTo.quote?.length > 0) && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Vinculado A</h3>
                  <div className="space-y-3">
                    {invoice.attachedTo.job && invoice.attachedTo.job.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Jobs:</h4>
                        <div className="flex flex-wrap gap-2">
                          {invoice.attachedTo.job.map((jobId, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                            >
                              <span>Job</span>
                              <span className="font-mono">{jobId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {invoice.attachedTo.quote && invoice.attachedTo.quote.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Quotes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {invoice.attachedTo.quote.map((quoteId, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200"
                            >
                              <span>Quote</span>
                              <span className="font-mono">{quoteId}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* History */}
              {invoice.history && invoice.history.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Historial</h3>
                  <div className="space-y-2">
                    {invoice.history.map((entry, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{entry.userName}</span>
                          <span className="text-gray-500">{entry.date}</span>
                        </div>
                        <p className="mt-1">{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Invoices Table */}
        {showAllInvoices && !invoice && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Todas las Facturas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {allInvoices.length > 0 ? `${allInvoices.length} facturas encontradas` : 'Cargando facturas...'}
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

            {loadingAll ? (
              <div className="p-12 text-center">
                <RefreshCw size={32} className="mx-auto text-gray-400 mb-4 animate-spin" />
                <p className="text-gray-500">Cargando facturas...</p>
              </div>
            ) : allInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">
                  No se encontraron facturas. Intenta buscar por ID específico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número de Factura
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pagado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vencimiento
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vinculado A
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</div>
                          <div className="text-xs text-gray-500">ID: {inv.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{inv.companyName}</div>
                          {inv.primaryContactName && (
                            <div className="text-xs text-gray-500">{inv.primaryContactName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(inv.total, inv.currency)}
                          </div>
                          {inv.tax > 0 && (
                            <div className="text-xs text-gray-500">Tax: {formatCurrency(inv.tax, inv.currency)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className={`text-sm font-medium ${inv.amountPaid > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                            {formatCurrency(inv.amountPaid, inv.currency)}
                          </div>
                          {inv.total - inv.amountPaid > 0 && (
                            <div className="text-xs text-red-600">
                              Pendiente: {formatCurrency(inv.total - inv.amountPaid, inv.currency)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatTimestamp(inv.invoiceDate)}</div>
                          <div className="text-xs text-gray-500">
                            {formatTimestamp(inv.invoiceDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatTimestamp(inv.expectedPayDate)}</div>
                          {new Date(inv.expectedPayDate * 1000) < new Date() && inv.amountPaid < inv.total && (
                            <div className="text-xs text-red-600 font-medium">Vencida</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {inv.attachedTo && (inv.attachedTo.job?.length > 0 || inv.attachedTo.quote?.length > 0) ? (
                            <div className="flex flex-wrap gap-1">
                              {inv.attachedTo.job?.slice(0, 2).map((jobId, idx) => (
                                <span key={`job-${idx}`} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                                  J{jobId}
                                </span>
                              ))}
                              {inv.attachedTo.quote?.slice(0, 2).map((quoteId, idx) => (
                                <span key={`quote-${idx}`} className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                                  Q{quoteId}
                                </span>
                              ))}
                              {((inv.attachedTo.job?.length || 0) + (inv.attachedTo.quote?.length || 0)) > 2 && (
                                <span className="text-xs text-gray-500">+{((inv.attachedTo.job?.length || 0) + (inv.attachedTo.quote?.length || 0)) - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewInvoice(inv.id)}
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

        {/* Empty State - Solo si no hay facturas y no se está mostrando la tabla */}
        {!invoice && !showAllInvoices && !loading && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Receipt size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              Ingresa un ID de factura para buscar y visualizar la información
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

export default FacturasFormitize;

