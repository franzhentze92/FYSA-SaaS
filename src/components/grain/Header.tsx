import React from 'react';
import { Bug, Bell, FileText, Settings, Search } from 'lucide-react';

interface HeaderProps {
  alertCount: number;
  onGenerateReport: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({ alertCount, onGenerateReport, searchQuery, onSearchChange }) => {
  return (
    <header className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Bug size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">NTS G.R.O.W</h1>
              <p className="text-xs text-slate-400">Pest Monitoring & Loss Model</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search grain lots, facilities..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGenerateReport}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
            >
              <FileText size={16} />
              Export Report
            </button>
            <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Bell size={20} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {alertCount}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
