import React from 'react';

interface RiskMatrixProps {
  data: { facility: string; week1: number; week2: number; week3: number; week4: number }[];
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ data }) => {
  const getColor = (value: number) => {
    if (value < 2) return 'bg-emerald-100 text-emerald-700';
    if (value < 5) return 'bg-emerald-200 text-emerald-800';
    if (value < 8) return 'bg-amber-200 text-amber-800';
    if (value < 12) return 'bg-orange-300 text-orange-900';
    return 'bg-red-400 text-red-900';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Matrix (Loss %)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500">
              <th className="text-left py-2 pr-4 font-medium">Facility</th>
              <th className="text-center py-2 px-2 font-medium">Week 1</th>
              <th className="text-center py-2 px-2 font-medium">Week 2</th>
              <th className="text-center py-2 px-2 font-medium">Week 3</th>
              <th className="text-center py-2 px-2 font-medium">Week 4</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-700">{row.facility}</td>
                <td className="py-2 px-2">
                  <div className={`text-center py-1 px-2 rounded font-mono ${getColor(row.week1)}`}>{row.week1}%</div>
                </td>
                <td className="py-2 px-2">
                  <div className={`text-center py-1 px-2 rounded font-mono ${getColor(row.week2)}`}>{row.week2}%</div>
                </td>
                <td className="py-2 px-2">
                  <div className={`text-center py-1 px-2 rounded font-mono ${getColor(row.week3)}`}>{row.week3}%</div>
                </td>
                <td className="py-2 px-2">
                  <div className={`text-center py-1 px-2 rounded font-mono ${getColor(row.week4)}`}>{row.week4}%</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs">
        <span className="text-gray-500">Risk Scale:</span>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-emerald-100" /> Low</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-amber-200" /> Medium</div>
        <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-400" /> High</div>
      </div>
    </div>
  );
};

export default RiskMatrix;
