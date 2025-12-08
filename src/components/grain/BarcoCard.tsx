import React from 'react';
import { Ship, Calendar, Package, Bug, Shield, Edit, Trash2 } from 'lucide-react';
import { Barco } from '@/types/grain';
import { format } from 'date-fns';

interface BarcoCardProps {
  barco: Barco;
  nombreBarco: string; // Nombre del barco desde el catálogo
  getVariedadNombre?: (variedadId?: string) => string | null;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin?: boolean; // Indica si el usuario es admin
}

const BarcoCard: React.FC<BarcoCardProps> = ({ barco, nombreBarco, getVariedadNombre, onEdit, onDelete, isAdmin = false }) => {
  const totalInsectos = barco.muestreoInsectos.reduce((sum, insect) => sum + insect.count, 0);
  const tieneInsectos = totalInsectos > 0;

  return (
    <div className={`bg-white rounded-lg border-2 ${
      barco.requiereTratamientoOIRSA ? 'border-red-500' : 'border-gray-200'
    } shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              barco.requiereTratamientoOIRSA 
                ? 'bg-red-100 text-red-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              <Ship size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{nombreBarco}</h3>
              <p className="text-sm text-gray-500">
                {barco.granos.length} tipo{barco.granos.length !== 1 ? 's' : ''} de grano
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Información Principal */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-gray-600">Fondeo:</span>
            <span className="font-medium">
              {format(new Date(barco.fechaFondeo), 'dd/MM/yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-600">Total:</span>
            <span className="font-medium">
              {barco.granos.reduce((sum, g) => sum + g.cantidad, 0).toLocaleString()} toneladas
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Bug size={16} className="text-gray-400" />
            <span className="text-gray-600">Insectos encontrados:</span>
            <span className={`font-medium ${
              tieneInsectos ? 'text-red-600' : 'text-green-600'
            }`}>
              {totalInsectos > 0 ? totalInsectos : 'Ninguno'}
            </span>
          </div>
        </div>

        {/* Detalle de Granos */}
        {barco.granos.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Granos transportados:</p>
            <div className="space-y-2">
              {barco.granos.map((grano, idx) => {
                const variedadNombre = getVariedadNombre?.(grano.variedadId);
                return (
                  <div key={grano.id || idx} className="flex items-start justify-between text-xs bg-white p-2 rounded border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                          ID: {grano.id ? grano.id.substring(0, 8).toUpperCase() : 'N/A'}
                        </span>
                      </div>
                      <span className="text-gray-700 font-medium">
                        {grano.tipoGrano}
                        {variedadNombre && <span className="text-gray-500 ml-1">({variedadNombre})</span>}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 ml-2">{grano.cantidad.toLocaleString()} ton</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detalle de Insectos */}
        {tieneInsectos && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Detalle de muestreo:</p>
            <div className="space-y-1">
              {barco.muestreoInsectos.map((insect, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-gray-600">{insect.pestType}:</span>
                  <span className="font-medium">{insect.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tratamiento OIRSA */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          barco.requiereTratamientoOIRSA 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          <Shield size={18} className={
            barco.requiereTratamientoOIRSA ? 'text-red-600' : 'text-green-600'
          } />
          <span className={`text-sm font-medium ${
            barco.requiereTratamientoOIRSA ? 'text-red-700' : 'text-green-700'
          }`}>
            {barco.requiereTratamientoOIRSA 
              ? 'Tratamiento OIRSA Requerido' 
              : 'Sin Tratamiento OIRSA'}
          </span>
        </div>

        {/* Notas */}
        {barco.notas && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <span className="font-medium">Notas:</span> {barco.notas}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcoCard;

