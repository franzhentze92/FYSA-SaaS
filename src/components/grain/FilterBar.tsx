import React from 'react';
import { Filter, SortAsc } from 'lucide-react';
import { GRAIN_TYPES } from '@/types/grain';

interface FilterBarProps {
  riskFilter: string;
  grainFilter: string;
  sortBy: string;
  onRiskFilterChange: (value: string) => void;
  onGrainFilterChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  riskFilter, grainFilter, sortBy,
  onRiskFilterChange, onGrainFilterChange, onSortChange
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500">
        <Filter size={16} />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <select
        value={riskFilter}
        onChange={(e) => onRiskFilterChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-emerald-500"
      >
        <option value="all">All Risk Levels</option>
        <option value="high">High Risk</option>
        <option value="medium">Medium Risk</option>
        <option value="low">Low Risk</option>
      </select>

      <select
        value={grainFilter}
        onChange={(e) => onGrainFilterChange(e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-emerald-500"
      >
        <option value="all">All Grain Types</option>
        {GRAIN_TYPES.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <SortAsc size={16} className="text-gray-400" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-emerald-500"
        >
          <option value="risk">Sort by Risk</option>
          <option value="loss">Sort by Loss</option>
          <option value="date">Sort by Date</option>
          <option value="quantity">Sort by Quantity</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;
