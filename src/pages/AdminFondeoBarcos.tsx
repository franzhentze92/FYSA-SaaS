import React, { useState, useMemo } from 'react';
import { Ship, Plus, Search, X, Users, Calendar, FileText } from 'lucide-react';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useBarcos } from '@/hooks/useBarcos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { Barco } from '@/types/grain';
import { format } from 'date-fns';

const AdminFondeoBarcos: React.FC = () => {
  const { clientes } = useAdminServicios();
  const { barcos, addBarco, updateBarco, deleteBarco } = useBarcos();
  const { barcosMaestros } = useCatalogos();

  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBarco, setEditingBarco] = useState<Barco | null>(null);
  const [newBarco, setNewBarco] = useState({
    fechaFondeo: new Date().toISOString().split('T')[0],
    barcoMaestroId: '',
    granos: [] as Array<{
      tipoGrano: string;
      variedadId?: string;
      cantidad: number;
    }>,
    muestras: [] as Array<{
      tipoInsecto: string;
      cantidad: number;
    }>,
    requiereTratamientoOIRSA: false,
    notas: '',
  });

  // Obtener barcos del cliente seleccionado
  const barcosDelCliente = useMemo(() => {
    if (!selectedCliente) return barcos;
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) return [];
    // Filtrar barcos asignados a este cliente
    return barcos.filter(b => {
      return (b as any).clienteEmail === cliente.email;
    });
  }, [selectedCliente, barcos, clientes]);

  // Filtrar barcos por búsqueda
  const barcosFiltrados = useMemo(() => {
    if (!searchQuery) return barcosDelCliente;
    const query = searchQuery.toLowerCase();
    return barcosDelCliente.filter(barco => {
      const barcoMaestro = barcosMaestros.find(bm => bm.id === barco.barcoId);
      return barcoMaestro?.nombre.toLowerCase().includes(query) ||
        format(new Date(barco.fechaFondeo), 'dd/MM/yyyy').includes(query);
    });
  }, [barcosDelCliente, searchQuery, barcosMaestros]);

  const handleAgregarBarco = () => {
    if (!selectedCliente) {
      alert('Por favor selecciona un cliente');
      return;
    }

    if (!newBarco.fechaFondeo || !newBarco.barcoMaestroId) {
      alert('Por favor completa la fecha de fondeo y selecciona un barco');
      return;
    }

    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) {
      alert('Cliente no encontrado');
      return;
    }

    const barcoData: Omit<Barco, 'id'> = {
      fechaFondeo: newBarco.fechaFondeo,
      barcoMaestroId: newBarco.barcoMaestroId,
      granos: newBarco.granos,
      muestras: newBarco.muestras,
      requiereTratamientoOIRSA: newBarco.requiereTratamientoOIRSA,
      notas: newBarco.notas || undefined,
      clienteEmail: cliente.email, // Agregar email del cliente
    };

    if (editingBarco) {
      updateBarco(editingBarco.id, barcoData);
    } else {
      addBarco(barcoData);
    }

    // Resetear formulario
    setNewBarco({
      fechaFondeo: new Date().toISOString().split('T')[0],
      barcoMaestroId: '',
      granos: [],
      muestras: [],
      requiereTratamientoOIRSA: false,
      notas: '',
    });
    setEditingBarco(null);
    setShowAddModal(false);
  };

  const handleEdit = (barco: Barco) => {
    setEditingBarco(barco);
    setNewBarco({
      fechaFondeo: barco.fechaFondeo,
      barcoMaestroId: barco.barcoId,
      granos: barco.granos?.map(g => ({
        id: g.id,
        tipoGrano: g.tipoGrano,
        variedadId: g.variedadId,
        cantidad: g.cantidad,
      })) || [],
      muestras: barco.muestreoInsectos?.map(m => ({
        tipoInsecto: m.pestType,
        cantidad: m.count,
      })) || [],
      requiereTratamientoOIRSA: barco.requiereTratamientoOIRSA || false,
      notas: barco.notas || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = (barcoId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de fondeo?')) {
      deleteBarco(barcoId);
    }
  };

  const handleAddGrano = () => {
    setNewBarco({
      ...newBarco,
      granos: [...newBarco.granos, { tipoGrano: '', cantidad: 0 }],
    });
  };

  const handleRemoveGrano = (index: number) => {
    setNewBarco({
      ...newBarco,
      granos: newBarco.granos.filter((_, i) => i !== index),
    });
  };

  const handleUpdateGrano = (index: number, field: string, value: any) => {
    const updatedGranos = [...newBarco.granos];
    updatedGranos[index] = { ...updatedGranos[index], [field]: value };
    setNewBarco({ ...newBarco, granos: updatedGranos });
  };

  const handleAddMuestra = () => {
    setNewBarco({
      ...newBarco,
      muestras: [...newBarco.muestras, { tipoInsecto: '', cantidad: 0 }],
    });
  };

  const handleRemoveMuestra = (index: number) => {
    setNewBarco({
      ...newBarco,
      muestras: newBarco.muestras.filter((_, i) => i !== index),
    });
  };

  const handleUpdateMuestra = (index: number, field: string, value: any) => {
    const updatedMuestras = [...newBarco.muestras];
    updatedMuestras[index] = { ...updatedMuestras[index], [field]: value };
    setNewBarco({ ...newBarco, muestras: updatedMuestras });
  };

  const clienteSeleccionado = clientes.find(c => c.id === selectedCliente);
  const barcosDisponibles = barcosMaestros.filter(b => b.activo);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Ship size={32} />
            Administración de Fondeo de Barcos
          </h1>
          <p className="text-gray-600 mt-2">
            Agrega y asigna registros de fondeo de barcos a los clientes
          </p>
        </div>

        {/* Selector de Cliente */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                value={selectedCliente}
                onChange={(e) => setSelectedCliente(e.target.value)}
                className="w-full border rounded-lg p-2.5"
              >
                <option value="">Todos los clientes</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} ({cliente.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-4">
              <button
                onClick={() => {
                  setEditingBarco(null);
                  setNewBarco({
                    fechaFondeo: new Date().toISOString().split('T')[0],
                    barcoMaestroId: '',
                    granos: [],
                    muestras: [],
                    requiereTratamientoOIRSA: false,
                    notas: '',
                  });
                  setShowAddModal(true);
                }}
                disabled={!selectedCliente}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Agregar Fondeo
              </button>
            </div>
          </div>
          {selectedCliente && clienteSeleccionado && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cliente seleccionado:</span> {clienteSeleccionado.nombre}
              </p>
            </div>
          )}
        </div>

        {/* Tabla de Barcos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Ship size={24} />
              Registros de Fondeo {selectedCliente ? `de ${clienteSeleccionado?.nombre}` : ''}
            </h2>
            <div className="flex-1 max-w-md ml-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar fondeos..."
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            </div>
          </div>

          {barcosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Ship size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {barcosDelCliente.length === 0
                  ? selectedCliente
                    ? 'No hay registros de fondeo para este cliente. Agrega el primer registro.'
                    : 'Selecciona un cliente para agregar registros de fondeo.'
                  : 'No se encontraron registros con la búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Fondeo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barco
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Granos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tratamiento OIRSA
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {barcosFiltrados
                    .sort((a, b) => new Date(b.fechaFondeo).getTime() - new Date(a.fechaFondeo).getTime())
                    .map((barco) => {
                      const barcoMaestro = barcosMaestros.find(bm => bm.id === barco.barcoId);
                      const barcoCliente = clientes.find(c => c.email === barco.clienteEmail);
                      const totalGrano = barco.granos?.reduce((sum, g) => sum + (g.cantidad || 0), 0) || 0;
                      return (
                        <tr key={barco.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {format(new Date(barco.fechaFondeo), 'dd/MM/yyyy')}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {barcoMaestro?.nombre || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {barcoCliente?.nombre || barco.clienteEmail || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-700">
                              {barco.granos?.length || 0} tipo(s) - {totalGrano.toLocaleString()} toneladas
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {barco.requiereTratamientoOIRSA ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Sí
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                No
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(barco)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Editar"
                              >
                                <FileText size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(barco.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Eliminar"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal para Agregar/Editar Fondeo */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="border-b p-4 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-lg font-semibold">
                  {editingBarco ? 'Editar Registro de Fondeo' : 'Agregar Nuevo Registro de Fondeo'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewBarco({
                      fechaFondeo: new Date().toISOString().split('T')[0],
                      barcoMaestroId: '',
                      granos: [],
                      muestras: [],
                      requiereTratamientoOIRSA: false,
                      notas: '',
                    });
                    setEditingBarco(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fondeo *
                  </label>
                  <input
                    type="date"
                    value={newBarco.fechaFondeo}
                    onChange={(e) => setNewBarco({ ...newBarco, fechaFondeo: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barco *
                  </label>
                  <select
                    value={newBarco.barcoMaestroId}
                    onChange={(e) => setNewBarco({ ...newBarco, barcoMaestroId: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    required
                  >
                    <option value="">Selecciona un barco</option>
                    {barcosDisponibles.map((barco) => (
                      <option key={barco.id} value={barco.id}>
                        {barco.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedCliente && clienteSeleccionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Cliente:</span> {clienteSeleccionado.nombre}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Granos
                  </label>
                  <div className="space-y-2">
                    {newBarco.granos.map((grano, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={grano.tipoGrano}
                            onChange={(e) => handleUpdateGrano(index, 'tipoGrano', e.target.value)}
                            placeholder="Tipo de grano"
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={grano.cantidad}
                            onChange={(e) => handleUpdateGrano(index, 'cantidad', parseFloat(e.target.value) || 0)}
                            placeholder="Cantidad"
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveGrano(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddGrano}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Agregar Grano
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Muestras de Insectos
                  </label>
                  <div className="space-y-2">
                    {newBarco.muestras.map((muestra, index) => (
                      <div key={index} className="flex gap-2 items-end">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={muestra.tipoInsecto}
                            onChange={(e) => handleUpdateMuestra(index, 'tipoInsecto', e.target.value)}
                            placeholder="Tipo de insecto"
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            value={muestra.cantidad}
                            onChange={(e) => handleUpdateMuestra(index, 'cantidad', parseInt(e.target.value) || 0)}
                            placeholder="Cantidad"
                            className="w-full border rounded-lg p-2.5 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveMuestra(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleAddMuestra}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus size={16} />
                      Agregar Muestra
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newBarco.requiereTratamientoOIRSA}
                      onChange={(e) => setNewBarco({ ...newBarco, requiereTratamientoOIRSA: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Requiere tratamiento OIRSA
                    </span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={newBarco.notas}
                    onChange={(e) => setNewBarco({ ...newBarco, notas: e.target.value })}
                    className="w-full border rounded-lg p-2.5"
                    rows={3}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewBarco({
                        fechaFondeo: new Date().toISOString().split('T')[0],
                        barcoMaestroId: '',
                        granos: [],
                        muestras: [],
                        requiereTratamientoOIRSA: false,
                        notas: '',
                      });
                      setEditingBarco(null);
                    }}
                    className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAgregarBarco}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
                  >
                    {editingBarco ? 'Guardar Cambios' : 'Agregar Fondeo'}
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

export default AdminFondeoBarcos;

