export interface PestCount {
  pestType: string;
  alive: number;
  dead: number;
}

export interface Inspection {
  id: string;
  date: string;
  pestCounts: PestCount[];
  temperature: number;
  humidity: number;
  sampleWeight: number;
  notes: string;
  photos: string[];
}

export interface GrainLot {
  id: string;
  grainType: string;
  quantity: number;
  unit: 'kg' | 'tonnes';
  pricePerTon: number;
  startDate: string;
  facility: string;
  riskLevel: 'low' | 'medium' | 'high';
  inspections: Inspection[];
  estimatedLossPercent: number;
  estimatedLossValue: number;
}

export interface PestType {
  id: string;
  name: string;
  damageCoefficient: number;
  image: string;
}

export const GRAIN_TYPES = [
  'Maíz', 'Trigo', 'Arroz', 'Cebada', 'Sorgo', 'Mijo',
  'Avena', 'Centeno', 'Café', 'Cacao', 'Soya', 'Garbanzo', 'Malta', 'Grano de destilería'
];

// Plagas reales comunes en granos almacenados en Guatemala y Centroamérica
export const PEST_TYPES: PestType[] = [
  { id: '1', name: 'Gorgojo del arroz (Sitophilus oryzae)', damageCoefficient: 0.08, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775038041_4cdb48dc.webp' },
  { id: '2', name: 'Gorgojo del maíz (Sitophilus zeamais)', damageCoefficient: 0.09, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775044083_21d4b23a.webp' },
  { id: '3', name: 'Gorgojo del trigo (Sitophilus granarius)', damageCoefficient: 0.08, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775038041_4cdb48dc.webp' },
  { id: '4', name: 'Taladrador menor del grano (Rhyzopertha dominica)', damageCoefficient: 0.12, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775040004_3c59f374.webp' },
  { id: '5', name: 'Gorgojo castaño de la harina (Tribolium castaneum)', damageCoefficient: 0.06, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775042104_056f4e05.webp' },
  { id: '6', name: 'Escarabajo confuso de la harina (Tribolium confusum)', damageCoefficient: 0.06, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775042104_056f4e05.webp' },
  { id: '7', name: 'Polilla de los cereales (Sitotroga cerealella)', damageCoefficient: 0.04, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775040004_3c59f374.webp' },
  { id: '8', name: 'Polilla india de la harina (Plodia interpunctella)', damageCoefficient: 0.05, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775044083_21d4b23a.webp' },
  { id: '9', name: 'Carcoma achatada de los granos (Cryptolestes ferrugineus)', damageCoefficient: 0.07, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775042104_056f4e05.webp' },
  { id: '10', name: 'Gorgojo del frijol (Acanthoscelides obtectus)', damageCoefficient: 0.10, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775038041_4cdb48dc.webp' },
  { id: '11', name: 'Barrenador grande del grano (Prostephanus truncatus)', damageCoefficient: 0.15, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775040004_3c59f374.webp' },
  { id: '12', name: 'Polilla mediterránea de la harina (Ephestia kuehniella)', damageCoefficient: 0.05, image: 'https://d64gsuwffb70l.cloudfront.net/693054156b56bb5eac8b43de_1764775044083_21d4b23a.webp' },
];

export const GRAIN_SENSITIVITY: Record<string, number> = {
  'Maíz': 1.2, 'Trigo': 1.0, 'Arroz': 1.1, 'Cebada': 0.9,
  'Sorgo': 0.8, 'Mijo': 0.85, 'Avena': 0.9, 'Centeno': 0.95,
  'Café': 1.3, 'Cacao': 1.4, 'Soya': 1.0, 'Garbanzo': 0.95, 'Malta': 0.9, 'Grano de destilería': 1.0
};

// Tipos para Silos y Batches
export interface MovimientoSilo {
  fecha: string;
  siloOrigen: number;
  siloDestino: number;
  cantidad: number; // Cantidad traspasada en la unidad del batch
  notas?: string;
}

export interface ActualizacionCantidad {
  fecha: string;
  cantidadAnterior: number;
  cantidadNueva: number;
  cantidadCambio: number; // Positivo = aumento, Negativo = disminución (despacho)
  unit: 'kg' | 'tonnes';
  siloNumero: number;
  notas?: string;
}

export interface GrainBatch {
  id: string; // ID único del batch para trazabilidad
  entryDate: string;
  quantity: number;
  unit: 'kg' | 'tonnes';
  barcoId: string; // ID del barco del que proviene el grano
  granoId: string; // ID del grano específico del barco
  grainType: string;
  variedadId?: string; // ID de la variedad seleccionada (opcional)
  grainSubtype?: string; // Nombre de la variedad (se obtiene de la variedad si existe)
  origin: string; // Nombre del barco (se obtiene automáticamente)
  siloActual: number; // Número del silo donde está actualmente
  historialMovimientos?: MovimientoSilo[]; // Historial de traspasos entre silos
  historialActualizaciones?: ActualizacionCantidad[]; // Historial de cambios de cantidad (despachos, ajustes)
  notes?: string;
}

export interface Silo {
  id: string;
  number: number; // Número del silo
  nombre?: string; // Nombre del silo (opcional)
  capacity: number; // Capacidad máxima en toneladas
  batches: GrainBatch[];
  isActive: boolean;
  clienteEmail?: string; // Email del cliente al que está asignado el silo
}

// Tipo para Fumigaciones de Silos
export interface FumigacionSilo {
  id: string;
  silo: string;              // AP-01, AP-02, etc.
  tipoGrano: string;         // Tipo de grano fumigado
  batchId?: string | null;   // ID del batch de grano al que se aplicó la fumigación
  servicioId?: number | null; // ID del servicio asociado
  fechaFumigacion: string;   // Fecha en que se realizó la fumigación
  productoUtilizado?: string; // Nombre del producto fumigante
  dosis?: string;            // Dosis aplicada
  unidadMedida?: string;     // Unidad de medida de la dosis
  tecnico?: string;          // Nombre del técnico que realizó la fumigación
  notas?: string;            // Notas adicionales
  createdAt: string;
  updatedAt: string;
}

// Tipos para Barcos
export interface InsectSample {
  pestType: string;
  count: number;
}

export interface GranoCarga {
  id: string; // ID único del grano en esta carga
  tipoGrano: string;
  variedadId?: string; // ID de la variedad (opcional)
  cantidad: number; // En toneladas
}

export interface Barco {
  id: string;
  barcoId: string; // ID del barco del catálogo
  fechaFondeo: string; // Fecha de fondeo
  granos: GranoCarga[]; // Array de tipos de grano con sus cantidades
  muestreoInsectos: InsectSample[]; // Número y tipo de insectos encontrados
  requiereTratamientoOIRSA: boolean; // Si se requirió tratamiento cuarentenario
  clienteEmail?: string; // Email del cliente al que está asignado el registro de fondeo
  notas?: string; // Notas adicionales
}

// Catálogos/Maestros
export interface BarcoMaestro {
  id: string;
  nombre: string; // Nombre del barco
  activo: boolean;
  clienteEmail?: string; // Email del cliente al que está asignado el barco
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface VariedadGrano {
  id: string;
  tipoGrano: string; // Tipo base (Wheat, Maize, etc.)
  variedad: string; // Variedad específica (HWED, Premium, etc.)
  activo: boolean;
  costoPorKg?: number; // Cost per kilogram in Quetzales (Q.) for economic loss calculation
}
