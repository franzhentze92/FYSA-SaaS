import { useState, useMemo } from 'react';
import { GrainLot, PestCount } from '@/types/grain';
import { mockGrainLots } from '@/data/mockGrainLots';
import { calculateEconomicLoss, getRiskLevel } from '@/utils/lossCalculator';
import { v4 as uuidv4 } from 'uuid';

export function useGrainLots() {
  const [lots, setLots] = useState<GrainLot[]>(mockGrainLots);
  const [riskFilter, setRiskFilter] = useState('all');
  const [grainFilter, setGrainFilter] = useState('all');
  const [sortBy, setSortBy] = useState('risk');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLots = useMemo(() => {
    let result = [...lots];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.grainType.toLowerCase().includes(q) || 
        l.facility.toLowerCase().includes(q)
      );
    }

    if (riskFilter !== 'all') {
      result = result.filter(l => l.riskLevel === riskFilter);
    }

    if (grainFilter !== 'all') {
      result = result.filter(l => l.grainType === grainFilter);
    }

    const riskOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => {
      switch (sortBy) {
        case 'risk': return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        case 'loss': return b.estimatedLossValue - a.estimatedLossValue;
        case 'date': return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'quantity': return b.quantity - a.quantity;
        default: return 0;
      }
    });

    return result;
  }, [lots, riskFilter, grainFilter, sortBy, searchQuery]);

  const addLot = (data: Omit<GrainLot, 'id' | 'inspections' | 'riskLevel' | 'estimatedLossPercent' | 'estimatedLossValue'>) => {
    const newLot: GrainLot = {
      ...data, id: uuidv4(), inspections: [], riskLevel: 'low', estimatedLossPercent: 0, estimatedLossValue: 0
    };
    setLots(prev => [...prev, newLot]);
  };

  const addInspection = (lotId: string, data: { pestCounts: PestCount[]; temperature: number; humidity: number; sampleWeight: number; notes: string }) => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== lotId) return lot;
      const newInspection = { id: uuidv4(), date: new Date().toISOString().split('T')[0], ...data, photos: [] };
      const updatedLot = { ...lot, inspections: [...lot.inspections, newInspection] };
      const { lossPercent, lossValue } = calculateEconomicLoss(updatedLot);
      return { ...updatedLot, estimatedLossPercent: lossPercent, estimatedLossValue: lossValue, riskLevel: getRiskLevel(lossPercent) };
    }));
  };

  const totalLoss = lots.reduce((sum, l) => sum + l.estimatedLossValue, 0);
  const totalValue = lots.reduce((sum, l) => sum + (l.unit === 'tonnes' ? l.quantity : l.quantity / 1000) * l.pricePerTon, 0);
  const highRiskCount = lots.filter(l => l.riskLevel === 'high').length;

  return { lots, filteredLots, addLot, addInspection, riskFilter, setRiskFilter, grainFilter, setGrainFilter, sortBy, setSortBy, searchQuery, setSearchQuery, totalLoss, totalValue, highRiskCount };
}
