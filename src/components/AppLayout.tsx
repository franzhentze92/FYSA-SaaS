import React, { useState } from 'react';
import { useGrainLots } from '@/hooks/useGrainLots';
import Header from './grain/Header';
import HeroSection from './grain/HeroSection';
import AlertBanner from './grain/AlertBanner';
import FilterBar from './grain/FilterBar';
import GrainLotCard from './grain/GrainLotCard';
import StatsCard from './grain/StatsCard';
import InspectionModal from './grain/InspectionModal';
import CreateLotModal from './grain/CreateLotModal';
import LotDetailsModal from './grain/LotDetailsModal';
import ReportModal from './grain/ReportModal';
import ChartsSection from './grain/ChartsSection';
import Footer from './grain/Footer';
import { GrainLot } from '@/types/grain';
import { Package, AlertTriangle, DollarSign, Activity } from 'lucide-react';

const AppLayout: React.FC = () => {
  const { lots, filteredLots, addLot, addInspection, riskFilter, setRiskFilter, grainFilter, setGrainFilter, sortBy, setSortBy, searchQuery, setSearchQuery, totalLoss, totalValue, highRiskCount } = useGrainLots();
  
  const [selectedLot, setSelectedLot] = useState<GrainLot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alerts, setAlerts] = useState([
    { id: '1', message: 'High infestation detected in Silo A-1', facility: 'Maize - 150 tonnes', action: 'View Details' },
    { id: '2', message: 'Fumigation overdue for Warehouse E', facility: 'Barley - 90 tonnes', action: 'Schedule' },
  ]);

  const handleViewDetails = (lot: GrainLot) => { setSelectedLot(lot); setShowDetailsModal(true); };
  const handleAddInspection = (lot: GrainLot) => { setSelectedLot(lot); setShowInspectionModal(true); };
  const dismissAlert = (id: string) => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header alertCount={alerts.length} onGenerateReport={() => setShowReportModal(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <HeroSection onCreateLot={() => setShowCreateModal(true)} totalLots={lots.length} totalValue={totalValue} totalLoss={totalLoss} />
        
        {alerts.length > 0 && <AlertBanner alerts={alerts} onDismiss={dismissAlert} onTakeAction={(id) => { const a = alerts.find(x => x.id === id); if (a) dismissAlert(id); }} />}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Lots" value={lots.length} icon={<Package size={20} />} subtitle="Currently monitored" />
          <StatsCard title="High Risk" value={highRiskCount} icon={<AlertTriangle size={20} />} variant="danger" trend="up" trendValue="+1 this week" />
          <StatsCard title="Total Loss" value={`$${totalLoss.toLocaleString()}`} icon={<DollarSign size={20} />} variant="warning" trend="up" trendValue="+12% vs last week" />
          <StatsCard title="Avg Damage Index" value="4.6%" icon={<Activity size={20} />} subtitle="Across all lots" />
        </div>

        <FilterBar riskFilter={riskFilter} grainFilter={grainFilter} sortBy={sortBy} onRiskFilterChange={setRiskFilter} onGrainFilterChange={setGrainFilter} onSortChange={setSortBy} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLots.map(lot => <GrainLotCard key={lot.id} lot={lot} onViewDetails={handleViewDetails} onAddInspection={handleAddInspection} />)}
        </div>

        <ChartsSection />
      </main>

      <Footer />

      <CreateLotModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={addLot} />
      {selectedLot && <InspectionModal lot={selectedLot} isOpen={showInspectionModal} onClose={() => setShowInspectionModal(false)} onSubmit={(data) => addInspection(selectedLot.id, data)} />}
      <LotDetailsModal lot={selectedLot} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      <ReportModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} lots={lots} totalLoss={totalLoss} />
    </div>
  );
};

export default AppLayout;
