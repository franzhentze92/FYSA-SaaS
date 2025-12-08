import React from 'react';
import { X, Download, FileText, Printer } from 'lucide-react';
import { GrainLot } from '@/types/grain';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lots: GrainLot[];
  totalLoss: number;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, lots, totalLoss }) => {
  if (!isOpen) return null;

  const highRiskLots = lots.filter(l => l.riskLevel === 'high');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const reportContent = `
STORED GRAIN PEST MONITORING REPORT
Generated: ${today}
=====================================

SUMMARY
-------
Total Active Lots: ${lots.length}
High Risk Lots: ${highRiskLots.length}
Total Estimated Loss: $${totalLoss.toLocaleString()}

LOT DETAILS
-----------
${lots.map(lot => `
${lot.grainType} - ${lot.facility}
  Quantity: ${lot.quantity} ${lot.unit}
  Risk Level: ${lot.riskLevel.toUpperCase()}
  Estimated Loss: ${lot.estimatedLossPercent}% ($${lot.estimatedLossValue.toLocaleString()})
  Inspections: ${lot.inspections.length}
`).join('\n')}

RECOMMENDATIONS
---------------
${highRiskLots.length > 0 ? highRiskLots.map(l => `- ${l.facility}: Immediate fumigation recommended`).join('\n') : 'No immediate actions required.'}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pest-monitoring-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold">Export Report</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Report Date</p>
            <p className="font-semibold">{today}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Lots</p>
              <p className="text-2xl font-bold">{lots.length}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Total Loss</p>
              <p className="text-2xl font-bold text-red-700">${totalLoss.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">The report will include lot details, inspection history, charts, and recommendations.</p>
        </div>
        <div className="border-t p-4 flex gap-3">
          <button onClick={handlePrint} className="flex-1 py-2.5 border rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
            <Printer size={16} /> Print
          </button>
          <button onClick={handleDownload} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
            <Download size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
