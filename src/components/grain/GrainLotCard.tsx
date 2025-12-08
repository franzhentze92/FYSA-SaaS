import React from 'react';
import { GrainLot } from '@/types/grain';
import { calculateDaysStored } from '@/utils/lossCalculator';
import RiskBadge from './RiskBadge';
import { Calendar, MapPin, Scale, DollarSign, Clock, Eye, Plus } from 'lucide-react';

interface GrainLotCardProps {
  lot: GrainLot;
  onViewDetails: (lot: GrainLot) => void;
  onAddInspection: (lot: GrainLot) => void;
}

const GrainLotCard: React.FC<GrainLotCardProps> = ({ lot, onViewDetails, onAddInspection }) => {
  const daysStored = calculateDaysStored(lot.startDate);
  const lastInspection = lot.inspections.length > 0 
    ? lot.inspections[lot.inspections.length - 1].date 
    : 'No inspections';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{lot.grainType}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {lot.facility}
            </p>
          </div>
          <RiskBadge level={lot.riskLevel} size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Scale size={14} className="text-gray-400" />
            <span>{lot.quantity} {lot.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign size={14} className="text-gray-400" />
            <span>${lot.pricePerTon}/ton</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} className="text-gray-400" />
            <span>{daysStored} days stored</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span className="truncate">{lastInspection}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Estimated Loss</span>
            <span className="font-semibold text-red-600">{lot.estimatedLossPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${lot.riskLevel === 'high' ? 'bg-red-500' : lot.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(lot.estimatedLossPercent * 3, 100)}%` }}
            />
          </div>
          <p className="text-right text-sm font-medium text-gray-700 mt-1">${lot.estimatedLossValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex border-t border-gray-100">
        <button onClick={() => onViewDetails(lot)} className="flex-1 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-1.5">
          <Eye size={14} /> Details
        </button>
        <button onClick={() => onAddInspection(lot)} className="flex-1 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-1.5 border-l border-gray-100">
          <Plus size={14} /> Inspect
        </button>
      </div>
    </div>
  );
};

export default GrainLotCard;
