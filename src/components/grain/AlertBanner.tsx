import React from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

interface AlertBannerProps {
  alerts: { id: string; message: string; facility: string; action: string }[];
  onDismiss: (id: string) => void;
  onTakeAction: (id: string) => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ alerts, onDismiss, onTakeAction }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <div className="flex-shrink-0 p-1.5 bg-red-100 rounded-full">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-800">{alert.message}</p>
            <p className="text-xs text-red-600 mt-0.5">{alert.facility}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTakeAction(alert.id)}
              className="text-xs font-medium text-red-700 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100"
            >
              {alert.action} <ArrowRight size={12} />
            </button>
            <button
              onClick={() => onDismiss(alert.id)}
              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
