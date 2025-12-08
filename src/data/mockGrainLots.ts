import { GrainLot } from '@/types/grain';

export const mockGrainLots: GrainLot[] = [
  {
    id: '1', grainType: 'Maíz', quantity: 150, unit: 'tonnes', pricePerTon: 280,
    startDate: '2025-10-15', facility: 'Silo A-1', riskLevel: 'high',
    estimatedLossPercent: 8.5, estimatedLossValue: 3570,
    inspections: [
      { id: 'i1', date: '2025-11-20', pestCounts: [{ pestType: 'Rice Weevil', alive: 12, dead: 3 }, { pestType: 'Grain Borer', alive: 8, dead: 2 }], temperature: 28, humidity: 72, sampleWeight: 1, notes: 'High activity near walls', photos: [] },
      { id: 'i2', date: '2025-11-27', pestCounts: [{ pestType: 'Rice Weevil', alive: 18, dead: 5 }, { pestType: 'Grain Borer', alive: 14, dead: 4 }], temperature: 29, humidity: 74, sampleWeight: 1, notes: 'Increasing infestation', photos: [] },
    ]
  },
  {
    id: '2', grainType: 'Trigo', quantity: 200, unit: 'tonnes', pricePerTon: 320,
    startDate: '2025-09-01', facility: 'Warehouse B', riskLevel: 'medium',
    estimatedLossPercent: 4.2, estimatedLossValue: 2688,
    inspections: [
      { id: 'i3', date: '2025-11-25', pestCounts: [{ pestType: 'Flour Beetle', alive: 6, dead: 2 }, { pestType: 'Indian Meal Moth', alive: 4, dead: 1 }], temperature: 25, humidity: 58, sampleWeight: 1, notes: 'Stable conditions', photos: [] },
    ]
  },
  {
    id: '3', grainType: 'Arroz', quantity: 80, unit: 'tonnes', pricePerTon: 450,
    startDate: '2025-11-01', facility: 'Silo C-3', riskLevel: 'low',
    estimatedLossPercent: 0.8, estimatedLossValue: 288,
    inspections: [
      { id: 'i4', date: '2025-11-28', pestCounts: [{ pestType: 'Rice Weevil', alive: 2, dead: 1 }], temperature: 22, humidity: 52, sampleWeight: 1, notes: 'Good condition', photos: [] },
    ]
  },
  {
    id: '4', grainType: 'Café', quantity: 25, unit: 'tonnes', pricePerTon: 4200,
    startDate: '2025-08-20', facility: 'Climate Store D', riskLevel: 'medium',
    estimatedLossPercent: 3.1, estimatedLossValue: 3255,
    inspections: []
  },
  {
    id: '5', grainType: 'Sorgo', quantity: 120, unit: 'tonnes', pricePerTon: 240,
    startDate: '2025-10-01', facility: 'Silo A-2', riskLevel: 'low',
    estimatedLossPercent: 1.2, estimatedLossValue: 346,
    inspections: []
  },
  {
    id: '6', grainType: 'Cebada', quantity: 90, unit: 'tonnes', pricePerTon: 290,
    startDate: '2025-09-15', facility: 'Warehouse E', riskLevel: 'high',
    estimatedLossPercent: 9.8, estimatedLossValue: 2558,
    inspections: []
  },
];
