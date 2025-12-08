import { GrainLot, Inspection, GRAIN_SENSITIVITY, PEST_TYPES } from '@/types/grain';

export function calculateDaysStored(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function calculateDamageIndex(inspection: Inspection): number {
  let index = 0;
  inspection.pestCounts.forEach(pc => {
    const pest = PEST_TYPES.find(p => p.name === pc.pestType);
    if (pest) {
      index += (pc.alive * pest.damageCoefficient * 1.5) + (pc.dead * pest.damageCoefficient * 0.3);
    }
  });
  return Math.min(index / inspection.sampleWeight * 100, 100);
}

export function calculateEconomicLoss(lot: GrainLot): { lossPercent: number; lossValue: number } {
  const daysStored = calculateDaysStored(lot.startDate);
  const sensitivity = GRAIN_SENSITIVITY[lot.grainType] || 1.0;
  
  if (lot.inspections.length === 0) {
    return { lossPercent: 0, lossValue: 0 };
  }

  const latestInspection = lot.inspections[lot.inspections.length - 1];
  let totalPestDamage = 0;
  
  latestInspection.pestCounts.forEach(pc => {
    const pest = PEST_TYPES.find(p => p.name === pc.pestType);
    if (pest) {
      totalPestDamage += (pc.alive * pest.damageCoefficient) + (pc.dead * pest.damageCoefficient * 0.2);
    }
  });

  const lossPercent = Math.min(
    (totalPestDamage * daysStored * sensitivity) / 100,
    35
  );

  const tonnage = lot.unit === 'tonnes' ? lot.quantity : lot.quantity / 1000;
  const lossValue = (lossPercent / 100) * tonnage * lot.pricePerTon;

  return { lossPercent: Math.round(lossPercent * 100) / 100, lossValue: Math.round(lossValue * 100) / 100 };
}

export function getRiskLevel(lossPercent: number): 'low' | 'medium' | 'high' {
  if (lossPercent < 2) return 'low';
  if (lossPercent < 8) return 'medium';
  return 'high';
}

export function getRecommendation(riskLevel: 'low' | 'medium' | 'high', humidity: number): string {
  if (riskLevel === 'high') return 'Immediate fumigation recommended';
  if (riskLevel === 'medium') return humidity > 65 ? 'Increase aeration and consider fumigation' : 'Monitor closely, consider screening';
  return 'Continue routine monitoring';
}
