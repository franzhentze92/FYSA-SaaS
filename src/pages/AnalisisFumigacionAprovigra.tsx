import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  FileText, 
  RefreshCw,
  ExternalLink,
  Filter,
  Calendar
} from 'lucide-react';
import { useGoogleSheets, FumigacionRecord } from '@/hooks/useGoogleSheets';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const AnalisisFumigacionAprovigra: React.FC = () => {
  const { data, loading, error, stats, refetch } = useGoogleSheets();
  const [selectedClient, setSelectedClient] = useState<string>('todos');
  const [selectedService, setSelectedService] = useState<string>('todos');

  // Get unique clients and services for filters
  const clients = useMemo(() => {
    const unique = [...new Set(data.map(r => r.nombreCliente).filter(Boolean))];
    return unique.sort();
  }, [data]);

  const services = useMemo(() => {
    const unique = [...new Set(data.map(r => r.tipoServicio).filter(Boolean))];
    return unique.sort();
  }, [data]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (selectedClient !== 'todos' && record.nombreCliente !== selectedClient) return false;
      if (selectedService !== 'todos' && record.tipoServicio !== selectedService) return false;
      return true;
    });
  }, [data, selectedClient, selectedService]);

  // Prepare chart data
  const serviceTypeData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(r => {
      const type = r.tipoServicio || 'Sin especificar';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name: name.substring(0, 25), fullName: name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  const technicianData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(r => {
      const tech = r.tecnico || 'Sin asignar';
      grouped[tech] = (grouped[tech] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData]);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, { count: number; quantity: number }> = {};
    filteredData.forEach(r => {
      if (r.fechaServicio) {
        try {
          const date = new Date(r.fechaServicio);
          if (!isNaN(date.getTime())) {
            const monthKey = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
            if (!grouped[monthKey]) {
              grouped[monthKey] = { count: 0, quantity: 0 };
            }
            grouped[monthKey].count += 1;
            grouped[monthKey].quantity += r.cantidad || 0;
          }
        } catch {
          // Skip invalid dates
        }
      }
    });
    return Object.entries(grouped)
      .map(([month, data]) => ({ month, servicios: data.count, cantidad: Math.round(data.quantity) }))
      .slice(-12);
  }, [filteredData]);

  const clientData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(r => {
      const client = r.nombreCliente || 'Sin cliente';
      const shortName = client.length > 30 ? client.substring(0, 30) + '...' : client;
      grouped[shortName] = (grouped[shortName] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData]);

  const productData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredData.forEach(r => {
      const product = r.productosUtilizados || 'Sin especificar';
      if (product !== 'Sin especificar' && product !== 'N/A') {
        grouped[product] = (grouped[product] || 0) + 1;
      }
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredData]);

  // Calculate filtered stats
  const filteredStats = useMemo(() => {
    return {
      totalRecords: filteredData.length,
      totalQuantity: filteredData.reduce((sum, r) => sum + (r.cantidad || 0), 0),
      uniqueClients: new Set(filteredData.map(r => r.nombreCliente).filter(Boolean)).size,
      uniqueTechnicians: new Set(filteredData.map(r => r.tecnico).filter(Boolean)).size,
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos desde Google Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 size={32} className="text-emerald-600" />
                Análisis Fumigación Aprovigra
              </h1>
              <p className="text-gray-600 mt-2">
                Análisis de servicios de fumigación desde Google Sheets
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="https://docs.google.com/spreadsheets/d/17itEw9iLloWd1CrdWbB1hN901ScoD9NxULJjqPHA7Lg/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={16} />
                Ver Hoja de Cálculo
              </a>
              <button
                onClick={refetch}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <RefreshCw size={18} />
                Actualizar Datos
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                <strong>Nota:</strong> No se pudo conectar con Google Sheets. Mostrando datos de demostración.
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="todos">Todos los clientes</option>
                {clients.map((client) => (
                  <option key={client} value={client}>
                    {client.length > 50 ? client.substring(0, 50) + '...' : client}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Servicio</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="todos">Todos los servicios</option>
                {services.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Registros</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Cantidad Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.uniqueClients}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Técnicos</p>
                <p className="text-2xl font-bold text-gray-900">{filteredStats.uniqueTechnicians}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Services by Type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon size={20} className="text-emerald-600" />
              Servicios por Tipo
            </h3>
            {serviceTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [value, props.payload.fullName || name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </div>

          {/* Services by Technician */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              Servicios por Técnico
            </h3>
            {technicianData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={technicianData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-amber-600" />
              Tendencia Mensual
            </h3>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                  <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="servicios"
                    stroke="#10b981"
                    fill="#10b98133"
                    name="Servicios"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="cantidad"
                    stroke="#3b82f6"
                    fill="#3b82f633"
                    name="Cantidad"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </div>

          {/* Top Clients */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-purple-600" />
              Top Clientes
            </h3>
            {clientData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={clientData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No hay datos disponibles
              </div>
            )}
          </div>
        </div>

        {/* Products Used */}
        {productData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              Productos Utilizados
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Registros Recientes ({Math.min(filteredData.length, 10)} de {filteredData.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.slice(0, 10).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{record.fechaServicio || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {record.nombreCliente?.substring(0, 40) || '-'}
                      {record.nombreCliente && record.nombreCliente.length > 40 && '...'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.tipoServicio || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.tecnico || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {record.cantidad ? record.cantidad.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        record.status === 'Complete' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {record.status || 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalisisFumigacionAprovigra;

