import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileUp,
  X,
  Save,
  Bug,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Info,
} from 'lucide-react';
import { useMonitoreoGranos } from '@/hooks/useMonitoreoGranos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { useSilos } from '@/hooks/useSilos';
import { MuestreoGrano, MuestraGrano, ParsedPdfData } from '@/types/monitoreoGranos';
import { GRAIN_TYPES } from '@/types/grain';
import { format, getMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const RISK_COLORS = {
  bajo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  medio: 'bg-amber-100 text-amber-800 border-amber-200',
  alto: 'bg-orange-100 text-orange-800 border-orange-200',
  critico: 'bg-red-100 text-red-800 border-red-200',
};

const RISK_LABELS = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  critico: 'Crítico',
};

const AdminMonitoreoGranosAP: React.FC = () => {
  const { muestreos, loading, parsing, parsePdf, saveMuestreo, deleteMuestreo } = useMonitoreoGranos();
  const { variedadesGrano, getVariedadesActivas, barcosMaestros, getBarcosActivos } = useCatalogos();
  const { clientes } = useAdminServicios();
  const { silos } = useSilos();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user
  const currentUser = useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);

  const userEmail = currentUser?.email || '';
  const isAdmin = currentUser?.role === 'admin';

  // Get all unique grain varieties for dropdown (active only)
  const grainVarieties = useMemo(() => {
    const activeVarieties = getVariedadesActivas();
    
    // Get all grain types that have varieties defined
    const grainTypesWithVarieties = new Set(activeVarieties.map(v => v.tipoGrano));
    
    // Create list with varieties (format: "variedad - tipoGrano") - ONLY for grain types that have varieties
    const varietyList = activeVarieties.map(v => `${v.variedad} - ${v.tipoGrano}`);
    
    // Add grain types WITHOUT varieties (just the grain type name) - these don't have varieties defined
    const grainTypesWithoutVarieties = GRAIN_TYPES.filter(
      tipo => !grainTypesWithVarieties.has(tipo)
    );
    
    // Combine both lists
    const allOptions = [...varietyList, ...grainTypesWithoutVarieties];
    
    // Create a map for matching
    const matchMap = new Map<string, string>();
    
    // Map varieties (for grain types that have varieties)
    activeVarieties.forEach(v => {
      const displayFormat = `${v.variedad} - ${v.tipoGrano}`;
      matchMap.set(v.variedad.toLowerCase(), displayFormat);
      // Also map the old format and new format to the display format
      matchMap.set(`${v.tipoGrano} - ${v.variedad}`.toLowerCase(), displayFormat);
      matchMap.set(displayFormat.toLowerCase(), displayFormat);
      // Also map just the tipoGrano to the display format if it has varieties
      matchMap.set(v.tipoGrano.toLowerCase(), displayFormat);
    });
    
    // Map grain types without varieties (just the grain type name)
    grainTypesWithoutVarieties.forEach(tipo => {
      matchMap.set(tipo.toLowerCase(), tipo);
    });
    
    return {
      displayList: Array.from(new Set(allOptions)).sort(),
      matchMap,
    };
  }, [variedadesGrano, getVariedadesActivas]);

  // Helper function to match extracted grain type to stored varieties
  const matchGrainType = useCallback((extractedTipo: string): string => {
    if (!extractedTipo) return '';
    
    const lowerExtracted = extractedTipo.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = grainVarieties.matchMap.get(lowerExtracted);
    if (exactMatch) return exactMatch;
    
    // Try partial match - check if extracted text matches any variedad
    for (const [key, value] of grainVarieties.matchMap.entries()) {
      if (key.includes(lowerExtracted) || lowerExtracted.includes(key)) {
        return value;
      }
    }
    
    // Try to find in display list
    const displayMatch = grainVarieties.displayList.find(variety => 
      variety.toLowerCase() === lowerExtracted ||
      variety.toLowerCase().includes(lowerExtracted) ||
      lowerExtracted.includes(variety.toLowerCase())
    );
    
    return displayMatch || extractedTipo; // Use matched variety or keep original
  }, [grainVarieties]);

  // Helper function to match extracted client name to dropdown options
  const matchClientName = useCallback((extractedCliente: string): string => {
    if (!extractedCliente || clientes.length === 0) return extractedCliente;
    
    const lowerExtracted = extractedCliente.toLowerCase().trim();
    
    // Try exact match by name
    const exactMatch = clientes.find(c => 
      c.nombre.toLowerCase() === lowerExtracted ||
      c.email.toLowerCase() === lowerExtracted
    );
    if (exactMatch) return exactMatch.nombre;
    
    // Try partial match
    const partialMatch = clientes.find(c => 
      c.nombre.toLowerCase().includes(lowerExtracted) ||
      lowerExtracted.includes(c.nombre.toLowerCase()) ||
      c.email.toLowerCase().includes(lowerExtracted) ||
      lowerExtracted.includes(c.email.toLowerCase())
    );
    if (partialMatch) return partialMatch.nombre;
    
    return extractedCliente; // Return original if no match
  }, [clientes]);

  // Get all grain batches and create mapping from ship names to grain types
  const shipToGrainTypesMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    
    // Collect all batches from all silos
    silos.forEach(silo => {
      silo.batches.forEach(batch => {
        if (batch.origin) {
          const shipName = batch.origin.trim();
          if (!map.has(shipName)) {
            map.set(shipName, new Set());
          }
          // Add grain type to the set for this ship
          if (batch.grainType) {
            map.get(shipName)!.add(batch.grainType);
          }
          // Also add grain subtype if it exists (variedad - tipoGrano format)
          if (batch.grainSubtype) {
            map.get(shipName)!.add(batch.grainSubtype);
          }
        }
      });
    });
    
    return map;
  }, [silos]);

  // Get available ships for dropdown (only ships that have grain batches registered)
  const availableShips = useMemo(() => {
    const activeShips = getBarcosActivos();
    const shipsWithBatches = Array.from(shipToGrainTypesMap.keys());
    
    // Filter to only show ships that have grain batches
    return activeShips
      .filter(barco => shipsWithBatches.includes(barco.nombre))
      .map(barco => barco.nombre)
      .sort();
  }, [barcosMaestros, getBarcosActivos, shipToGrainTypesMap]);

  // Get grain types for a specific ship
  const getGrainTypesForShip = useCallback((shipName: string): string[] => {
    if (!shipName) return grainVarieties.displayList;
    
    const grainTypesForShip = shipToGrainTypesMap.get(shipName.trim());
    if (!grainTypesForShip || grainTypesForShip.size === 0) {
      return grainVarieties.displayList; // Return all if no batches found
    }
    
    // Filter grain varieties to only show those registered for this ship
    const availableGrainTypes = Array.from(grainTypesForShip);
    return grainVarieties.displayList.filter(variety => {
      // Check if the variety matches any of the grain types for this ship
      return availableGrainTypes.some(grainType => {
        const lowerVariety = variety.toLowerCase();
        const lowerGrainType = grainType.toLowerCase();
        // Match if variety contains grain type or vice versa
        return lowerVariety.includes(lowerGrainType) || 
               lowerGrainType.includes(lowerVariety) ||
               // Also check if it's a "variedad - tipoGrano" format
               lowerVariety.endsWith(` - ${lowerGrainType}`) ||
               lowerVariety.startsWith(`${lowerGrainType} -`);
      });
    });
  }, [grainVarieties, shipToGrainTypesMap]);

  // Get ship name, grain type, and entry date from grain batches for a specific silo
  const getShipAndGrainTypeFromSilo = useCallback((siloIdentifier: string): { ship: string; grainType: string; entryDate: string } => {
    if (!siloIdentifier) return { ship: '', grainType: '', entryDate: '' };
    
    // Extract silo number from identifier (e.g., "AP-01" -> 1, "AP-07" -> 7)
    const siloNumberMatch = siloIdentifier.match(/(\d+)/);
    if (!siloNumberMatch) return { ship: '', grainType: '', entryDate: '' };
    
    const siloNumber = parseInt(siloNumberMatch[1]);
    
    // Find silo with this number
    const silo = silos.find(s => s.number === siloNumber);
    if (!silo || silo.batches.length === 0) {
      return { ship: '', grainType: '', entryDate: '' };
    }
    
    // Get the most recent batch (by entry date) or the one with the most quantity
    const sortedBatches = [...silo.batches].sort((a, b) => {
      // First sort by entry date (most recent first)
      if (a.entryDate && b.entryDate) {
        const dateA = new Date(a.entryDate).getTime();
        const dateB = new Date(b.entryDate).getTime();
        if (dateB !== dateA) return dateB - dateA;
      }
      // If dates are equal or missing, sort by quantity (highest first)
      return b.quantity - a.quantity;
    });
    
    const batch = sortedBatches[0];
    if (!batch) return { ship: '', grainType: '', entryDate: '' };
    
    // Get ship name from origin
    const ship = batch.origin || '';
    
    // Get grain type - prefer grainSubtype if available (variedad - tipoGrano format), otherwise use grainType
    let grainType = '';
    if (batch.grainSubtype) {
      // Check if grainSubtype matches the display format
      const matchesDisplay = grainVarieties.displayList.find(v => 
        v.toLowerCase() === batch.grainSubtype!.toLowerCase()
      );
      grainType = matchesDisplay || batch.grainSubtype;
    } else if (batch.grainType) {
      // Try to match grainType to display format
      const matchesDisplay = grainVarieties.displayList.find(v => {
        const lowerV = v.toLowerCase();
        const lowerGT = batch.grainType!.toLowerCase();
        return lowerV.includes(lowerGT) || lowerGT.includes(lowerV) ||
               lowerV.endsWith(` - ${lowerGT}`) || lowerV.startsWith(`${lowerGT} -`);
      });
      grainType = matchesDisplay || batch.grainType;
    }
    
    // Get entry date from batch (this is the ship entrance date)
    const entryDate = batch.entryDate || '';
    
    return { ship, grainType, entryDate };
  }, [silos, grainVarieties]);

  // Helper function to match extracted ship name to dropdown options
  const matchShipName = useCallback((extractedBarco: string): string => {
    if (!extractedBarco || availableShips.length === 0) return extractedBarco;
    
    const lowerExtracted = extractedBarco.toLowerCase().trim();
    
    // Try exact match
    const exactMatch = availableShips.find(s => 
      s.toLowerCase() === lowerExtracted
    );
    if (exactMatch) return exactMatch;
    
    // Try partial match
    const partialMatch = availableShips.find(s => 
      s.toLowerCase().includes(lowerExtracted) ||
      lowerExtracted.includes(s.toLowerCase())
    );
    if (partialMatch) return partialMatch;
    
    return extractedBarco; // Return original if no match
  }, [availableShips]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedPdfData | null>(null);
  const [editedData, setEditedData] = useState<{
    numeroReporte: string;
    cliente: string;
    fechaServicio?: string;
    muestras: MuestraGrano[];
  }>({ numeroReporte: '', cliente: '', fechaServicio: '', muestras: [] });
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [originalArchivoPdf, setOriginalArchivoPdf] = useState<{ nombre: string; url: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  // Calculate Ácido Úrico from muestras
  const acidoUricoCalculado = useMemo(() => {
    if (!editedData.muestras || editedData.muestras.length === 0) return 0;

    // Group muestras by silo to calculate averages per silo first
    const siloGroups: Record<string, typeof editedData.muestras> = {};
    editedData.muestras.forEach(m => {
      const silo = m.silo || 'Sin silo';
      if (!siloGroups[silo]) siloGroups[silo] = [];
      siloGroups[silo].push(m);
    });

    let totalAcidoUrico = 0;

    Object.entries(siloGroups).forEach(([silo, muestras]) => {
      const numMuestras = muestras.length || 1;
      
      // Calculate average gorgojos vivos for this silo
      const avgGorgojosVivos = muestras.reduce((sum, m) => {
        return sum +
          (m.tribVivos || 0) +
          (m.rhyzVivos || 0) +
          (m.chryVivos || 0) +
          (m.sitoVivos || 0) +
          (m.stegVivos || 0);
      }, 0) / numMuestras;

      // Calculate maximum tons for this silo (use maximum, not average)
      const maxTons = Math.max(...muestras.map(m => m.observaciones || 0), 0);

      // Ácido Úrico: ((([Gorgojos Vivos]*0.1)+(([Gorgojos Vivos]*6)*0.1))*7)/10 * (tons/1000)
      // Now includes tons to make it proportional to grain quantity
      const acidoUricoSilo = (((avgGorgojosVivos * 0.1) + ((avgGorgojosVivos * 6) * 0.1)) * 7) / 10 * (maxTons / 1000);
      totalAcidoUrico += acidoUricoSilo;
    });

    return totalAcidoUrico;
  }, [editedData.muestras]);

  // Filter and group muestreos by month
  const groupedMuestreos = useMemo(() => {
    // First filter by user role - clients only see their own reports
    let filtered = muestreos;
    if (!isAdmin && userEmail) {
      // Find client by email to get their name
      const cliente = clientes.find(c => c.email.toLowerCase() === userEmail.toLowerCase());
      if (cliente) {
        filtered = muestreos.filter(m => 
          m.cliente?.toLowerCase() === cliente.nombre.toLowerCase() ||
          m.cliente?.toLowerCase() === cliente.email.toLowerCase()
        );
      } else {
        filtered = [];
      }
    }

    // Apply client filter
    if (selectedClient) {
      filtered = filtered.filter(m => 
        m.cliente?.toLowerCase() === selectedClient.toLowerCase()
      );
    }

    // Apply risk level filter
    if (selectedRiskLevel) {
      filtered = filtered.filter(m => m.nivelRiesgo === selectedRiskLevel);
    }

    // Apply month filter
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      filtered = filtered.filter(m => {
        if (!m.fechaServicio) return false;
        const date = new Date(m.fechaServicio);
        return getYear(date) === parseInt(year) && getMonth(date) === parseInt(month) - 1;
      });
    }

    // Apply search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.numeroReporte?.toLowerCase().includes(query) ||
        m.cliente?.toLowerCase().includes(query) ||
        m.muestras?.some(s => s.silo?.toLowerCase().includes(query) || s.barco?.toLowerCase().includes(query))
      );
    }

    // Group by month
    const grouped: Record<string, MuestreoGrano[]> = {};
    filtered.forEach(muestreo => {
      if (!muestreo.fechaServicio) {
        // Group reports without date under "Sin fecha"
        if (!grouped['sin-fecha']) {
          grouped['sin-fecha'] = [];
        }
        grouped['sin-fecha'].push(muestreo);
        return;
      }

      const date = new Date(muestreo.fechaServicio);
      const monthKey = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
      const monthLabel = format(date, 'MMMM yyyy', { locale: es });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(muestreo);
    });

    // Sort months descending (newest first)
    const sortedKeys = Object.keys(grouped).sort((a, b) => {
      if (a === 'sin-fecha') return 1;
      if (b === 'sin-fecha') return -1;
      return b.localeCompare(a);
    });

    // Sort reports within each month by date (newest first)
    sortedKeys.forEach(key => {
      grouped[key].sort((a, b) => {
        if (!a.fechaServicio) return 1;
        if (!b.fechaServicio) return -1;
        return new Date(b.fechaServicio).getTime() - new Date(a.fechaServicio).getTime();
      });
    });

    return { grouped, sortedKeys };
  }, [muestreos, searchQuery, selectedMonth, selectedClient, selectedRiskLevel, isAdmin, userEmail, clientes]);

  // Get available months for filter dropdown
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    muestreos.forEach(m => {
      if (m.fechaServicio) {
        const date = new Date(m.fechaServicio);
        const monthKey = `${getYear(date)}-${String(getMonth(date) + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [muestreos]);

  // Get available clients for filter dropdown
  const availableClients = useMemo(() => {
    const clients = new Set<string>();
    muestreos.forEach(m => {
      if (m.cliente) {
        clients.add(m.cliente);
      }
    });
    return Array.from(clients).sort();
  }, [muestreos]);

  // Auto-set client for client users when modal opens
  useEffect(() => {
    if (showUploadModal && !isAdmin && userEmail && clientes.length > 0) {
      const cliente = clientes.find(c => c.email.toLowerCase() === userEmail.toLowerCase());
      if (cliente && !editedData.cliente) {
        setEditedData(prev => ({ ...prev, cliente: cliente.nombre }));
      }
    }
  }, [showUploadModal, isAdmin, userEmail, clientes, editedData.cliente]);

  // Expand all months by default when data loads
  useEffect(() => {
    if (groupedMuestreos.sortedKeys.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set(groupedMuestreos.sortedKeys));
    }
  }, [groupedMuestreos.sortedKeys]);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor selecciona un archivo PDF');
      return;
    }

    setSelectedFile(file);
    setShowUploadModal(true);
    setParsedData(null);
    setEditedData({ numeroReporte: '', cliente: '', fechaServicio: '', muestras: [] });

    toast.loading('Analizando PDF...', { id: 'parsing' });
    const parsed = await parsePdf(file);
    toast.dismiss('parsing');

    setParsedData(parsed);
    
    // Get ship, grain type, and entry date from grain batches based on silo, not from PDF extraction
    const matchedMuestras = parsed.extractedData.muestras.map((muestra) => {
      // Get ship, grain type, and entry date from grain batches for this silo
      const { ship, grainType, entryDate } = getShipAndGrainTypeFromSilo(muestra.silo || '');
      
      return {
        ...muestra,
        // Use ship, grain type, and entry date from grain batches, not from PDF
        barco: ship || muestra.barco || '',
        tipoGrano: grainType || muestra.tipoGrano || '',
        // Use batch entry date as storage date (fecha de almacenamiento)
        fechaAlmacenamiento: entryDate || muestra.fechaAlmacenamiento || '',
      };
    });
    
    // Set fechaServicio to today's date if not provided in PDF, formatted as YYYY-MM-DD for date input
    const todayDate = new Date().toISOString().split('T')[0];
    
    setEditedData({
      numeroReporte: parsed.extractedData.numeroReporte || '',
      cliente: matchClientName(parsed.extractedData.cliente || ''),
      fechaServicio: parsed.extractedData.fechaServicio || todayDate,
      muestras: matchedMuestras,
    });

    if (parsed.confidence < 50) {
      toast.warning('Extracción con baja confianza. Verifica los datos.');
    } else {
      toast.success(`PDF analizado - ${parsed.extractedData.muestras?.length || 0} muestras encontradas`);
    }
  };


  // Add empty row
  const addEmptyRow = () => {
    const newMuestra: MuestraGrano = {
      id: uuidv4(),
      silo: '',
      muestra: 'Arriba',
      barco: '',
      tipoGrano: '',
      fechaAlmacenamiento: '',
      diasAlmacenamiento: 0,
      piojilloAcaro: 0,
      tribVivos: 0,
      tribMuertos: 0,
      rhyzVivos: 0,
      rhyzMuertos: 0,
      chryVivos: 0,
      chryMuertos: 0,
      sitoVivos: 0,
      sitoMuertos: 0,
      stegVivos: 0,
      stegMuertos: 0,
      observaciones: 0,
      totalInsectosVivos: 0,
      totalInsectosMuertos: 0,
    };
    setEditedData(prev => ({
      ...prev,
      muestras: [...prev.muestras, newMuestra],
    }));
  };

  // Update a sample row
  const updateMuestra = (index: number, field: keyof MuestraGrano, value: any) => {
    setEditedData(prev => {
      const newMuestras = [...prev.muestras];
      const currentMuestra = newMuestras[index];
      
      // If silo is being changed, auto-populate ship, grain type, and entry date from grain batches
      if (field === 'silo') {
        const { ship, grainType, entryDate } = getShipAndGrainTypeFromSilo(value);
        newMuestras[index] = {
          ...currentMuestra,
          silo: value,
          barco: ship, // Auto-populate ship from grain batches
          tipoGrano: grainType, // Auto-populate grain type from grain batches
          fechaAlmacenamiento: entryDate || currentMuestra.fechaAlmacenamiento || '', // Use batch entry date as storage date
          // Clear calculated values since batch/grain type may have changed
          acidoUrico: undefined,
          danoGorgojosAdultosKg: undefined,
          danoGorgojosTotalKg: undefined,
          danoPiojilloKg: undefined,
          danoTotalPlagaKg: undefined,
          perdidaEconomicaSemanal: undefined,
        };
      }
      // If ship is being changed, clear grain type if it's not valid for the new ship
      else if (field === 'barco') {
        const newShip = value;
        const currentGrainType = currentMuestra.tipoGrano;
        
        // If there's a current grain type, check if it's valid for the new ship
        if (currentGrainType && newShip) {
          const validGrainTypes = getGrainTypesForShip(newShip);
          const isValid = validGrainTypes.includes(currentGrainType);
          
          if (!isValid) {
            // Clear grain type if it's not valid for the new ship
            newMuestras[index] = { 
              ...currentMuestra, 
              barco: newShip, 
              tipoGrano: '',
              // Clear calculated values since grain type changed
              acidoUrico: undefined,
              danoGorgojosAdultosKg: undefined,
              danoGorgojosTotalKg: undefined,
              danoPiojilloKg: undefined,
              danoTotalPlagaKg: undefined,
              perdidaEconomicaSemanal: undefined,
            };
          } else {
            newMuestras[index] = { ...currentMuestra, [field]: value };
          }
        } else {
          newMuestras[index] = { ...currentMuestra, [field]: value };
        }
      } else {
        newMuestras[index] = { ...currentMuestra, [field]: value };
      }
      
      // If observaciones (tons) or any pest counts are changed, clear calculated values
      // so they will be recalculated when saving
      const fieldsThatAffectCalculations = [
        'observaciones', 'piojilloAcaro', 'tribVivos', 'tribMuertos',
        'rhyzVivos', 'rhyzMuertos', 'chryVivos', 'chryMuertos',
        'sitoVivos', 'sitoMuertos', 'stegVivos', 'stegMuertos',
        'tipoGrano' // Grain type affects economic loss calculation
      ];
      
      if (fieldsThatAffectCalculations.includes(field)) {
        // Clear calculated values so they will be recalculated when saving
        const m = newMuestras[index];
        m.acidoUrico = undefined;
        m.danoGorgojosAdultosKg = undefined;
        m.danoGorgojosTotalKg = undefined;
        m.danoPiojilloKg = undefined;
        m.danoTotalPlagaKg = undefined;
        m.perdidaEconomicaSemanal = undefined;
      }
      
      // Recalculate totals
      const m = newMuestras[index];
      m.totalInsectosVivos = (m.piojilloAcaro || 0) + (m.tribVivos || 0) + (m.rhyzVivos || 0) + 
                            (m.chryVivos || 0) + (m.sitoVivos || 0) + (m.stegVivos || 0);
      m.totalInsectosMuertos = (m.tribMuertos || 0) + (m.rhyzMuertos || 0) + 
                               (m.chryMuertos || 0) + (m.sitoMuertos || 0) + (m.stegMuertos || 0);
      
      return { ...prev, muestras: newMuestras };
    });
  };

  // Remove a sample row
  const removeMuestra = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      muestras: prev.muestras.filter((_, i) => i !== index),
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!editedData.cliente || !editedData.numeroReporte) {
      toast.error('Cliente y Número de Reporte son requeridos');
      return;
    }

    if (!editedData.muestras || editedData.muestras.length === 0) {
      toast.error('Debe agregar al menos una muestra al reporte');
      return;
    }

    // Validate that at least one muestra has some data
    const hasData = editedData.muestras.some(m => 
      m.silo || 
      m.barco || 
      m.tipoGrano || 
      (m.tribVivos && m.tribVivos > 0) ||
      (m.tribMuertos && m.tribMuertos > 0) ||
      (m.piojilloAcaro && m.piojilloAcaro > 0) ||
      (m.observaciones && m.observaciones > 0)
    );

    if (!hasData) {
      toast.error('Las muestras deben contener al menos algunos datos (silo, barco, tipo de grano, o conteos de insectos)');
      return;
    }

    setIsSaving(true);
    try {
      if (editingReportId) {
        // For editing: delete old report and create new one with updated data
        await deleteMuestreo(editingReportId);
        // If no new file is selected, preserve the original PDF
        const fileToSave = selectedFile || undefined;
        await saveMuestreo(editedData, fileToSave, originalArchivoPdf || undefined);
        toast.success('Reporte actualizado correctamente');
      } else {
        await saveMuestreo(editedData, selectedFile || undefined);
        toast.success('Reporte guardado correctamente');
      }
      closeModal();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el reporte');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle edit - load report data into modal
  const handleEdit = (muestreo: MuestreoGrano) => {
    setEditingReportId(muestreo.id);
    setEditedData({
      numeroReporte: muestreo.numeroReporte,
      cliente: muestreo.cliente,
      fechaServicio: muestreo.fechaServicio || '',
      muestras: muestreo.muestras || [],
    });
    // Preserve original PDF info
    setOriginalArchivoPdf(muestreo.archivoPdf || null);
    setSelectedFile(null);
    setParsedData(null);
    setShowUploadModal(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este reporte?')) return;

    const success = await deleteMuestreo(id);
    if (success) {
      toast.success('Reporte eliminado');
    } else {
      toast.error('Error al eliminar');
    }
  };

  // Toggle expanded report
  const toggleExpanded = (id: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle expanded month
  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  // Close modal
  const closeModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setParsedData(null);
    setEditingReportId(null);
    setOriginalArchivoPdf(null);
    setEditedData({ numeroReporte: '', cliente: '', fechaServicio: '', muestras: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText size={32} className="text-emerald-600" />
            {isAdmin ? 'Monitoreo de Granos AP' : 'Muestreo de Granos'}
          </h1>
          <p className="text-gray-600 mt-2">
            Importa reportes de muestreo desde PDF para extraer información de plagas por silo
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Month Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">Todos los meses</option>
                  {availableMonths.map(monthKey => {
                    const [year, month] = monthKey.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    return (
                      <option key={monthKey} value={monthKey}>
                        {format(date, 'MMMM yyyy', { locale: es })}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Client Filter */}
              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">Todos los clientes</option>
                    {availableClients.map(client => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Risk Level Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nivel de Riesgo</label>
                <select
                  value={selectedRiskLevel}
                  onChange={(e) => setSelectedRiskLevel(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                >
                  <option value="">Todos los niveles</option>
                  <option value="bajo">Bajo</option>
                  <option value="medio">Medio</option>
                  <option value="alto">Alto</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedMonth('');
                    setSelectedClient('');
                    setSelectedRiskLevel('');
                    setSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por número, cliente, silo, barco..."
                className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            {/* Import Options - Solo visible para admin */}
            {isAdmin && (
              <div className="flex flex-col md:flex-row gap-3">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={parsing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {parsing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                    Subir PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {(() => {
          // Get all filtered reports for stats
          const allFilteredReports = groupedMuestreos.sortedKeys.flatMap(key => groupedMuestreos.grouped[key]);
          return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Reportes</p>
                    <p className="text-2xl font-bold text-gray-900">{allFilteredReports.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Riesgo Bajo</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allFilteredReports.filter(m => m.nivelRiesgo === 'bajo').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Riesgo Medio/Alto</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allFilteredReports.filter(m => m.nivelRiesgo === 'medio' || m.nivelRiesgo === 'alto').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Bug className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Riesgo Crítico</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allFilteredReports.filter(m => m.nivelRiesgo === 'critico').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Reports List - Grouped by Month */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Loader2 size={48} className="mx-auto text-emerald-600 animate-spin mb-4" />
              <p className="text-gray-500">Cargando reportes...</p>
            </div>
          ) : groupedMuestreos.sortedKeys.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileUp size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">
                {muestreos.length === 0
                  ? 'No hay reportes. Sube un PDF para comenzar.'
                  : 'No se encontraron reportes con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            groupedMuestreos.sortedKeys.map((monthKey) => {
              const reports = groupedMuestreos.grouped[monthKey];
              const isExpanded = expandedMonths.has(monthKey);
              
              // Get month label
              let monthLabel = 'Sin fecha';
              if (monthKey !== 'sin-fecha') {
                const [year, month] = monthKey.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                monthLabel = format(date, 'MMMM yyyy', { locale: es });
                // Capitalize first letter
                monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
              }

              return (
                <div key={monthKey} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Month Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between border-b border-gray-200"
                    onClick={() => toggleMonth(monthKey)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-400" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{monthLabel}</h3>
                      <span className="text-sm text-gray-500">({reports.length} {reports.length === 1 ? 'reporte' : 'reportes'})</span>
                    </div>
                  </div>

                  {/* Reports for this month */}
                  {isExpanded && (
                    <div className="divide-y divide-gray-200">
                      {reports.map((muestreo) => (
                        <div key={muestreo.id} className="overflow-hidden">
                          {/* Report Header */}
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                            onClick={() => toggleExpanded(muestreo.id)}
                          >
                  <div className="flex items-center gap-4">
                    {expandedReports.has(muestreo.id) ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">#{muestreo.numeroReporte}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${RISK_COLORS[muestreo.nivelRiesgo]}`}>
                          {RISK_LABELS[muestreo.nivelRiesgo]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{muestreo.cliente}</p>
                      {muestreo.fechaServicio && (
                        <p className="text-xs text-gray-500">
                          Fecha de Servicio: {format(new Date(muestreo.fechaServicio), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {(() => {
                      // Calculate live and dead insects for this report
                      let totalLive = 0;
                      let totalDead = 0;
                      const uniqueSilos = new Set<string>();

                      // Group muestras by silo to calculate averages first
                      const siloGroups: Record<string, typeof muestreo.muestras> = {};
                      muestreo.muestras.forEach((muestra) => {
                        if (muestra.silo) {
                          if (!siloGroups[muestra.silo]) {
                            siloGroups[muestra.silo] = [];
                          }
                          siloGroups[muestra.silo].push(muestra);
                          uniqueSilos.add(muestra.silo);
                        }
                      });

                      // Calculate averages per silo, then sum for totals
                      let totalGorgojosVivos = 0;
                      let totalPiojillo = 0;
                      let totalTons = 0;

                      Object.entries(siloGroups).forEach(([silo, muestrasSilo]) => {
                        const numMuestras = muestrasSilo.length || 1;

                        // Calculate average gorgojos vivos for this silo
                        const avgGorgojosVivos = muestrasSilo.reduce((sum, m) => {
                          return sum +
                            (m.tribVivos || 0) +
                            (m.rhyzVivos || 0) +
                            (m.chryVivos || 0) +
                            (m.sitoVivos || 0) +
                            (m.stegVivos || 0);
                        }, 0) / numMuestras;

                        // Calculate average piojillo for this silo
                        const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;

                        // Calculate maximum tons for this silo (use maximum, not average)
                        const maxTons = Math.max(...muestrasSilo.map(m => m.observaciones || 0), 0);

                        // Add to totals (sum of averages per silo, but max tons)
                        totalGorgojosVivos += avgGorgojosVivos;
                        totalPiojillo += avgPiojillo;
                        totalTons += maxTons;
                      });

                      // Count live and dead insects (for display - use averages per silo, then sum)
                      Object.entries(siloGroups).forEach(([silo, muestrasSilo]) => {
                        const numMuestras = muestrasSilo.length || 1;
                        
                        // Calculate average live insects for this silo
                        const avgLive = muestrasSilo.reduce((sum, m) => {
                          return sum +
                            (m.piojilloAcaro || 0) +
                            (m.tribVivos || 0) +
                            (m.rhyzVivos || 0) +
                            (m.chryVivos || 0) +
                            (m.sitoVivos || 0) +
                            (m.stegVivos || 0);
                        }, 0) / numMuestras;
                        
                        // Calculate average dead insects for this silo
                        const avgDead = muestrasSilo.reduce((sum, m) => {
                          return sum +
                            (m.tribMuertos || 0) +
                            (m.rhyzMuertos || 0) +
                            (m.chryMuertos || 0) +
                            (m.sitoMuertos || 0) +
                            (m.stegMuertos || 0);
                        }, 0) / numMuestras;
                        
                        // Add averages to totals (round to nearest integer for display)
                        totalLive += Math.round(avgLive);
                        totalDead += Math.round(avgDead);
                      });

                      // Calculate total insects (Vivos + Muertos) for display
                      // This should match the sum of totalLive + totalDead (which use averages per silo)
                      const totalInsectosCalculado = totalLive + totalDead;
                      
                      // Calculate average insects per silo
                      const siloAverage = uniqueSilos.size > 0
                        ? (totalInsectosCalculado / uniqueSilos.size).toFixed(1)
                        : '0';

                      // Calculate Ácido Úrico - use saved values from muestras (same as damage calculations)
                      // All muestras in the same silo have the same acidoUrico value
                      let acidoUrico = 0;
                      const siloAcidoUrico = new Map<string, number>();
                      muestreo.muestras.forEach(m => {
                        if (m.silo && m.acidoUrico != null && !siloAcidoUrico.has(m.silo)) {
                          siloAcidoUrico.set(m.silo, m.acidoUrico);
                        }
                      });
                      acidoUrico = Array.from(siloAcidoUrico.values()).reduce((sum, val) => sum + val, 0);

                      // Calculate damage values - use saved values per silo if available, otherwise calculate
                      // All muestras in the same silo have the same damage values
                      let danoGorgojosAdultos = 0;
                      let danoGorgojosTotal = 0;
                      let danoPiojillo = 0;
                      let danoTotalPlaga = 0;

                      const siloDanoAdultos = new Map<string, number>();
                      const siloDanoTotal = new Map<string, number>();
                      const siloDanoPiojillo = new Map<string, number>();
                      const siloDanoTotalPlaga = new Map<string, number>();

                      muestreo.muestras.forEach(m => {
                        if (m.silo) {
                          // Get saved values from first muestra of each silo
                          if (!siloDanoAdultos.has(m.silo) && m.danoGorgojosAdultosKg != null) {
                            siloDanoAdultos.set(m.silo, m.danoGorgojosAdultosKg);
                          }
                          if (!siloDanoTotal.has(m.silo) && m.danoGorgojosTotalKg != null) {
                            siloDanoTotal.set(m.silo, m.danoGorgojosTotalKg);
                          }
                          if (!siloDanoPiojillo.has(m.silo) && m.danoPiojilloKg != null) {
                            siloDanoPiojillo.set(m.silo, m.danoPiojilloKg);
                          }
                          if (!siloDanoTotalPlaga.has(m.silo) && m.danoTotalPlagaKg != null) {
                            siloDanoTotalPlaga.set(m.silo, m.danoTotalPlagaKg);
                          }
                        }
                      });

                      // Sum saved values from all unique silos
                      danoGorgojosAdultos = Array.from(siloDanoAdultos.values()).reduce((sum, val) => sum + val, 0);
                      danoGorgojosTotal = Array.from(siloDanoTotal.values()).reduce((sum, val) => sum + val, 0);
                      danoPiojillo = Array.from(siloDanoPiojillo.values()).reduce((sum, val) => sum + val, 0);
                      danoTotalPlaga = Array.from(siloDanoTotalPlaga.values()).reduce((sum, val) => sum + val, 0);

                      // If no saved values, calculate from totals
                      if (danoGorgojosAdultos === 0 && totalGorgojosVivos > 0 && totalTons > 0) {
                        // Daño Gorgojos Adultos Kg = [Gorgojos Vivos] * (tons * 1000) * 0.000001 * 7
                        danoGorgojosAdultos = totalGorgojosVivos * (totalTons * 1000) * 0.000001 * 7;
                        // Daño Gorgojos Total Kg = [Daño Gorgojos Adultos Kg] * 6
                        danoGorgojosTotal = danoGorgojosAdultos * 6;
                        // Daño Piojillo = [Piojillo/Ácaro] * (tons * 1000) * 0.00000033 * 7
                        danoPiojillo = totalPiojillo * (totalTons * 1000) * 0.00000033 * 7;
                        // Daño Total Plaga Kg = [Daño Gorgojos Total Kg] + [Daño Piojillo]
                        danoTotalPlaga = danoGorgojosTotal + danoPiojillo;
                      }

                      // Pérdida Económica Semanal - sum from all unique silos
                      // All muestras in the same silo have the same perdidaEconomicaSemanal value
                      let perdidaEconomica = 0;
                      const siloPerdidas = new Map<string, number>();
                      muestreo.muestras.forEach(m => {
                        if (m.silo && m.perdidaEconomicaSemanal != null && !siloPerdidas.has(m.silo)) {
                          siloPerdidas.set(m.silo, m.perdidaEconomicaSemanal);
                        }
                      });
                      perdidaEconomica = Array.from(siloPerdidas.values()).reduce((sum, val) => sum + val, 0);

                      return (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Muestras</p>
                            <p className="text-lg font-bold text-gray-900">{muestreo.totalMuestras}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-lg font-bold text-gray-900">{totalInsectosCalculado}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-green-600">Vivos</p>
                            <p className="text-lg font-bold text-green-700">{totalLive}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-red-600">Muertos</p>
                            <p className="text-lg font-bold text-red-700">{totalDead}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Prom. Silo</p>
                            <p className="text-lg font-bold text-gray-900">{siloAverage}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-emerald-600">Ácido Úrico Semanal</p>
                            <p className="text-base font-bold text-emerald-700">{acidoUrico.toFixed(1)}</p>
                            <p className="text-xs text-gray-400">mg/100g</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-blue-600">Daño Gorgojos Adultos</p>
                            <p className="text-base font-bold text-blue-700">{danoGorgojosAdultos.toFixed(1)}</p>
                            <p className="text-xs text-gray-400">kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-purple-600">Daño Gorgojos Total</p>
                            <p className="text-base font-bold text-purple-700">{danoGorgojosTotal.toFixed(1)}</p>
                            <p className="text-xs text-gray-400">kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-amber-600">Daño Piojillo</p>
                            <p className="text-base font-bold text-amber-700">{danoPiojillo.toFixed(1)}</p>
                            <p className="text-xs text-gray-400">kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-red-600">Daño Total Plaga</p>
                            <p className="text-base font-bold text-red-700">{danoTotalPlaga.toFixed(1)}</p>
                            <p className="text-xs text-gray-400">kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-orange-600">Pérdida Económica</p>
                            <p className="text-base font-bold text-orange-700">Q. {perdidaEconomica.toFixed(0)}</p>
                            <p className="text-xs text-gray-400">Semanal</p>
                          </div>
                        </>
                      );
                    })()}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Botones de editar y eliminar - Solo visible para admin */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(muestreo)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Editar reporte"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(muestreo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      {/* Botones de ver y descargar PDF - Visible para todos */}
                      {muestreo.archivoPdf?.url && (
                        <>
                          <a
                            href={muestreo.archivoPdf.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver PDF"
                          >
                            <Eye size={18} />
                          </a>
                          <a
                            href={muestreo.archivoPdf.url}
                            download={muestreo.archivoPdf.nombre}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Descargar"
                          >
                            <Download size={18} />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Table */}
                {expandedReports.has(muestreo.id) && muestreo.muestras.length > 0 && (
                  <div className="border-t border-gray-200">
                    {/* Legend */}
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-700">
                        <span className="font-medium">Leyenda:</span>{' '}
                        <span className="text-gray-600">
                          Trib = Tribolium / Chry = Chryptolestes / Rhyz = Rhyzoperta / Sito = Sitophilus / Steg = Stegobium
                        </span>
                        {' • '}
                        <span className="text-gray-600">
                          V = Vivos (Alive) / M = Muertos (Dead)
                        </span>
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-orange-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Silo</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Muestra</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Barco</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Tipo</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Fecha Alm.</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Días</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Pioj.</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Trib V</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Trib M</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Rhyz V</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Rhyz M</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Chry V</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Chry M</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Sito V</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Sito M</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Steg V</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-700">Steg M</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-700">Tons</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(() => {
                          // Group muestras by silo
                          const siloGroups: Record<string, MuestraGrano[]> = {};
                          muestreo.muestras.forEach(m => {
                            const silo = m.silo || 'Sin silo';
                            if (!siloGroups[silo]) {
                              siloGroups[silo] = [];
                            }
                            siloGroups[silo].push(m);
                          });

                          // Sort silos
                          const sortedSilos = Object.keys(siloGroups).sort((a, b) => {
                            const numA = parseInt(a.replace(/\D/g, '')) || 0;
                            const numB = parseInt(b.replace(/\D/g, '')) || 0;
                            return numA - numB;
                          });

                          return sortedSilos.flatMap((silo, siloIdx) => {
                            const muestrasSilo = siloGroups[silo];
                            
                            // Use saved values if available (all samples in a silo have the same values)
                            // Otherwise calculate them
                            let acidoUricoSilo = muestrasSilo[0]?.acidoUrico;
                            let danoGorgojosAdultos = muestrasSilo[0]?.danoGorgojosAdultosKg;
                            let danoGorgojosTotal = muestrasSilo[0]?.danoGorgojosTotalKg;
                            let danoPiojillo = muestrasSilo[0]?.danoPiojilloKg;
                            let danoTotalPlaga = muestrasSilo[0]?.danoTotalPlagaKg;
                            let perdidaEconomica = muestrasSilo[0]?.perdidaEconomicaSemanal;
                            
                            if (acidoUricoSilo == null || danoGorgojosAdultos == null) {
                              // Calculate values for this silo (averages for multiple samples)
                              const numMuestras = muestrasSilo.length || 1;
                              const avgGorgojosVivosSilo = muestrasSilo.reduce((sum, m) => {
                                return sum +
                                  (m.tribVivos || 0) +
                                  (m.rhyzVivos || 0) +
                                  (m.chryVivos || 0) +
                                  (m.sitoVivos || 0) +
                                  (m.stegVivos || 0);
                              }, 0) / numMuestras;

                              const avgPiojilloSilo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
                              // Use maximum tons, not average
                              const maxTonsSilo = Math.max(...muestrasSilo.map(m => m.observaciones || 0), 0);

                              // Ácido Úrico: ((([Gorgojos Vivos]*0.1)+(([Gorgojos Vivos]*6)*0.1))*7)/10 * (tons/1000)
                              // Now includes tons to make it proportional to grain quantity (uses maximum tons, not average)
                              if (acidoUricoSilo == null) {
                                acidoUricoSilo = (((avgGorgojosVivosSilo * 0.1) + ((avgGorgojosVivosSilo * 6) * 0.1)) * 7) / 10 * (maxTonsSilo / 1000);
                              }

                              // Daño Gorgojos Adultos Kg = [Gorgojos Vivos] * (tons * 1000) * 0.000001 * 7
                              if (danoGorgojosAdultos == null) {
                                danoGorgojosAdultos = avgGorgojosVivosSilo * (maxTonsSilo * 1000) * 0.000001 * 7;
                              }

                              // Daño Gorgojos Total Kg = [Daño Gorgojos Adultos Kg] * 6
                              if (danoGorgojosTotal == null) {
                                danoGorgojosTotal = danoGorgojosAdultos * 6;
                              }

                              // Daño Piojillo = [Piojillo/Ácaro] * (tons * 1000) * 0.00000033 * 7 (uses maximum tons, not average)
                              if (danoPiojillo == null) {
                                danoPiojillo = avgPiojilloSilo * (maxTonsSilo * 1000) * 0.00000033 * 7;
                              }

                              // Daño Total Plaga Kg = [Daño Gorgojos Total Kg] + [Daño Piojillo]
                              if (danoTotalPlaga == null) {
                                danoTotalPlaga = danoGorgojosTotal + danoPiojillo;
                              }

                              // Pérdida Económica Semanal = [Daño Total Plaga Kg] * (grain type cost)
                              // Note: This requires grain cost, which should be saved in the database
                              // For now, we'll use the saved value if available
                              if (perdidaEconomica == null) {
                                perdidaEconomica = 0; // Will be calculated when grain costs are configured
                              }
                            }

                            return [
                              // Sample rows for this silo
                              ...muestrasSilo.map((m, idx) => (
                                <tr key={m.id || `${silo}-${idx}`} className="hover:bg-gray-50">
                                  <td className="px-3 py-2 font-medium">{m.silo}</td>
                                  <td className="px-3 py-2">{m.muestra}</td>
                                  <td className="px-3 py-2">{m.barco}</td>
                                  <td className="px-3 py-2">{m.tipoGrano}</td>
                                  <td className="px-3 py-2">
                                    {m.fechaAlmacenamiento ? format(new Date(m.fechaAlmacenamiento), 'dd/MM/yy') : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center">{m.diasAlmacenamiento}</td>
                                  <td className="px-3 py-2 text-center">{m.piojilloAcaro != null ? m.piojilloAcaro : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.tribVivos != null ? m.tribVivos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.tribMuertos != null ? m.tribMuertos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.rhyzVivos != null ? m.rhyzVivos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.rhyzMuertos != null ? m.rhyzMuertos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.chryVivos != null ? m.chryVivos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.chryMuertos != null ? m.chryMuertos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.sitoVivos != null ? m.sitoVivos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.sitoMuertos != null ? m.sitoMuertos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.stegVivos != null ? m.stegVivos : ''}</td>
                                  <td className="px-3 py-2 text-center">{m.stegMuertos != null ? m.stegMuertos : ''}</td>
                                  <td className="px-3 py-2 text-right">{m.observaciones != null ? m.observaciones.toLocaleString() : ''}</td>
                                </tr>
                              )),
                              // Summary rows for this silo showing all calculations
                              <>
                                <tr key={`${silo}-summary-acido`} className="bg-emerald-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-emerald-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Ácido Úrico Semanal:</span>
                                      <span className="text-xs font-normal text-emerald-700 opacity-75" title="Indicador de contaminación por excrementos de gorgojos. Se calcula a partir de la cantidad de gorgojos vivos encontrados en el muestreo. Mide el nivel de contaminación del grano por residuos metabólicos de los insectos.">
                                        (Indicador de contaminación del grano por excrementos de gorgojos)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-emerald-700 text-sm">
                                    {acidoUricoSilo.toFixed(1)} mg/100g
                                  </td>
                                </tr>
                                <tr key={`${silo}-summary-dano-adultos`} className="bg-blue-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-blue-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Daño Gorgojos Adultos Kg:</span>
                                      <span className="text-xs font-normal text-blue-700 opacity-75" title="Cantidad de grano (en kilogramos) consumido o deteriorado directamente por los gorgojos adultos durante la semana. Representa el daño físico causado por los insectos adultos al alimentarse del grano.">
                                        (Kg de grano consumido/deteriorado por gorgojos adultos esta semana)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-blue-700 text-sm">
                                    {danoGorgojosAdultos.toFixed(1)} kg
                                  </td>
                                </tr>
                                <tr key={`${silo}-summary-dano-total`} className="bg-purple-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-purple-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Daño Gorgojos Total Kg:</span>
                                      <span className="text-xs font-normal text-purple-700 opacity-75" title="Cantidad total de grano (en kilogramos) consumido o deteriorado por todos los gorgojos, incluyendo adultos y larvas. Se calcula multiplicando el daño de adultos por 6 para estimar el daño completo del ciclo de vida del insecto (incluye larvas que no son visibles en el muestreo).">
                                        (Kg de grano consumido/deteriorado por gorgojos - incluye adultos y larvas)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-purple-700 text-sm">
                                    {danoGorgojosTotal.toFixed(1)} kg
                                  </td>
                                </tr>
                                <tr key={`${silo}-summary-dano-piojillo`} className="bg-amber-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-amber-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Daño Piojillo Kg:</span>
                                      <span className="text-xs font-normal text-amber-700 opacity-75" title="Cantidad de grano (en kilogramos) consumido o deteriorado por piojillo y ácaros durante la semana. Estos pequeños ácaros también causan daño significativo al alimentarse del grano almacenado.">
                                        (Kg de grano consumido/deteriorado por piojillo y ácaros esta semana)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-amber-700 text-sm">
                                    {danoPiojillo.toFixed(1)} kg
                                  </td>
                                </tr>
                                <tr key={`${silo}-summary-dano-total-plaga`} className="bg-red-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-red-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Daño Total Plaga Kg:</span>
                                      <span className="text-xs font-normal text-red-700 opacity-75" title="Suma total de grano (en kilogramos) consumido o deteriorado por todas las plagas combinadas (gorgojos + piojillo/ácaros). Representa la pérdida total de grano debido a la actividad de todas las plagas durante la semana.">
                                        (Kg total de grano consumido/deteriorado por todas las plagas)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-red-700 text-sm">
                                    {danoTotalPlaga.toFixed(1)} kg
                                  </td>
                                </tr>
                                <tr key={`${silo}-summary-perdida`} className="bg-orange-50 font-semibold">
                                  <td colSpan={5} className="px-3 py-2 text-orange-900">
                                    <div className="flex items-center gap-2">
                                      <span>Total {silo} - Pérdida Económica Semanal:</span>
                                      <span className="text-xs font-normal text-orange-700 opacity-75" title="Valor económico (en Quetzales) del grano perdido durante la semana. Se calcula multiplicando el daño total de plagas (en kg) por el costo por kilogramo del tipo de grano almacenado en el silo.">
                                        (Valor económico en Q. del grano perdido esta semana)
                                      </span>
                                    </div>
                                  </td>
                                  <td colSpan={13} className="px-3 py-2 text-right text-orange-700 text-sm">
                                    Q. {perdidaEconomica.toFixed(0)}
                                  </td>
                                </tr>
                              </>
                            ];
                          });
                        })()}
                      </tbody>
                      </table>
                    </div>
                  </div>
                )}
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Upload/Edit Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingReportId ? 'Editar Reporte de Muestreo' : 'Importar Reporte de Muestreo'}
                  </h2>
                  {selectedFile && (
                    <p className="text-sm text-gray-500">{selectedFile.name}</p>
                  )}
                </div>
                <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {parsing ? (
                  <div className="py-12 text-center">
                    <Loader2 size={48} className="mx-auto text-emerald-600 animate-spin mb-4" />
                    <p className="text-gray-600">Analizando PDF...</p>
                  </div>
                ) : parsedData || editingReportId ? (
                  <>
                    {/* Warnings - only show when parsing PDF */}
                    {parsedData && parsedData.warnings.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-amber-800 mb-1">Advertencias:</p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                          {parsedData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Raw Text Toggle - only show when parsing PDF */}
                    {parsedData && (
                      <div className="mb-4">
                        <button
                          onClick={() => setShowRawText(!showRawText)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {showRawText ? 'Ocultar texto extraído' : 'Ver texto extraído del PDF'}
                        </button>
                        {showRawText && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                              {parsedData.rawText || 'No se pudo extraer texto'}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Reporte *</label>
                        <input
                          type="text"
                          value={editedData.numeroReporte}
                          onChange={(e) => setEditedData({ ...editedData, numeroReporte: e.target.value })}
                          className="w-full border rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                          placeholder="Ej: 17221225"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                        <select
                          value={editedData.cliente}
                          onChange={(e) => setEditedData({ ...editedData, cliente: e.target.value })}
                          className="w-full border rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                          disabled={!isAdmin && userEmail ? true : false}
                        >
                          <option value="">Seleccionar cliente...</option>
                          {(() => {
                            // If client user, only show their own client
                            const clientsToShow = !isAdmin && userEmail
                              ? clientes.filter(c => c.email.toLowerCase() === userEmail.toLowerCase())
                              : clientes.filter(c => c.activo);
                            
                            return clientsToShow.map(cliente => (
                              <option key={cliente.id} value={cliente.nombre}>
                                {cliente.nombre} ({cliente.email})
                              </option>
                            ));
                          })()}
                        </select>
                        {!isAdmin && userEmail && (
                          <p className="text-xs text-gray-500 mt-1">
                            Solo puedes crear reportes para tu cuenta
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Servicio</label>
                        <input
                          type="date"
                          value={editedData.fechaServicio || ''}
                          onChange={(e) => setEditedData({ ...editedData, fechaServicio: e.target.value })}
                          className="w-full border rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                          placeholder="Fecha del servicio"
                        />
                      </div>
                    </div>

                    {/* Samples Table */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Muestras ({editedData.muestras.length})
                        </h3>
                        <button
                          onClick={addEmptyRow}
                          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                        >
                          <Plus size={16} />
                          Agregar fila
                        </button>
                      </div>

                      {editedData.muestras.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-8 text-center">
                          <p className="text-gray-500 mb-2">No se detectaron muestras automáticamente.</p>
                          <button
                            onClick={addEmptyRow}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Agregar fila manualmente
                          </button>
                        </div>
                      ) : (
                        <div className="border rounded-lg">
                          {/* Legend */}
                          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                            <p className="text-xs text-gray-700">
                              <span className="font-medium">Leyenda:</span>{' '}
                              <span className="text-gray-600">
                                Trib = Tribolium / Chry = Chryptolestes / Rhyz = Rhyzoperta / Sito = Sitophilus / Steg = Stegobium
                              </span>
                              {' • '}
                              <span className="text-gray-600">
                                V = Vivos (Alive) / M = Muertos (Dead)
                              </span>
                            </p>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-orange-100">
                              <tr>
                                <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[80px]">Silo</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[80px]">Muestra</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[100px]">Barco</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[70px]">Tipo</th>
                                <th className="px-2 py-2 text-left font-medium text-gray-700 min-w-[100px]">Fecha Alm.</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">Días</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">Pioj.</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">TribV</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">TribM</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">RhyzV</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">RhyzM</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">ChryV</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">ChryM</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">SitoV</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">SitoM</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">StegV</th>
                                <th className="px-2 py-2 text-center font-medium text-gray-700 min-w-[50px]">StegM</th>
                                <th className="px-2 py-2 text-right font-medium text-gray-700 min-w-[80px]">Tons</th>
                                <th className="px-2 py-2 w-10"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {editedData.muestras.map((m, idx) => (
                                <tr key={m.id || idx} className="hover:bg-gray-50">
                                  <td className="px-1 py-1">
                                    <input
                                      type="text"
                                      value={m.silo || ''}
                                      onChange={(e) => updateMuestra(idx, 'silo', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                      placeholder="AP-07"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <select
                                      value={m.muestra || 'Arriba'}
                                      onChange={(e) => updateMuestra(idx, 'muestra', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                      <option value="Arriba">Arriba</option>
                                      <option value="Abajo">Abajo</option>
                                    </select>
                                  </td>
                                  <td className="px-1 py-1">
                                    <select
                                      value={m.barco || ''}
                                      onChange={(e) => updateMuestra(idx, 'barco', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    >
                                      <option value="">Seleccionar...</option>
                                      {availableShips.length > 0 ? (
                                        availableShips.map((ship) => (
                                          <option key={ship} value={ship}>
                                            {ship}
                                          </option>
                                        ))
                                      ) : (
                                        <option value="" disabled>
                                          No hay barcos con lotes registrados
                                        </option>
                                      )}
                                    </select>
                                  </td>
                                  <td className="px-1 py-1">
                                    <select
                                      value={m.tipoGrano || ''}
                                      onChange={(e) => updateMuestra(idx, 'tipoGrano', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                      disabled={!m.barco}
                                    >
                                      <option value="">
                                        {!m.barco ? 'Selecciona un barco primero' : 'Seleccionar...'}
                                      </option>
                                      {(() => {
                                        const grainTypesForShip = getGrainTypesForShip(m.barco || '');
                                        return grainTypesForShip.length > 0 ? (
                                          grainTypesForShip.map((variety) => (
                                            <option key={variety} value={variety}>
                                              {variety}
                                            </option>
                                          ))
                                        ) : (
                                          <option value="" disabled>
                                            {m.barco 
                                              ? 'No hay granos registrados para este barco' 
                                              : 'No hay variedades disponibles'}
                                          </option>
                                        );
                                      })()}
                                    </select>
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="date"
                                      value={m.fechaAlmacenamiento || ''}
                                      onChange={(e) => updateMuestra(idx, 'fechaAlmacenamiento', e.target.value)}
                                      className="w-full border rounded px-2 py-1 text-sm"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.diasAlmacenamiento != null ? m.diasAlmacenamiento : ''}
                                      onChange={(e) => updateMuestra(idx, 'diasAlmacenamiento', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.piojilloAcaro != null ? m.piojilloAcaro : ''}
                                      onChange={(e) => updateMuestra(idx, 'piojilloAcaro', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.tribVivos != null ? m.tribVivos : ''}
                                      onChange={(e) => updateMuestra(idx, 'tribVivos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.tribMuertos != null ? m.tribMuertos : ''}
                                      onChange={(e) => updateMuestra(idx, 'tribMuertos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.rhyzVivos != null ? m.rhyzVivos : ''}
                                      onChange={(e) => updateMuestra(idx, 'rhyzVivos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.rhyzMuertos != null ? m.rhyzMuertos : ''}
                                      onChange={(e) => updateMuestra(idx, 'rhyzMuertos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.chryVivos != null ? m.chryVivos : ''}
                                      onChange={(e) => updateMuestra(idx, 'chryVivos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.chryMuertos != null ? m.chryMuertos : ''}
                                      onChange={(e) => updateMuestra(idx, 'chryMuertos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.sitoVivos != null ? m.sitoVivos : ''}
                                      onChange={(e) => updateMuestra(idx, 'sitoVivos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.sitoMuertos != null ? m.sitoMuertos : ''}
                                      onChange={(e) => updateMuestra(idx, 'sitoMuertos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.stegVivos != null ? m.stegVivos : ''}
                                      onChange={(e) => updateMuestra(idx, 'stegVivos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      value={m.stegMuertos != null ? m.stegMuertos : ''}
                                      onChange={(e) => updateMuestra(idx, 'stegMuertos', parseInt(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-center"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      type="number"
                                      step="0.001"
                                      value={m.observaciones != null ? m.observaciones : ''}
                                      onChange={(e) => updateMuestra(idx, 'observaciones', parseFloat(e.target.value) || 0)}
                                      className="w-full border rounded px-2 py-1 text-sm text-right"
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <button
                                      onClick={() => removeMuestra(idx)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <X size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    {editingReportId ? 'Cargando datos del reporte...' : 'Error al procesar el PDF'}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {(parsedData || editingReportId) && !parsing && (
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingReportId ? 'Actualizar Reporte' : 'Guardar Reporte'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMonitoreoGranosAP;
