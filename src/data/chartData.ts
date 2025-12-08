export const pestTrendData = [
  { date: 'Week 1', weevils: 8, borers: 4, beetles: 3, moths: 2 },
  { date: 'Week 2', weevils: 12, borers: 6, beetles: 4, moths: 3 },
  { date: 'Week 3', weevils: 15, borers: 9, beetles: 5, moths: 4 },
  { date: 'Week 4', weevils: 22, borers: 12, beetles: 7, moths: 5 },
  { date: 'Week 5', weevils: 28, borers: 14, beetles: 8, moths: 6 },
  { date: 'Week 6', weevils: 18, borers: 10, beetles: 6, moths: 4 },
];

export const lossChartData = [
  { week: 'Week 1', loss: 450, cumulative: 450 },
  { week: 'Week 2', loss: 680, cumulative: 1130 },
  { week: 'Week 3', loss: 920, cumulative: 2050 },
  { week: 'Week 4', loss: 1340, cumulative: 3390 },
  { week: 'Week 5', loss: 1850, cumulative: 5240 },
  { week: 'Week 6', loss: 1420, cumulative: 6660 },
];

export const pestCompositionData = [
  { name: 'Rice Weevil', value: 35, color: '#dc2626' },
  { name: 'Grain Borer', value: 25, color: '#f59e0b' },
  { name: 'Flour Beetle', value: 18, color: '#3b82f6' },
  { name: 'Indian Meal Moth', value: 12, color: '#8b5cf6' },
  { name: 'Others', value: 10, color: '#6b7280' },
];

export const riskMatrixData = [
  { facility: 'Silo A-1', week1: 2.1, week2: 4.5, week3: 6.8, week4: 8.5 },
  { facility: 'Silo A-2', week1: 0.8, week2: 1.0, week3: 1.2, week4: 1.2 },
  { facility: 'Warehouse B', week1: 1.5, week2: 2.8, week3: 3.6, week4: 4.2 },
  { facility: 'Silo C-3', week1: 0.3, week2: 0.5, week3: 0.6, week4: 0.8 },
  { facility: 'Climate Store D', week1: 1.8, week2: 2.2, week3: 2.7, week4: 3.1 },
  { facility: 'Warehouse E', week1: 5.2, week2: 7.1, week3: 8.9, week4: 9.8 },
];

export const weeklyComparisonData = [
  { metric: 'Total Pest Count', current: 103, previous: 87, unit: '' },
  { metric: 'Average Loss %', current: 4.6, previous: 3.8, unit: '%' },
  { metric: 'Economic Loss', current: 12705, previous: 9840, unit: '$' },
  { metric: 'High Risk Lots', current: 2, previous: 1, unit: '' },
  { metric: 'Inspections Done', current: 18, previous: 15, unit: '' },
];
