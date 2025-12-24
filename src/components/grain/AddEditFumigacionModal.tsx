import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { FumigacionSilo } from '@/types/grain';
import { useAdminServicios, SERVICIOS_DISPONIBLES } from '@/hooks/useAdminServicios';
import { useSilos } from '@/hooks/useSilos';

interface AddEditFumigacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fumigacion: Omit<FumigacionSilo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingFumigacion?: FumigacionSilo;
}

// Tipos de grano comunes
const TIPOS_GRANO = [
  'Maíz', 'Trigo', 'Arroz', 'Cebada', 'Sorgo', 'Mijo',
  'Avena', 'Centeno', 'Café', 'Cacao', 'Soya', 'Garbanzo', 
  'Malta', 'Grano de destilería'
];

// Productos fumigantes comunes
const PRODUCTOS_FUMIGANTES = [
  'Fosfuro de aluminio',
  'Fosfuro de magnesio',
  'Fosfina',
  'Bromuro de metilo',
  'Sulfuro de carbono',
  'Dióxido de Cloro',
  'Cipermetrina',
  'Deltametrina',
  'Vapona',
  'Otro'
];

// Dosis comunes
const DOSIS_OPCIONES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'Otro'
];

// Unidades de medida comunes
const UNIDADES_MEDIDA = [
  'pastillas',
  'tabletas/ton',
  'tabletas/m³',
  'g/ton',
  'g/m³',
  'kg/ton',
  'kg/m³',
  'ml/ton',
  'ml/m³',
  'ml/L',
  'ml/Gal',
  'L/Gal',
  'L/ton',
  'L/m³',
  'Otro'
];

// Técnicos disponibles
const TECNICOS = [
  'Hairon Coc',
  'Esvin Sosa',
  'Carlos Cabrera',
  'Alexander'
];

const AddEditFumigacionModal: React.FC<AddEditFumigacionModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  existingFumigacion 
}) => {
  const { clientes } = useAdminServicios();
  const { silos } = useSilos();

  const [selectedCliente, setSelectedCliente] = useState('');
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [silo, setSilo] = useState('');
  const [tipoGrano, setTipoGrano] = useState('');
  const [batchId, setBatchId] = useState('');
  const [fechaFumigacion, setFechaFumigacion] = useState(new Date().toISOString().split('T')[0]);
  const [productoUtilizado, setProductoUtilizado] = useState('Fosfuro de aluminio');
  const [productoCustom, setProductoCustom] = useState('');
  const [dosis, setDosis] = useState('3');
  const [dosisCustom, setDosisCustom] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('pastillas');
  const [unidadCustom, setUnidadCustom] = useState('');
  const [tecnico, setTecnico] = useState('Alexander');
  const [notas, setNotas] = useState('');

  // Filtrar silos por cliente seleccionado
  const silosDisponibles = useMemo(() => {
    if (!selectedCliente) return [];
    const cliente = clientes.find(c => c.id === selectedCliente);
    if (!cliente) return [];
    
    return silos
      .filter(s => s.clienteEmail === cliente.email)
      .map(s => {
        const num = s.number.toString().padStart(2, '0');
        return `AP-${num}`;
      })
      .sort();
  }, [selectedCliente, silos, clientes]);

  // Obtener el último batch del silo seleccionado (sin importar tipo de grano)
  const ultimoBatchSilo = useMemo(() => {
    if (!silo || existingFumigacion) return null;
    const siloNum = parseInt(silo.replace('AP-', ''));
    const siloEncontrado = silos.find(s => s.number === siloNum);
    
    if (!siloEncontrado || !siloEncontrado.batches || siloEncontrado.batches.length === 0) return null;
    
    // Ordenar batches por fecha de entrada (más reciente primero) y tomar el primero
    const batchesOrdenados = [...siloEncontrado.batches].sort((a, b) => {
      const dateA = new Date(a.entryDate).getTime();
      const dateB = new Date(b.entryDate).getTime();
      return dateB - dateA;
    });
    
    return batchesOrdenados[0];
  }, [silo, silos, existingFumigacion]);

  // Obtener batches disponibles para el silo y tipo de grano seleccionados
  const batchesDisponibles = useMemo(() => {
    if (!silo || !tipoGrano) return [];
    const siloNum = parseInt(silo.replace('AP-', ''));
    const siloEncontrado = silos.find(s => s.number === siloNum);
    
    if (!siloEncontrado || !siloEncontrado.batches) return [];
    
    // Filtrar batches por tipo de grano que coincidan
    return siloEncontrado.batches
      .filter(batch => batch.grainType === tipoGrano)
      .sort((a, b) => {
        // Ordenar por fecha de entrada (más reciente primero)
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        return dateB - dateA;
      });
  }, [silo, tipoGrano, silos]);

  // Auto-seleccionar tipo de grano y batch cuando se selecciona un silo
  useEffect(() => {
    if (silo && !existingFumigacion && ultimoBatchSilo) {
      // Auto-seleccionar el tipo de grano del último batch
      setTipoGrano(ultimoBatchSilo.grainType);
      // Auto-seleccionar el último batch
      setBatchId(ultimoBatchSilo.id);
    } else if (!silo && !existingFumigacion) {
      // Limpiar tipo de grano y batch si no hay silo
      setTipoGrano('');
      setBatchId('');
    }
  }, [silo, ultimoBatchSilo, existingFumigacion]);

  useEffect(() => {
    if (existingFumigacion) {
      // Para edición, necesitamos encontrar el cliente del silo
      const siloNum = parseInt(existingFumigacion.silo.replace('AP-', ''));
      const siloEncontrado = silos.find(s => s.number === siloNum);
      if (siloEncontrado?.clienteEmail) {
        const cliente = clientes.find(c => c.email === siloEncontrado.clienteEmail);
        if (cliente) {
          setSelectedCliente(cliente.id);
        }
      }
      
      setSilo(existingFumigacion.silo);
      setTipoGrano(existingFumigacion.tipoGrano);
      setBatchId(existingFumigacion.batchId || '');
      setServicioId(existingFumigacion.servicioId || null);
      setFechaFumigacion(existingFumigacion.fechaFumigacion);
      setProductoUtilizado(existingFumigacion.productoUtilizado || '');
      setDosis(existingFumigacion.dosis || '');
      setUnidadMedida(existingFumigacion.unidadMedida || '');
      setTecnico(existingFumigacion.tecnico || '');
      setNotas(existingFumigacion.notas || '');
    } else {
      // Reset form with default values
      setSelectedCliente('');
      setServicioId(null);
      setSilo('');
      setTipoGrano('');
      setBatchId('');
      setFechaFumigacion(new Date().toISOString().split('T')[0]);
      setProductoUtilizado('Fosfuro de aluminio');
      setProductoCustom('');
      setDosis('3');
      setDosisCustom('');
      setUnidadMedida('pastillas');
      setUnidadCustom('');
      setTecnico('Alexander');
      setNotas('');
    }
  }, [existingFumigacion, isOpen, silos, clientes]);

  // Resetear silo, tipo de grano y batch cuando cambia el cliente
  useEffect(() => {
    if (!existingFumigacion) {
      setSilo('');
      setTipoGrano('');
      setBatchId('');
    }
  }, [selectedCliente, existingFumigacion]);
  
  // Resetear servicio cuando cambia el cliente
  useEffect(() => {
    if (!existingFumigacion) {
      setServicioId(null);
    }
  }, [selectedCliente, existingFumigacion]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCliente || !servicioId || !silo || !tipoGrano || !batchId || !fechaFumigacion) {
      alert('Por favor completa los campos requeridos: Cliente, Servicio, Silo, Tipo de Grano, Batch y Fecha de Servicio Realizado');
      return;
    }

    // Usar valor custom si se seleccionó "Otro"
    const productoFinal = productoUtilizado === 'Otro' ? productoCustom : productoUtilizado;
    const dosisFinal = dosis === 'Otro' ? dosisCustom : dosis;
    const unidadFinal = unidadMedida === 'Otro' ? unidadCustom : unidadMedida;

    onSubmit({
      silo,
      tipoGrano,
      batchId: batchId || undefined,
      servicioId: servicioId || undefined,
      fechaFumigacion,
      productoUtilizado: productoFinal || undefined,
      dosis: dosisFinal || undefined,
      unidadMedida: unidadFinal || undefined,
      tecnico: tecnico || undefined,
      notas: notas || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingFumigacion ? 'Editar Fumigación' : 'Agregar Fumigación'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!existingFumigacion}
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
              ))}
            </select>
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio <span className="text-red-500">*</span>
            </label>
            <select
              value={servicioId || ''}
              onChange={(e) => setServicioId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar servicio</option>
              {SERVICIOS_DISPONIBLES.map(servicio => (
                <option key={servicio.id} value={servicio.id}>{servicio.titulo}</option>
              ))}
            </select>
          </div>

          {/* Silo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Silo <span className="text-red-500">*</span>
            </label>
            <select
              value={silo}
              onChange={(e) => setSilo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedCliente}
            >
              <option value="">{selectedCliente ? 'Seleccionar silo' : 'Primero selecciona un cliente'}</option>
              {silosDisponibles.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {silo && tipoGrano && (
              <p className="text-xs text-gray-500 mt-1">
                Último grano registrado en {silo}: {tipoGrano}
              </p>
            )}
          </div>

          {/* Tipo de Grano */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Grano <span className="text-red-500">*</span>
            </label>
            <select
              value={tipoGrano}
              onChange={(e) => setTipoGrano(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              required
              disabled={!silo || !existingFumigacion}
            >
              <option value="">{silo ? 'Seleccionar tipo de grano' : 'Primero selecciona un silo'}</option>
              {TIPOS_GRANO.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            {!existingFumigacion && silo && tipoGrano && (
              <p className="text-xs text-gray-500 mt-1">
                Seleccionado automáticamente del último batch del silo
              </p>
            )}
          </div>

          {/* Batch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch de Grano <span className="text-red-500">*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              required
              disabled={!silo || !tipoGrano || batchesDisponibles.length === 0 || !existingFumigacion}
            >
              <option value="">
                {!silo 
                  ? 'Primero selecciona un silo' 
                  : !tipoGrano 
                  ? 'Primero selecciona un tipo de grano'
                  : batchesDisponibles.length === 0
                  ? 'No hay batches disponibles para este tipo de grano en este silo'
                  : 'Seleccionar batch'}
              </option>
              {batchesDisponibles.map(batch => {
                const barcoNombre = batch.origin || 'Sin barco';
                const fechaEntrada = new Date(batch.entryDate).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
                const cantidad = batch.unit === 'tonnes' ? batch.quantity : (batch.quantity / 1000);
                return (
                  <option key={batch.id} value={batch.id}>
                    {batch.id.substring(0, 8).toUpperCase()} - {barcoNombre} ({fechaEntrada}) - {cantidad.toFixed(2)} tons
                  </option>
                );
              })}
            </select>
            {batchId && batchesDisponibles.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {batchesDisponibles.find(b => b.id === batchId) && (() => {
                  const batchSeleccionado = batchesDisponibles.find(b => b.id === batchId);
                  if (!batchSeleccionado) return null;
                  const cantidad = batchSeleccionado.unit === 'tonnes' ? batchSeleccionado.quantity : (batchSeleccionado.quantity / 1000);
                  return (
                    <>
                      {!existingFumigacion && 'Seleccionado automáticamente: '}
                      Cantidad: {cantidad.toFixed(2)} tons
                      {batchSeleccionado.grainSubtype && ` • Variedad: ${batchSeleccionado.grainSubtype}`}
                    </>
                  );
                })()}
              </p>
            )}
          </div>

          {/* Fecha de Servicio Realizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Servicio Realizado <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fechaFumigacion}
              onChange={(e) => setFechaFumigacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Producto Utilizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto Utilizado
            </label>
            <select
              value={productoUtilizado}
              onChange={(e) => setProductoUtilizado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar producto</option>
              {PRODUCTOS_FUMIGANTES.map(producto => (
                <option key={producto} value={producto}>{producto}</option>
              ))}
            </select>
            {productoUtilizado === 'Otro' && (
              <input
                type="text"
                value={productoCustom}
                onChange={(e) => setProductoCustom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                placeholder="Especificar producto"
              />
            )}
          </div>

          {/* Dosis y Unidad de Medida */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosis
              </label>
              <select
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar dosis</option>
                {DOSIS_OPCIONES.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {dosis === 'Otro' && (
                <input
                  type="text"
                  value={dosisCustom}
                  onChange={(e) => setDosisCustom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="Especificar dosis"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Medida
              </label>
              <select
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar unidad</option>
                {UNIDADES_MEDIDA.map(unidad => (
                  <option key={unidad} value={unidad}>{unidad}</option>
                ))}
              </select>
              {unidadMedida === 'Otro' && (
                <input
                  type="text"
                  value={unidadCustom}
                  onChange={(e) => setUnidadCustom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="Especificar unidad"
                />
              )}
            </div>
          </div>

          {/* Técnico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Técnico
            </label>
            <select
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TECNICOS.map(tec => (
                <option key={tec} value={tec}>{tec}</option>
              ))}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas adicionales sobre la fumigación"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              {existingFumigacion ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditFumigacionModal;

