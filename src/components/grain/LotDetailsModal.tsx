import React from 'react';
import { X, Calendar, MapPin, Scale, DollarSign, Thermometer, Droplets } from 'lucide-react';
import { GrainLot } from '@/types/grain';
import { calculateDaysStored, getRecommendation } from '@/utils/lossCalculator';
import RiskBadge from './RiskBadge';

interface LotDetailsModalProps {
  lot: GrainLot | null;
  isOpen: boolean;
  onClose: () => void;
}

const LotDetailsModal: React.FC<LotDetailsModalProps> = ({ lot, isOpen, onClose }) => {
  if (!isOpen || !lot) return null;

  const daysStored = calculateDaysStored(lot.startDate);
  const lastInspection = lot.inspections[lot.inspections.length - 1];
  const recommendation = lastInspection ? getRecommendation(lot.riskLevel, lastInspection.humidity) : 'Add first inspection';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{lot.grainType}</h2>
            <RiskBadge level={lot.riskLevel} size="sm" />
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> Facility</p>
              <p className="font-semibold mt-1">{lot.facility}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Scale size={12} /> Quantity</p>
              <p className="font-semibold mt-1">{lot.quantity} {lot.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1"><DollarSign size={12} /> Value</p>
              <p className="font-semibold mt-1">${lot.pricePerTon}/ton</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12} /> Days Stored</p>
              <p className="font-semibold mt-1">{daysStored} days</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-red-600">Estimated Loss</p>
                <p className="text-2xl font-bold text-red-700">{lot.estimatedLossPercent}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-red-600">Monetary Value</p>
                <p className="text-2xl font-bold text-red-700">${lot.estimatedLossValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm font-medium text-amber-800">Recommended Action</p>
            <p className="text-amber-700 mt-1">{recommendation}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Inspection History ({lot.inspections.length})</h3>
            {lot.inspections.length === 0 ? (
              <p className="text-gray-500 text-sm">No inspections recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {lot.inspections.map(insp => (
                  <div key={insp.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{insp.date}</span>
                      <div className="flex gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Thermometer size={12} />{insp.temperature}°C</span>
                        <span className="flex items-center gap-1"><Droplets size={12} />{insp.humidity}%</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {insp.pestCounts.map((pc, i) => (
                        <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{pc.pestType}: {pc.alive}A/{pc.dead}D</span>
                      ))}
                    </div>
                    {insp.notes && <p className="text-sm text-gray-600 mt-2">{insp.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotDetailsModal;
