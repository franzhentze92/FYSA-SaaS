// Types for Monitoreo de Granos AP (Grain Monitoring)

export interface MuestreoGrano {
  id: string;
  
  // Report metadata
  numeroReporte: string;
  fechaReporte: string;
  fechaServicio?: string; // Service date (can be extracted from PDF or added manually)
  
  // Client info
  cliente: string;
  
  // Samples (rows from the table)
  muestras: MuestraGrano[];
  
  // Summary stats
  totalMuestras: number;
  totalInsectos: number;
  nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'critico';
  
  // File reference
  archivoPdf?: {
    nombre: string;
    url: string;
  };
  
  // Audit
  creadoPor?: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// Individual sample row from the table
export interface MuestraGrano {
  id: string;
  
  // Location
  silo: string;              // AP-07, AP-08, etc.
  muestra: string;           // Arriba, Abajo (Top/Bottom sample position)
  
  // Origin
  barco: string;             // Ship name: IVS KNOT, Ultra incahuasi, etc.
  tipoGrano: string;         // Malta, Cprs, Srw, etc.
  
  // Storage
  fechaAlmacenamiento: string;  // 06Apr2024
  diasAlmacenamiento: number;   // Days in storage
  
  // Pest counts - each has vivos (alive) and muertos (dead)
  piojilloAcaro: number;     // Piojillo/Ácaro
  
  tribVivos: number;         // Tribolium vivos
  tribMuertos: number;       // Tribolium muertos
  
  rhyzVivos: number;         // Rhyzopertha vivos
  rhyzMuertos: number;       // Rhyzopertha muertos
  
  chryVivos: number;         // Cryptolestes vivos
  chryMuertos: number;       // Cryptolestes muertos
  
  sitoVivos: number;         // Sitophilus vivos
  sitoMuertos: number;       // Sitophilus muertos
  
  stegVivos: number;         // Stegobium vivos
  stegMuertos: number;       // Stegobium muertos
  
  // Observations (weight/quantity)
  observaciones: number;     // 1484.030, 2390.680, etc.
  
  // Calculated totals
  totalInsectosVivos: number;
  totalInsectosMuertos: number;
  
  // Ácido Úrico (calculated per silo)
  acidoUrico?: number;       // mg/100g - calculated from gorgojos vivos per silo
  
  // Damage calculations (calculated per silo)
  danoGorgojosAdultosKg?: number;    // [Gorgojos Vivos] * (tons * 1000) * 0.000001 * 7
  danoGorgojosTotalKg?: number;       // [Daño Gorgojos Adultos Kg] * 6
  danoPiojilloKg?: number;           // [Piojillo/Ácaro] * (tons * 1000) * 0.00000033 * 7
  danoTotalPlagaKg?: number;         // [Daño Gorgojos Total Kg] + [Daño Piojillo]
  perdidaEconomicaSemanal?: number;  // [Daño Total Plaga Kg] * (grain type cost)
}

// For PDF parsing results
export interface ParsedPdfData {
  rawText: string;
  extractedData: {
    numeroReporte?: string;
    cliente?: string;
    fechaReporte?: string;
    fechaServicio?: string; // Service date extracted from PDF
    muestras: MuestraGrano[];
  };
  confidence: number; // 0-100
  warnings: string[];
}

// For display grouping by silo
export interface SiloGroup {
  silo: string;
  muestras: MuestraGrano[];
  totalInsectos: number;
}

// Historial de pérdidas por batch de grano (registro semanal)
// Rastrea las pérdidas desde que el batch llegó en el barco hasta hoy
export interface HistorialPerdidaSilo {
  id: string;
  muestreoId: string;
  batchId?: string | null; // ID del batch de grano (puede ser null si no se encontró match)
  silo: string; // Silo donde se tomó la muestra (para referencia)
  fechaSemana: string;
  tipoGrano?: string;
  totalGorgojosVivos: number;
  totalPiojillo: number;
  totalTons: number;
  acidoUrico: number;
  danoGorgojosAdultosKg: number;
  danoGorgojosTotalKg: number;
  danoPiojilloKg: number;
  danoTotalPlagaKg: number;
  perdidaEconomicaSemanal: number;
  createdAt: string;
  updatedAt: string;
}