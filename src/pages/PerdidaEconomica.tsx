import React, { useMemo, useState, useEffect } from 'react';
import { TrendingDown, Loader2 } from 'lucide-react';
import { useMonitoreoGranos } from '@/hooks/useMonitoreoGranos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useSilos } from '@/hooks/useSilos';
import { useFumigacionSilos } from '@/hooks/useFumigacionSilos';
import { useAdminServicios } from '@/hooks/useAdminServicios';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { HistorialPerdidaSilo } from '@/types/monitoreoGranos';
import { GrainBatch } from '@/types/grain';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import * as Tabs from '@radix-ui/react-tabs';

const PerdidaEconomica: React.FC = () => {
  const { muestreos, loading } = useMonitoreoGranos();
  const { variedadesGrano } = useCatalogos();
  const { silos } = useSilos();
  const { fumigaciones } = useFumigacionSilos();
  const { clientes } = useAdminServicios();
  
  // Verificar si el usuario es admin
  const currentUser = React.useMemo(() => {
    const userJson = localStorage.getItem('fysa-current-user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const userEmail = currentUser?.email || '';
  
  const [filtroCliente, setFiltroCliente] = useState<string>('');
  
  // Obtener silos del cliente si no es admin
  const silosDelCliente = useMemo(() => {
    if (isAdmin) {
      // Admin: filtrar por cliente seleccionado o mostrar todos
      if (!filtroCliente) return silos;
      return silos.filter(s => s.clienteEmail === filtroCliente);
    } else {
      // Cliente: solo ver sus propios silos
      return silos.filter(s => s.clienteEmail === userEmail);
    }
  }, [silos, isAdmin, userEmail, filtroCliente]);
  
  // Obtener números de silo del cliente (ej: "AP-01", "AP-02")
  const silosDelClienteNumeros = useMemo(() => {
    return new Set(silosDelCliente.map(s => `AP-${s.number.toString().padStart(2, '0')}`));
  }, [silosDelCliente]);
  
  // Create a set of silos that currently have active batches
  const silosConBatchesActivos = useMemo(() => {
    const silosSet = new Set<string>();
    silosDelCliente.forEach(silo => {
      if (silo.batches.length > 0) {
        const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
        silosSet.add(siloKey);
      }
    });
    return silosSet;
  }, [silosDelCliente]);
  const [activeTab, setActiveTab] = useState('ultimo');
  const [historial, setHistorial] = useState<HistorialPerdidaSilo[]>([]);
  const [historialLoading, setHistorialLoading] = useState(true);
  const [batches, setBatches] = useState<Map<string, GrainBatch>>(new Map());
  
  // ID del servicio "Gas. y Encarpado"
  const SERVICIO_GASIFICACION_ID = 136257;
  
  // Obtener clientes únicos para el filtro (solo admin)
  const clientesUnicos = useMemo(() => {
    if (!isAdmin) return [];
    const clientesMap = new Map<string, string>(); // email -> nombre
    silos.forEach(s => {
      if (s.clienteEmail) {
        const cliente = clientes.find(c => c.email === s.clienteEmail);
        if (cliente) {
          clientesMap.set(cliente.email, cliente.nombre);
        }
      }
    });
    return Array.from(clientesMap.entries())
      .map(([email, nombre]) => ({ email, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [silos, clientes, isAdmin]);

  // Fetch historial and batches
  useEffect(() => {
    const fetchHistorialAndBatches = async () => {
      try {
        setHistorialLoading(true);
        
        // Fetch historial
        const { data: historialData, error: historialError } = await supabase
          .from('historial_perdidas_silos')
          .select('*')
          .order('fecha_semana', { ascending: false });

        if (historialError) throw historialError;

        const formattedHistorial: HistorialPerdidaSilo[] = (historialData || []).map((item: any) => ({
          id: item.id,
          muestreoId: item.muestreo_id,
          batchId: item.batch_id || null,
          silo: item.silo,
          fechaSemana: item.fecha_semana,
          tipoGrano: item.tipo_grano,
          totalGorgojosVivos: item.total_gorgojos_vivos || 0,
          totalPiojillo: item.total_piojillo || 0,
          totalTons: item.total_tons || 0,
          acidoUrico: item.acido_urico || 0,
          danoGorgojosAdultosKg: item.dano_gorgojos_adultos_kg || 0,
          danoGorgojosTotalKg: item.dano_gorgojos_total_kg || 0,
          danoPiojilloKg: item.dano_piojillo_kg || 0,
          danoTotalPlagaKg: item.dano_total_plaga_kg || 0,
          perdidaEconomicaSemanal: item.perdida_economica_semanal || 0,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        setHistorial(formattedHistorial);

        // Fetch batches
        const { data: batchesData, error: batchesError } = await supabase
          .from('grain_batches')
          .select('*');

        if (batchesError) throw batchesError;

        // Fetch movements for batches
        const { data: movementsData } = await supabase
          .from('batch_movements')
          .select('*')
          .order('fecha', { ascending: true });

        const batchesMap = new Map<string, GrainBatch>();
        (batchesData || []).forEach((b: any) => {
          const batchMovements = (movementsData || [])
            .filter((m: any) => m.batch_id === b.id)
            .map((m: any) => ({
              fecha: m.fecha,
              siloOrigen: m.silo_origen,
              siloDestino: m.silo_destino,
              cantidad: m.cantidad,
              notas: m.notas,
            }));

          batchesMap.set(b.id, {
            id: b.id,
            barcoId: b.barco_id || '',
            granoId: b.grano_id || '',
            variedadId: b.variedad_id,
            grainType: b.grain_type,
            grainSubtype: b.grain_subtype,
            quantity: Number(b.quantity),
            unit: (b.unit || 'tonnes') as 'kg' | 'tonnes',
            entryDate: b.entry_date,
            origin: b.origin,
            notes: b.notes,
            siloActual: b.silo_actual || 0,
            historialMovimientos: batchMovements,
          });
        });

        setBatches(batchesMap);
      } catch (error) {
        console.error('Error fetching historial or batches:', error);
      } finally {
        setHistorialLoading(false);
      }
    };

    fetchHistorialAndBatches();

    // Subscribe to changes
    const subscription = supabase
      .channel('perdida-economica-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'historial_perdidas_silos' }, () => {
        fetchHistorialAndBatches();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grain_batches' }, () => {
        fetchHistorialAndBatches();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // fetchHistorialAndBatches is defined inside, so no dependency needed

  // Helper function to get grain cost per kg
  const getGrainCostPerKg = (tipoGrano: string): number => {
    const match = variedadesGrano.find(v =>
      v.activo && (
        v.tipoGrano.toLowerCase() === tipoGrano.toLowerCase() ||
        `${v.variedad} - ${v.tipoGrano}`.toLowerCase() === tipoGrano.toLowerCase() ||
        v.variedad.toLowerCase() === tipoGrano.toLowerCase()
      )
    );
    return match?.costoPorKg || 0;
  };

  // Filtrar historial por silos del cliente
  const historialFiltrado = useMemo(() => {
    return historial.filter(item => silosDelClienteNumeros.has(item.silo));
  }, [historial, silosDelClienteNumeros]);
  
  // Filtrar muestreos por silos del cliente
  const muestreosFiltrados = useMemo(() => {
    return muestreos.map(muestreo => ({
      ...muestreo,
      muestras: muestreo.muestras.filter(muestra => 
        muestra.silo && silosDelClienteNumeros.has(muestra.silo)
      )
    })).filter(muestreo => muestreo.muestras.length > 0);
  }, [muestreos, silosDelClienteNumeros]);
  
  // Get latest report by service date (from filtered muestreos)
  const latestReport = useMemo(() => {
    if (muestreosFiltrados.length === 0) return null;
    
    const reportsWithDate = muestreosFiltrados
      .filter(m => m.fechaServicio)
      .sort((a, b) => {
        const dateA = new Date(a.fechaServicio!).getTime();
        const dateB = new Date(b.fechaServicio!).getTime();
        return dateB - dateA; // Most recent first
      });
    
    return reportsWithDate.length > 0 ? reportsWithDate[0] : muestreosFiltrados[0];
  }, [muestreosFiltrados]);

  // Get all 2025 reports (from filtered muestreos)
  const reports2025 = useMemo(() => {
    return muestreosFiltrados.filter(m => {
      if (!m.fechaServicio) return false;
      const year = new Date(m.fechaServicio).getFullYear();
      return year === 2025;
    });
  }, [muestreosFiltrados]);

  // Calculate data for latest report
  const latestReportData = useMemo(() => {
    if (!latestReport) return null;

    // Group muestras by silo - use saved calculated values from muestras (same as AdminMonitoreoGranosAP)
    const siloGroups: Record<string, typeof latestReport.muestras> = {};
    latestReport.muestras.forEach((muestra) => {
      const silo = muestra.silo;
      if (!silo) return;
      if (!siloGroups[silo]) {
        siloGroups[silo] = [];
      }
      siloGroups[silo].push(muestra);
    });

    // Use saved values from muestras (they already have calculated values per silo)
    // All muestras in the same silo have the same calculated values
    const siloAcidoUrico = new Map<string, number>();
    const siloDanoAdultos = new Map<string, number>();
    const siloDanoTotal = new Map<string, number>();
    const siloDanoPiojillo = new Map<string, number>();
    const siloDanoTotalPlaga = new Map<string, number>();
    const siloPerdidas = new Map<string, number>();
    const siloGorgojosVivos = new Map<string, number>();
    const siloPiojillo = new Map<string, number>();
    const siloTipoGrano = new Map<string, string>();

    latestReport.muestras.forEach(m => {
      if (m.silo) {
        // Only store once per silo (all muestras in same silo have same values)
        if (!siloAcidoUrico.has(m.silo) && m.acidoUrico != null) {
          siloAcidoUrico.set(m.silo, m.acidoUrico);
        }
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
        if (!siloPerdidas.has(m.silo) && m.perdidaEconomicaSemanal != null) {
          siloPerdidas.set(m.silo, m.perdidaEconomicaSemanal);
        }
        // Calculate averages for gorgojos vivos and piojillo (for display)
        if (!siloGorgojosVivos.has(m.silo)) {
          const muestrasSilo = siloGroups[m.silo] || [];
          const numMuestras = muestrasSilo.length || 1;
          const avgGorgojosVivos = muestrasSilo.reduce((sum, m) => {
            return sum +
              (m.tribVivos || 0) +
              (m.rhyzVivos || 0) +
              (m.chryVivos || 0) +
              (m.sitoVivos || 0) +
              (m.stegVivos || 0);
          }, 0) / numMuestras;
          siloGorgojosVivos.set(m.silo, Math.round(avgGorgojosVivos));
        }
        if (!siloPiojillo.has(m.silo)) {
          const muestrasSilo = siloGroups[m.silo] || [];
          const numMuestras = muestrasSilo.length || 1;
          const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
          siloPiojillo.set(m.silo, Math.round(avgPiojillo));
        }
        if (!siloTipoGrano.has(m.silo)) {
          siloTipoGrano.set(m.silo, m.tipoGrano || '');
        }
      }
    });

    // Convert to array and sort by silo number
    const siloArray = Array.from(siloAcidoUrico.keys())
      .map((silo) => ({
          silo,
        gorgojosVivos: siloGorgojosVivos.get(silo) || 0,
        piojillo: siloPiojillo.get(silo) || 0,
        tipoGrano: siloTipoGrano.get(silo) || '',
        acidoUrico: siloAcidoUrico.get(silo) || 0,
        danoGorgojosAdultosKg: siloDanoAdultos.get(silo) || 0,
        danoGorgojosTotalKg: siloDanoTotal.get(silo) || 0,
        danoPiojilloKg: siloDanoPiojillo.get(silo) || 0,
        danoTotalPlagaKg: siloDanoTotalPlaga.get(silo) || 0,
        perdidaEconomicaSemanal: siloPerdidas.get(silo) || 0,
      }))
      .sort((a, b) => {
        const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    // Group by grain type - use siloArray values (already averaged per silo)
    const grainData: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    siloArray.forEach((silo) => {
      const tipo = silo.tipoGrano || 'Otro';
      if (!grainData[tipo]) {
        grainData[tipo] = { gorgojosVivos: 0, piojillo: 0 };
      }
      // Sum the per-silo averaged values (already averaged, so we sum the silos)
      grainData[tipo].gorgojosVivos += silo.gorgojosVivos;
      grainData[tipo].piojillo += silo.piojillo;
    });

    const grainArray = Object.entries(grainData).map(([tipo, data]) => ({
      tipo,
      gorgojosVivos: data.gorgojosVivos,
      piojillo: data.piojillo,
      totalPlaga: data.gorgojosVivos + data.piojillo, // Total plaga = gorgojos vivos + piojillo
    }));

    // Calculate totals
    const totalGorgojosVivos = siloArray.reduce((sum, s) => sum + s.gorgojosVivos, 0);
    const totalPiojillo = siloArray.reduce((sum, s) => sum + s.piojillo, 0);

    // Data for plaga total distribution by grain type (pie chart)
    const plagaTotalPorGranoData = grainArray
      .filter(item => item.totalPlaga > 0)
      .map((item, index) => {
        const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#a855f7'];
        return {
          name: item.tipo,
          value: item.totalPlaga,
          color: COLORS[index % COLORS.length],
        };
      });

    // Calculate Ácido Úrico - sum of per-silo calculations
    // Formula per silo: ((([Gorgojos Vivos]*0.1)+(([Gorgojos Vivos]*6)*0.1))*7)/10 * (tons/1000)
    // Now includes tons to make it proportional to grain quantity
    const acidoUrico = siloArray.reduce((sum, s) => sum + s.acidoUrico, 0);

    // Calculate total damage values
    const totalDanoGorgojosAdultosKg = siloArray.reduce((sum, s) => sum + s.danoGorgojosAdultosKg, 0);
    const totalDanoGorgojosTotalKg = siloArray.reduce((sum, s) => sum + s.danoGorgojosTotalKg, 0);
    const totalDanoPiojilloKg = siloArray.reduce((sum, s) => sum + s.danoPiojilloKg, 0);
    const totalDanoTotalPlagaKg = siloArray.reduce((sum, s) => sum + s.danoTotalPlagaKg, 0);
    const totalPerdidaEconomicaSemanal = siloArray.reduce((sum, s) => sum + s.perdidaEconomicaSemanal, 0);

    // Pest type breakdown - group by silo first, then sum averages
    const pestBreakdown = {
      trib: { vivos: 0, muertos: 0 },
      rhyz: { vivos: 0, muertos: 0 },
      chry: { vivos: 0, muertos: 0 },
      sito: { vivos: 0, muertos: 0 },
      steg: { vivos: 0, muertos: 0 },
      piojillo: 0,
    };

    // Group muestras by silo and calculate averages, then sum across all silos
    Object.entries(siloGroups).forEach(([silo, muestrasSilo]) => {
      const numMuestras = muestrasSilo.length || 1;
      
      // Calculate averages for this silo
      const avgTribVivos = muestrasSilo.reduce((sum, m) => sum + (m.tribVivos || 0), 0) / numMuestras;
      const avgTribMuertos = muestrasSilo.reduce((sum, m) => sum + (m.tribMuertos || 0), 0) / numMuestras;
      const avgRhyzVivos = muestrasSilo.reduce((sum, m) => sum + (m.rhyzVivos || 0), 0) / numMuestras;
      const avgRhyzMuertos = muestrasSilo.reduce((sum, m) => sum + (m.rhyzMuertos || 0), 0) / numMuestras;
      const avgChryVivos = muestrasSilo.reduce((sum, m) => sum + (m.chryVivos || 0), 0) / numMuestras;
      const avgChryMuertos = muestrasSilo.reduce((sum, m) => sum + (m.chryMuertos || 0), 0) / numMuestras;
      const avgSitoVivos = muestrasSilo.reduce((sum, m) => sum + (m.sitoVivos || 0), 0) / numMuestras;
      const avgSitoMuertos = muestrasSilo.reduce((sum, m) => sum + (m.sitoMuertos || 0), 0) / numMuestras;
      const avgStegVivos = muestrasSilo.reduce((sum, m) => sum + (m.stegVivos || 0), 0) / numMuestras;
      const avgStegMuertos = muestrasSilo.reduce((sum, m) => sum + (m.stegMuertos || 0), 0) / numMuestras;
      const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
      
      // Sum the averages (each silo contributes its average once)
      pestBreakdown.trib.vivos += avgTribVivos;
      pestBreakdown.trib.muertos += avgTribMuertos;
      pestBreakdown.rhyz.vivos += avgRhyzVivos;
      pestBreakdown.rhyz.muertos += avgRhyzMuertos;
      pestBreakdown.chry.vivos += avgChryVivos;
      pestBreakdown.chry.muertos += avgChryMuertos;
      pestBreakdown.sito.vivos += avgSitoVivos;
      pestBreakdown.sito.muertos += avgSitoMuertos;
      pestBreakdown.steg.vivos += avgStegVivos;
      pestBreakdown.steg.muertos += avgStegMuertos;
      pestBreakdown.piojillo += avgPiojillo;
    });

    const pestTypeData = [
      { name: 'Tribolium', value: pestBreakdown.trib.vivos + pestBreakdown.trib.muertos },
      { name: 'Rhyzoperta', value: pestBreakdown.rhyz.vivos + pestBreakdown.rhyz.muertos },
      { name: 'Cryptolestes', value: pestBreakdown.chry.vivos + pestBreakdown.chry.muertos },
      { name: 'Sitophilus', value: pestBreakdown.sito.vivos + pestBreakdown.sito.muertos },
      { name: 'Stegobium', value: pestBreakdown.steg.vivos + pestBreakdown.steg.muertos },
      { name: 'Piojillo', value: pestBreakdown.piojillo },
    ].filter(item => item.value > 0);

    // Dead vs Live comparison
    const totalVivos = pestBreakdown.trib.vivos + pestBreakdown.rhyz.vivos + 
                      pestBreakdown.chry.vivos + pestBreakdown.sito.vivos + pestBreakdown.steg.vivos;
    const totalMuertos = pestBreakdown.trib.muertos + pestBreakdown.rhyz.muertos + 
                        pestBreakdown.chry.muertos + pestBreakdown.sito.muertos + pestBreakdown.steg.muertos;
    
    const deadVsLiveData = [
      { name: 'Vivos', value: totalVivos },
      { name: 'Muertos', value: totalMuertos },
    ];

    // Sample location breakdown (arriba/abajo) - group by silo first, then sum averages
    const locationData: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    Object.entries(siloGroups).forEach(([silo, muestrasSilo]) => {
      // Group muestras by location within this silo
      const muestrasPorLocation: Record<string, typeof muestrasSilo> = {};
      muestrasSilo.forEach(m => {
        const location = m.muestra?.toLowerCase().includes('arriba') ? 'Arriba' : 
                        m.muestra?.toLowerCase().includes('abajo') ? 'Abajo' : 'Otro';
        if (!muestrasPorLocation[location]) {
          muestrasPorLocation[location] = [];
        }
        muestrasPorLocation[location].push(m);
      });
      
      // Calculate averages per location within this silo
      Object.entries(muestrasPorLocation).forEach(([location, muestrasLocation]) => {
        const numMuestras = muestrasLocation.length || 1;
        const avgGorgojosVivos = muestrasLocation.reduce((sum, m) => {
          return sum +
            (m.tribVivos || 0) + (m.rhyzVivos || 0) + (m.chryVivos || 0) +
            (m.sitoVivos || 0) + (m.stegVivos || 0);
        }, 0) / numMuestras;
        const avgPiojillo = muestrasLocation.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
        
      if (!locationData[location]) {
        locationData[location] = { gorgojosVivos: 0, piojillo: 0 };
      }
        // Sum the averages (each location contributes its average once per silo)
        locationData[location].gorgojosVivos += avgGorgojosVivos;
        locationData[location].piojillo += avgPiojillo;
      });
    });

    const locationArray = Object.entries(locationData).map(([location, data]) => ({
      location,
      gorgojosVivos: data.gorgojosVivos,
      piojillo: data.piojillo,
    }));

    // Detailed pest breakdown for bar chart
    const detailedPestData = [
      { pest: 'Tribolium', vivos: pestBreakdown.trib.vivos, muertos: pestBreakdown.trib.muertos },
      { pest: 'Rhyzoperta', vivos: pestBreakdown.rhyz.vivos, muertos: pestBreakdown.rhyz.muertos },
      { pest: 'Cryptolestes', vivos: pestBreakdown.chry.vivos, muertos: pestBreakdown.chry.muertos },
      { pest: 'Sitophilus', vivos: pestBreakdown.sito.vivos, muertos: pestBreakdown.sito.muertos },
      { pest: 'Stegobium', vivos: pestBreakdown.steg.vivos, muertos: pestBreakdown.steg.muertos },
    ].filter(item => item.vivos > 0 || item.muertos > 0);

    // Find silos above thresholds
    const silosGorgojosThreshold = siloArray
      .filter(s => s.gorgojosVivos >= 2)
      .map(s => s.silo.replace('AP-', ''));

    const silosPiojilloThreshold = siloArray
      .filter(s => s.piojillo > 5)
      .map(s => s.silo.replace('AP-', ''));

    // Calculate Ácido Úrico status distribution
    const acidoUricoStatus = {
      tolerable: 0,      // 0-5 mg/100g
      altamentePeligroso: 0, // 5-10 mg/100g
      critico: 0,        // >10 mg/100g
    };

    siloArray.forEach(silo => {
      if (silo.acidoUrico <= 5) {
        acidoUricoStatus.tolerable++;
      } else if (silo.acidoUrico <= 10) {
        acidoUricoStatus.altamentePeligroso++;
      } else {
        acidoUricoStatus.critico++;
      }
    });

    const acidoUricoStatusData = [
      { name: 'Tolerable', value: acidoUricoStatus.tolerable, color: '#10b981' },
      { name: 'Altamente Peligroso', value: acidoUricoStatus.altamentePeligroso, color: '#f59e0b' },
      { name: 'Crítico', value: acidoUricoStatus.critico, color: '#ef4444' },
    ].filter(item => item.value > 0);

    return {
      siloData: siloArray,
      grainData: grainArray,
      plagaTotalPorGranoData,
      totals: {
        gorgojosVivos: totalGorgojosVivos,
        piojillo: totalPiojillo,
      },
      damageTotals: {
        danoGorgojosAdultosKg: totalDanoGorgojosAdultosKg,
        danoGorgojosTotalKg: totalDanoGorgojosTotalKg,
        danoPiojilloKg: totalDanoPiojilloKg,
        danoTotalPlagaKg: totalDanoTotalPlagaKg,
        perdidaEconomicaSemanal: totalPerdidaEconomicaSemanal,
      },
      thresholds: {
        gorgojos: silosGorgojosThreshold,
        piojillo: silosPiojilloThreshold,
      },
      fecha: latestReport.fechaServicio,
      pestTypeData,
      deadVsLiveData,
      locationData: locationArray,
      detailedPestData,
      acidoUrico,
      acidoUricoStatusData,
    };
  }, [latestReport, variedadesGrano]);

  // Calculate data accumulated - grouped by grain batch
  // Filter for 2025 data only
  const accumulated2025Data = useMemo(() => {
    if (historialLoading || historialFiltrado.length === 0 || reports2025.length === 0) return null;

    // Filter historial for records with batch_id, from 2025, and for client's silos
    const historialConBatch = historialFiltrado.filter(h => {
      if (!h.batchId) return false;
      // Filter by fechaSemana - only include records from 2025
      const fecha = new Date(h.fechaSemana);
      return fecha.getFullYear() === 2025;
    });

    if (historialConBatch.length === 0) {
      console.log('No historial data found with batch_id');
      console.log('Total historial records:', historialFiltrado.length);
      return null;
    }

    console.log('Historial with batch_id:', historialConBatch.length);

    // Group by batch_id for accumulation
    const batchGroups: Record<string, HistorialPerdidaSilo[]> = {};
    
    historialConBatch.forEach(item => {
      if (item.batchId) {
        if (!batchGroups[item.batchId]) {
          batchGroups[item.batchId] = [];
        }
        batchGroups[item.batchId].push(item);
      }
    });

    console.log('Batch groups:', Object.keys(batchGroups).length);

    // Calculate accumulated data per batch (from entry date to today)
    const batchData: Array<{
      batchId: string;
      batch: GrainBatch | undefined;
      gorgojosVivos: number;
      piojillo: number;
      tons: number;
      tipoGrano: string;
      acidoUrico: number;
      danoGorgojosAdultosKg: number;
      danoGorgojosTotalKg: number;
      danoPiojilloKg: number;
      danoTotalPlagaKg: number;
      perdidaEconomicaAcumulada: number;
      cantidadRegistros: number;
      primeraFecha: string;
      ultimaFecha: string;
    }> = [];

    Object.entries(batchGroups).forEach(([batchId, registros]) => {
      const batch = batches.get(batchId);
      if (!batch) {
        console.log(`Batch ${batchId} not found in batches map`);
        return;
      }
      
      // Use entryDate if available, otherwise use all registros
      let registrosDesdeEntrada: HistorialPerdidaSilo[];
      if (batch.entryDate) {
        const entryDate = new Date(batch.entryDate);
        registrosDesdeEntrada = registros.filter(r => {
          const fechaRegistro = new Date(r.fechaSemana);
          return fechaRegistro >= entryDate;
        });
      } else {
        // If no entry date, use all registros for this batch
        registrosDesdeEntrada = registros;
      }

      if (registrosDesdeEntrada.length === 0) {
        console.log(`No registros found for batch ${batchId}`);
        return;
      }

      // Sort by date (oldest first for accumulation)
      const registrosOrdenados = [...registrosDesdeEntrada].sort((a, b) => 
        new Date(a.fechaSemana).getTime() - new Date(b.fechaSemana).getTime()
      );

      // Calculate accumulated values (sum all registros)
      // Note: Each registro represents one silo's data for a muestreo
      // We sum all registros directly as they are already per-silo values
      const gorgojosVivosAcum = registrosOrdenados.reduce((sum, r) => sum + r.totalGorgojosVivos, 0);
      const piojilloAcum = registrosOrdenados.reduce((sum, r) => sum + r.totalPiojillo, 0);
      const tonsAcum = registrosOrdenados.reduce((sum, r) => sum + r.totalTons, 0);
      const danoGorgojosAdultosKgAcum = registrosOrdenados.reduce((sum, r) => sum + r.danoGorgojosAdultosKg, 0);
      const danoGorgojosTotalKgAcum = registrosOrdenados.reduce((sum, r) => sum + r.danoGorgojosTotalKg, 0);
      const danoPiojilloKgAcum = registrosOrdenados.reduce((sum, r) => sum + r.danoPiojilloKg, 0);
      const danoTotalPlagaKgAcum = registrosOrdenados.reduce((sum, r) => sum + r.danoTotalPlagaKg, 0);
      const perdidaEconomicaAcum = registrosOrdenados.reduce((sum, r) => sum + r.perdidaEconomicaSemanal, 0);
      
      // Ácido úrico acumulado (sum of all registros, not average)
      const acidoUricoAcumulado = registrosOrdenados.reduce((sum, r) => sum + r.acidoUrico, 0);

      batchData.push({
        batchId,
        batch,
        gorgojosVivos: gorgojosVivosAcum,
        piojillo: piojilloAcum,
        tons: registrosOrdenados.length > 0 ? tonsAcum / registrosOrdenados.length : 0, // Average tons
        tipoGrano: registrosOrdenados[0]?.tipoGrano || batch.grainType || '',
        acidoUrico: acidoUricoAcumulado,
        danoGorgojosAdultosKg: danoGorgojosAdultosKgAcum,
        danoGorgojosTotalKg: danoGorgojosTotalKgAcum,
        danoPiojilloKg: danoPiojilloKgAcum,
        danoTotalPlagaKg: danoTotalPlagaKgAcum,
        perdidaEconomicaAcumulada: perdidaEconomicaAcum,
        cantidadRegistros: registrosOrdenados.length,
        primeraFecha: registrosOrdenados[0]?.fechaSemana || '',
        ultimaFecha: registrosOrdenados[registrosOrdenados.length - 1]?.fechaSemana || '',
      });
    });

    if (batchData.length === 0) {
      console.log('No batch data calculated. Batch groups:', Object.keys(batchGroups).length);
      console.log('Batches map size:', batches.size);
      return null;
    }

    console.log('Batch data calculated:', batchData.length, 'batches');

    // Group by grain type for grain data
    const grainData: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    batchData.forEach(b => {
      const tipo = b.tipoGrano || 'Otro';
        if (!grainData[tipo]) {
          grainData[tipo] = { gorgojosVivos: 0, piojillo: 0 };
        }
      grainData[tipo].gorgojosVivos += b.gorgojosVivos;
      grainData[tipo].piojillo += b.piojillo;
    });

    // Monthly data (group by month) - calculate from muestreos to match KPI totals
    const monthlyData: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    
    reports2025.forEach(muestreo => {
      if (!muestreo.fechaServicio) return;
      
      const fecha = new Date(muestreo.fechaServicio);
      const monthKey = format(fecha, 'MMMM yyyy', { locale: es });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { gorgojosVivos: 0, piojillo: 0 };
      }
      
      // Group muestras by silo (same logic as KPI calculation)
      const siloGroups: Record<string, typeof muestreo.muestras> = {};
      muestreo.muestras.forEach(muestra => {
        const silo = muestra.silo;
        if (!silo) return;
        if (!siloGroups[silo]) {
          siloGroups[silo] = [];
        }
        siloGroups[silo].push(muestra);
      });
      
      // Calculate totals per silo (averages), then sum
      const siloGorgojosVivos = new Map<string, number>();
      const siloPiojillo = new Map<string, number>();
      
      muestreo.muestras.forEach(m => {
        if (m.silo) {
          if (!siloGorgojosVivos.has(m.silo)) {
            const muestrasSilo = siloGroups[m.silo] || [];
            const numMuestras = muestrasSilo.length || 1;
            const avgGorgojosVivos = muestrasSilo.reduce((sum, m) => {
              return sum +
                (m.tribVivos || 0) +
                (m.rhyzVivos || 0) +
                (m.chryVivos || 0) +
                (m.sitoVivos || 0) +
                (m.stegVivos || 0);
            }, 0) / numMuestras;
            siloGorgojosVivos.set(m.silo, Math.round(avgGorgojosVivos));
          }
          if (!siloPiojillo.has(m.silo)) {
            const muestrasSilo = siloGroups[m.silo] || [];
            const numMuestras = muestrasSilo.length || 1;
            const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
            siloPiojillo.set(m.silo, Math.round(avgPiojillo));
          }
        }
      });
      
      // Sum values from all unique silos for this muestreo
      const muestreoGorgojosVivos = Array.from(siloGorgojosVivos.values()).reduce((sum, val) => sum + val, 0);
      const muestreoPiojillo = Array.from(siloPiojillo.values()).reduce((sum, val) => sum + val, 0);
      
      monthlyData[monthKey].gorgojosVivos += muestreoGorgojosVivos;
      monthlyData[monthKey].piojillo += muestreoPiojillo;
    });

    // Convert monthly to array (ordered by date)
    const monthlyArray = Object.entries(monthlyData)
      .map(([monthKey, data]) => ({
        mes: monthKey.charAt(0).toUpperCase() + monthKey.slice(1),
        gorgojosVivos: data.gorgojosVivos,
        piojillo: data.piojillo,
      }))
      .sort((a, b) => {
        // Sort by date (extract year and month)
        const dateA = new Date('1 ' + a.mes);
        const dateB = new Date('1 ' + b.mes);
        return dateA.getTime() - dateB.getTime();
      });

    // Sort batch data by entry date (most recent first)
    const batchArray = batchData
      .sort((a, b) => {
        const dateA = a.batch?.entryDate ? new Date(a.batch.entryDate).getTime() : 0;
        const dateB = b.batch?.entryDate ? new Date(b.batch.entryDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 30); // Top 30

    // Convert grain to array
    const grainArray = Object.entries(grainData).map(([tipo, data]) => ({
      tipo,
      gorgojosVivos: data.gorgojosVivos,
      piojillo: data.piojillo,
      totalPlaga: data.gorgojosVivos + data.piojillo, // Total plaga = gorgojos vivos + piojillo
    }));
    
    // Data for plaga total distribution by grain type (pie chart)
    const plagaTotalPorGranoData = grainArray
      .filter(item => item.totalPlaga > 0)
      .map((item, index) => {
        const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#a855f7'];
        return {
          name: item.tipo,
          value: item.totalPlaga,
          color: COLORS[index % COLORS.length],
        };
      });

    // Calculate totals directly from muestreos (sum of final values from each muestreo)
    // This matches how values are calculated in AdminMonitoreoGranosAP.tsx
    let totalGorgojosVivos = 0;
    let totalPiojillo = 0;
    let acidoUrico = 0;
    let totalDanoGorgojosAdultosKg = 0;
    let totalDanoGorgojosTotalKg = 0;
    let totalDanoPiojilloKg = 0;
    let totalDanoTotalPlagaKg = 0;
    let totalPerdidaEconomicaAcumulada = 0;

    // Calculate pest breakdown by type (from individual muestras)
    const pestBreakdown = {
      trib: { vivos: 0, muertos: 0 },
      rhyz: { vivos: 0, muertos: 0 },
      chry: { vivos: 0, muertos: 0 },
      sito: { vivos: 0, muertos: 0 },
      steg: { vivos: 0, muertos: 0 },
      piojillo: 0,
    };

    reports2025.forEach(muestreo => {
      // Group muestras by silo (same logic as AdminMonitoreoGranosAP)
      const siloGroups: Record<string, typeof muestreo.muestras> = {};
      muestreo.muestras.forEach(muestra => {
        const silo = muestra.silo;
        if (!silo) return;
        if (!siloGroups[silo]) {
          siloGroups[silo] = [];
        }
        siloGroups[silo].push(muestra);
      });

      // Calculate totals per silo (using saved values from muestras)
      const siloAcidoUrico = new Map<string, number>();
      const siloDanoAdultos = new Map<string, number>();
      const siloDanoTotal = new Map<string, number>();
      const siloDanoPiojillo = new Map<string, number>();
      const siloDanoTotalPlaga = new Map<string, number>();
      const siloPerdidas = new Map<string, number>();
      const siloGorgojosVivos = new Map<string, number>();
      const siloPiojillo = new Map<string, number>();

      // Calculate pest breakdown by type - group by silo, average, then sum
      Object.entries(siloGroups).forEach(([silo, muestrasSilo]) => {
        const numMuestras = muestrasSilo.length || 1;
        
        // Calculate averages for this silo
        const avgTribVivos = muestrasSilo.reduce((sum, m) => sum + (m.tribVivos || 0), 0) / numMuestras;
        const avgTribMuertos = muestrasSilo.reduce((sum, m) => sum + (m.tribMuertos || 0), 0) / numMuestras;
        const avgRhyzVivos = muestrasSilo.reduce((sum, m) => sum + (m.rhyzVivos || 0), 0) / numMuestras;
        const avgRhyzMuertos = muestrasSilo.reduce((sum, m) => sum + (m.rhyzMuertos || 0), 0) / numMuestras;
        const avgChryVivos = muestrasSilo.reduce((sum, m) => sum + (m.chryVivos || 0), 0) / numMuestras;
        const avgChryMuertos = muestrasSilo.reduce((sum, m) => sum + (m.chryMuertos || 0), 0) / numMuestras;
        const avgSitoVivos = muestrasSilo.reduce((sum, m) => sum + (m.sitoVivos || 0), 0) / numMuestras;
        const avgSitoMuertos = muestrasSilo.reduce((sum, m) => sum + (m.sitoMuertos || 0), 0) / numMuestras;
        const avgStegVivos = muestrasSilo.reduce((sum, m) => sum + (m.stegVivos || 0), 0) / numMuestras;
        const avgStegMuertos = muestrasSilo.reduce((sum, m) => sum + (m.stegMuertos || 0), 0) / numMuestras;
        const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
        
        // Sum the averages (each silo contributes its average once)
        pestBreakdown.trib.vivos += Math.round(avgTribVivos);
        pestBreakdown.trib.muertos += Math.round(avgTribMuertos);
        pestBreakdown.rhyz.vivos += Math.round(avgRhyzVivos);
        pestBreakdown.rhyz.muertos += Math.round(avgRhyzMuertos);
        pestBreakdown.chry.vivos += Math.round(avgChryVivos);
        pestBreakdown.chry.muertos += Math.round(avgChryMuertos);
        pestBreakdown.sito.vivos += Math.round(avgSitoVivos);
        pestBreakdown.sito.muertos += Math.round(avgSitoMuertos);
        pestBreakdown.steg.vivos += Math.round(avgStegVivos);
        pestBreakdown.steg.muertos += Math.round(avgStegMuertos);
        pestBreakdown.piojillo += Math.round(avgPiojillo);
      });

      muestreo.muestras.forEach(m => {
        if (m.silo) {
          // Only store once per silo (all muestras in same silo have same values)
          if (!siloAcidoUrico.has(m.silo) && m.acidoUrico != null) {
            siloAcidoUrico.set(m.silo, m.acidoUrico);
          }
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
          if (!siloPerdidas.has(m.silo) && m.perdidaEconomicaSemanal != null) {
            siloPerdidas.set(m.silo, m.perdidaEconomicaSemanal);
          }
          
          // Calculate averages for gorgojos vivos and piojillo
          if (!siloGorgojosVivos.has(m.silo)) {
            const muestrasSilo = siloGroups[m.silo] || [];
            const numMuestras = muestrasSilo.length || 1;
            const avgGorgojosVivos = muestrasSilo.reduce((sum, m) => {
              return sum +
                (m.tribVivos || 0) +
                (m.rhyzVivos || 0) +
                (m.chryVivos || 0) +
                (m.sitoVivos || 0) +
                (m.stegVivos || 0);
            }, 0) / numMuestras;
            siloGorgojosVivos.set(m.silo, Math.round(avgGorgojosVivos));
          }
          if (!siloPiojillo.has(m.silo)) {
            const muestrasSilo = siloGroups[m.silo] || [];
            const numMuestras = muestrasSilo.length || 1;
            const avgPiojillo = muestrasSilo.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
            siloPiojillo.set(m.silo, Math.round(avgPiojillo));
          }
        }
      });

      // Sum values from all unique silos (this matches AdminMonitoreoGranosAP calculation)
      totalGorgojosVivos += Array.from(siloGorgojosVivos.values()).reduce((sum, val) => sum + val, 0);
      totalPiojillo += Array.from(siloPiojillo.values()).reduce((sum, val) => sum + val, 0);
      acidoUrico += Array.from(siloAcidoUrico.values()).reduce((sum, val) => sum + val, 0);
      totalDanoGorgojosAdultosKg += Array.from(siloDanoAdultos.values()).reduce((sum, val) => sum + val, 0);
      totalDanoGorgojosTotalKg += Array.from(siloDanoTotal.values()).reduce((sum, val) => sum + val, 0);
      totalDanoPiojilloKg += Array.from(siloDanoPiojillo.values()).reduce((sum, val) => sum + val, 0);
      totalDanoTotalPlagaKg += Array.from(siloDanoTotalPlaga.values()).reduce((sum, val) => sum + val, 0);
      totalPerdidaEconomicaAcumulada += Array.from(siloPerdidas.values()).reduce((sum, val) => sum + val, 0);
    });

    // Pest type data - now calculated from individual muestras
    const pestTypeData = [
      { name: 'Tribolium', value: pestBreakdown.trib.vivos + pestBreakdown.trib.muertos },
      { name: 'Rhyzoperta', value: pestBreakdown.rhyz.vivos + pestBreakdown.rhyz.muertos },
      { name: 'Cryptolestes', value: pestBreakdown.chry.vivos + pestBreakdown.chry.muertos },
      { name: 'Sitophilus', value: pestBreakdown.sito.vivos + pestBreakdown.sito.muertos },
      { name: 'Stegobium', value: pestBreakdown.steg.vivos + pestBreakdown.steg.muertos },
      { name: 'Piojillo', value: pestBreakdown.piojillo },
    ].filter(item => item.value > 0);

    // Dead vs Live comparison - now calculated from individual muestras (gorgojos only, not piojillo)
    const totalVivos = pestBreakdown.trib.vivos + pestBreakdown.rhyz.vivos + 
                      pestBreakdown.chry.vivos + pestBreakdown.sito.vivos + pestBreakdown.steg.vivos;
    const totalMuertos = pestBreakdown.trib.muertos + pestBreakdown.rhyz.muertos + 
                        pestBreakdown.chry.muertos + pestBreakdown.sito.muertos + pestBreakdown.steg.muertos;
    
    const deadVsLiveData = [
      { name: 'Vivos', value: totalVivos },
      { name: 'Muertos', value: totalMuertos },
    ].filter(item => item.value > 0);

    // Detailed pest breakdown
    const detailedPestData = [
      { pest: 'Tribolium', vivos: pestBreakdown.trib.vivos, muertos: pestBreakdown.trib.muertos },
      { pest: 'Rhyzoperta', vivos: pestBreakdown.rhyz.vivos, muertos: pestBreakdown.rhyz.muertos },
      { pest: 'Cryptolestes', vivos: pestBreakdown.chry.vivos, muertos: pestBreakdown.chry.muertos },
      { pest: 'Sitophilus', vivos: pestBreakdown.sito.vivos, muertos: pestBreakdown.sito.muertos },
      { pest: 'Stegobium', vivos: pestBreakdown.steg.vivos, muertos: pestBreakdown.steg.muertos },
    ].filter(item => item.vivos > 0 || item.muertos > 0);

    // Risk level distribution - count unique muestreos
    const uniqueMuestreos = new Set(historialConBatch.map(h => h.muestreoId));
    const riskDistribution = {
      bajo: 0,
      medio: 0,
      alto: 0,
      critico: 0,
    };

    // Note: Risk level would need to be calculated from muestreos or inferred from acido úrico
    // For now, we'll use acido úrico levels to infer risk
    batchArray.forEach(batch => {
      if (batch.acidoUrico <= 5) {
        riskDistribution.bajo++;
      } else if (batch.acidoUrico <= 10) {
        riskDistribution.medio++;
      } else if (batch.acidoUrico <= 15) {
        riskDistribution.alto++;
      } else {
        riskDistribution.critico++;
      }
    });

    const riskData = [
      { name: 'Bajo', value: riskDistribution.bajo, color: '#10b981' },
      { name: 'Medio', value: riskDistribution.medio, color: '#f59e0b' },
      { name: 'Alto', value: riskDistribution.alto, color: '#ef4444' },
      { name: 'Crítico', value: riskDistribution.critico, color: '#dc2626' },
    ].filter(item => item.value > 0);

    // Average insects per batch
    const avgInsectsPerBatch = batchArray.length > 0 
      ? (totalGorgojosVivos + totalPiojillo) / batchArray.length 
      : 0;

    // Calculate Ácido Úrico status distribution from batches
    const acidoUricoStatus = {
      tolerable: 0,      // 0-5 mg/100g
      altamentePeligroso: 0, // 5-10 mg/100g
      critico: 0,        // >10 mg/100g
    };

    batchArray.forEach(batch => {
      if (batch.acidoUrico <= 5) {
        acidoUricoStatus.tolerable++;
      } else if (batch.acidoUrico <= 10) {
        acidoUricoStatus.altamentePeligroso++;
      } else {
        acidoUricoStatus.critico++;
      }
    });

    const acidoUricoStatusData = [
      { name: 'Tolerable', value: acidoUricoStatus.tolerable, color: '#10b981' },
      { name: 'Altamente Peligroso', value: acidoUricoStatus.altamentePeligroso, color: '#f59e0b' },
      { name: 'Crítico', value: acidoUricoStatus.critico, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Group batches by current silo and sum accumulated values
    const siloDataMap: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    batchArray.forEach(batch => {
      if (batch.batch?.siloActual) {
        const siloKey = `AP-${batch.batch.siloActual.toString().padStart(2, '0')}`;
        if (!siloDataMap[siloKey]) {
          siloDataMap[siloKey] = { gorgojosVivos: 0, piojillo: 0 };
        }
        siloDataMap[siloKey].gorgojosVivos += batch.gorgojosVivos || 0;
        siloDataMap[siloKey].piojillo += batch.piojillo || 0;
      }
    });

    // Convert to array and sort by silo number
    const siloDataArray = Object.entries(siloDataMap)
      .map(([silo, data]) => ({
        silo,
        gorgojosVivos: data.gorgojosVivos,
        piojillo: data.piojillo,
      }))
      .sort((a, b) => {
        const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    return {
      monthlyData: monthlyArray,
      batchData: batchArray, // Changed from siloData to batchData
      siloData: siloDataArray, // Data grouped by current silo
      grainData: grainArray,
      plagaTotalPorGranoData,
      totals: {
        gorgojosVivos: totalGorgojosVivos,
        piojillo: totalPiojillo,
      },
      damageTotals: {
        danoGorgojosAdultosKg: totalDanoGorgojosAdultosKg,
        danoGorgojosTotalKg: totalDanoGorgojosTotalKg,
        danoPiojilloKg: totalDanoPiojilloKg,
        danoTotalPlagaKg: totalDanoTotalPlagaKg,
        perdidaEconomicaAcumulada: totalPerdidaEconomicaAcumulada, // Changed from perdidaEconomicaSemanal
      },
      pestTypeData,
      deadVsLiveData,
      detailedPestData,
      riskData,
      avgInsectsPerBatch: avgInsectsPerBatch, // Changed from avgInsectsPerReport
      totalBatches: batchArray.length, // Changed from totalReports
      acidoUrico,
      acidoUricoStatusData,
    };
  }, [historialFiltrado, historialLoading, batches, variedadesGrano, reports2025]);

  // Calculate Ácido Úrico data by silo (for the new tab)
  const acidoUricoSiloData = useMemo(() => {
    if (historialLoading || historialFiltrado.length === 0) {
      return {
        silosData: [],
        chartData: [],
        alertaDistributionData: [],
        silosExcedidos: [],
        silosModeradamente: [],
        totalSilosConGrano: 0,
      };
    }

    // Get all silos (30 silos from AP-01 to AP-30)
    const silosData: Array<{
      silo: string;
      grano: string;
      tons: number;
      diasAlmacenados: number;
      acidoUrico: number;
      alerta: 'Tolerable' | 'Moderadamente Peligroso' | 'Crítico';
    }> = [];

    // Create a map to aggregate data by silo from historial
    const siloAggregation: Record<string, {
      acidoUrico: number;
      tons: number[];
      tipoGrano: string[];
      fechasSemana: string[];
      entryDates: string[];
    }> = {};

    // Initialize all 30 silos
    for (let i = 1; i <= 30; i++) {
      const siloNum = i.toString().padStart(2, '0');
      const siloKey = `AP-${siloNum}`;
      siloAggregation[siloKey] = {
        acidoUrico: 0,
        tons: [],
        tipoGrano: [],
        fechasSemana: [],
        entryDates: [],
      };
    }

    // Create a map of current batch IDs by silo (only for client's silos)
    const batchesPorSilo = new Map<string, Set<string>>();
    silosDelCliente.forEach(silo => {
      const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
      const batchIds = new Set(silo.batches.map(b => b.id));
      if (batchIds.size > 0) {
        batchesPorSilo.set(siloKey, batchIds);
      }
    });

    // Sum uric acid from historial records, but only for batches currently in each silo
    historialFiltrado.forEach(registro => {
      if (!registro.silo || !registro.batchId) return;
      
      const siloKey = registro.silo;
      const currentBatches = batchesPorSilo.get(siloKey);
      
      // Only include records for batches currently in this silo
      if (currentBatches && currentBatches.has(registro.batchId) && siloAggregation[siloKey]) {
        // Sum uric acid from all muestreos for this silo (only for current batches)
        siloAggregation[siloKey].acidoUrico += registro.acidoUrico || 0;
        
        // Collect tons, grain type, and dates
        if (registro.totalTons) {
          siloAggregation[siloKey].tons.push(registro.totalTons);
        }
        if (registro.tipoGrano) {
          siloAggregation[siloKey].tipoGrano.push(registro.tipoGrano);
        }
        if (registro.fechaSemana) {
          siloAggregation[siloKey].fechasSemana.push(registro.fechaSemana);
        }
      }
    });

    // Get entry dates from batches currently in each silo (only for current batches, only client's silos)
    silosDelCliente.forEach(silo => {
      const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
      const currentBatches = batchesPorSilo.get(siloKey);
      if (currentBatches && siloAggregation[siloKey]) {
        currentBatches.forEach(batchId => {
          const batch = batches.get(batchId);
          if (batch && batch.entryDate) {
            if (!siloAggregation[siloKey].entryDates.includes(batch.entryDate)) {
              siloAggregation[siloKey].entryDates.push(batch.entryDate);
            }
          }
        });
      }
    });

    // Also get entry dates from accumulated2025Data as backup (in case batches map is not updated)
    if (accumulated2025Data && accumulated2025Data.batchData) {
      accumulated2025Data.batchData.forEach(batchInfo => {
        if (batchInfo.batch?.siloActual && batchInfo.batch?.entryDate) {
          const siloNum = batchInfo.batch.siloActual.toString();
          const siloKey = `AP-${siloNum.padStart(2, '0')}`;
          if (siloAggregation[siloKey] && batchInfo.batch.entryDate) {
            // Only add if not already in the array to avoid duplicates
            if (!siloAggregation[siloKey].entryDates.includes(batchInfo.batch.entryDate)) {
              siloAggregation[siloKey].entryDates.push(batchInfo.batch.entryDate);
            }
          }
        }
      });
    }

    // Process each silo
    Object.entries(siloAggregation).forEach(([siloKey, data]) => {
      if (data.acidoUrico === 0 && data.tons.length === 0) {
        // Empty silo
        silosData.push({
          silo: siloKey,
          grano: 'Vacío',
          tons: 0,
          diasAlmacenados: 0,
          acidoUrico: 0,
          alerta: 'Tolerable',
        });
      } else {
        // Calculate tons (use maximum from all muestreos)
        const tonsTotal = data.tons.length > 0 ? Math.max(...data.tons) : 0;
        
        // Get earliest entry date from batches currently in this silo
        const entryDates = data.entryDates
          .map(d => {
            try {
              return new Date(d).getTime();
            } catch {
              return null;
            }
          })
          .filter((t): t is number => t !== null && !isNaN(t));
        const muestreoFechas = data.fechasSemana
          .map(d => {
            try {
              return new Date(d).getTime();
            } catch {
              return null;
            }
          })
          .filter((t): t is number => t !== null && !isNaN(t));
        
        const earliestEntry = entryDates.length > 0 ? new Date(Math.min(...entryDates)) : null;
        const latestMuestreo = muestreoFechas.length > 0 ? new Date(Math.max(...muestreoFechas)) : null;
        
        let diasAlmacenados = 0;
        if (earliestEntry && latestMuestreo) {
          const diffTime = latestMuestreo.getTime() - earliestEntry.getTime();
          diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else if (earliestEntry) {
          // If we have entry date but no muestreo date, calculate from entry date to today
          const today = new Date();
          const diffTime = today.getTime() - earliestEntry.getTime();
          diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        // Determine alert level based on accumulated uric acid
        let alerta: 'Tolerable' | 'Moderadamente Peligroso' | 'Crítico' = 'Tolerable';
        if (data.acidoUrico > 10) {
          alerta = 'Crítico';
        } else if (data.acidoUrico > 5) {
          alerta = 'Moderadamente Peligroso';
        }

        // Get grain type from current batch in silo (not from historical records)
        const siloNum = parseInt(siloKey.replace('AP-', '')) || 0;
        const siloObj = silosDelCliente.find(s => s.number === siloNum);
        let grano = 'N/A';
        
        if (siloObj && siloObj.batches.length > 0) {
          // Use the grain type from the current batch(es) in the silo
          // Format: "Trigo (Sww)" to match SiloCard format
          const grainTypes = siloObj.batches.map(b => {
            if (b.grainSubtype) {
              return `${b.grainType} (${b.grainSubtype})`;
            }
            return b.grainType;
          });
          // If multiple batches, use the first one (or most common if needed)
          grano = grainTypes[0] || 'N/A';
        } else {
          // Fallback to most common from historical records if no current batch
          const grainTypeCounts: Record<string, number> = {};
          data.tipoGrano.forEach(g => {
            if (g) {
              grainTypeCounts[g] = (grainTypeCounts[g] || 0) + 1;
            }
          });
          const mostCommonGrain = Object.entries(grainTypeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
          grano = mostCommonGrain || 'N/A';
        }

        silosData.push({
          silo: siloKey,
          grano: grano,
          tons: Math.round(tonsTotal * 100) / 100, // Round to 2 decimals
          diasAlmacenados,
          acidoUrico: Math.round(data.acidoUrico * 100) / 100, // Round to 2 decimals - this is the sum of all muestreos
          alerta,
        });
      }
    });

    // Sort by silo number
    silosData.sort((a, b) => {
      const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // Create chart data (only silos with grain, sorted by ácido úrico descending)
    const chartData = silosData
      .filter(s => s.grano !== 'Vacío' && s.acidoUrico > 0)
      .sort((a, b) => b.acidoUrico - a.acidoUrico)
      .map(s => ({
        silo: s.silo,
        acidoUrico: s.acidoUrico,
        alerta: s.alerta,
      }));

    // Count silos by alert level
    const silosConGrano = silosData.filter(s => s.grano !== 'Vacío');
    const alertaCounts = {
      Tolerable: silosConGrano.filter(s => s.alerta === 'Tolerable').length,
      'Moderadamente Peligroso': silosConGrano.filter(s => s.alerta === 'Moderadamente Peligroso').length,
      Crítico: silosConGrano.filter(s => s.alerta === 'Crítico').length,
    };

    const totalSilosConGrano = silosConGrano.length;
    const alertaDistributionData = [
      { name: 'Tolerable', value: alertaCounts.Tolerable, color: '#10b981' },
      { name: 'Moderadamente Peligroso', value: alertaCounts['Moderadamente Peligroso'], color: '#f59e0b' },
      { name: 'Crítico', value: alertaCounts.Crítico, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Get silos that exceed threshold (10 mg/100g)
    const silosExcedidos = silosData
      .filter(s => s.acidoUrico > 10)
      .map(s => s.silo.replace('AP-', ''));

    // Get silos with moderately dangerous levels (5-10 mg/100g)
    const silosModeradamente = silosData
      .filter(s => s.acidoUrico > 5 && s.acidoUrico <= 10)
      .map(s => s.silo.replace('AP-', ''));

    return {
      silosData,
      chartData,
      alertaDistributionData,
      silosExcedidos,
      silosModeradamente,
      totalSilosConGrano,
    };
  }, [historialFiltrado, historialLoading, batches, accumulated2025Data, silosDelCliente]);

  // Calculate Pérdidas Económicas data by silo (for the new tab)
  const perdidasEconomicasSiloData = useMemo(() => {
    if (historialLoading || historialFiltrado.length === 0) {
      return {
        silosData: [],
        chartData: [],
        perdidaDistributionData: [],
        totalSilosConGrano: 0,
        monthlyData: [],
      };
    }

    // Get all silos (30 silos from AP-01 to AP-30)
    const silosData: Array<{
      silo: string;
      grano: string;
      tons: number;
      diasAlmacenados: number;
      perdidaEconomicaAcumulada: number;
      danoTotalPlagaKg: number;
      danoGorgojosAdultosKg: number;
      danoGorgojosTotalKg: number;
      danoPiojilloKg: number;
      nivelPerdida: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico';
    }> = [];

    // Create a map to aggregate data by silo from historial
    const siloAggregation: Record<string, {
      perdidaEconomicaAcumulada: number;
      danoTotalPlagaKg: number;
      danoGorgojosAdultosKg: number;
      danoGorgojosTotalKg: number;
      danoPiojilloKg: number;
      tons: number[];
      tipoGrano: string[];
      fechasSemana: string[];
      entryDates: string[];
    }> = {};

    // Initialize all 30 silos
    for (let i = 1; i <= 30; i++) {
      const siloNum = i.toString().padStart(2, '0');
      const siloKey = `AP-${siloNum}`;
      siloAggregation[siloKey] = {
        perdidaEconomicaAcumulada: 0,
        danoTotalPlagaKg: 0,
        danoGorgojosAdultosKg: 0,
        danoGorgojosTotalKg: 0,
        danoPiojilloKg: 0,
        tons: [],
        tipoGrano: [],
        fechasSemana: [],
        entryDates: [],
      };
    }

    // Create a map of current batch IDs by silo
    const batchesPorSilo = new Map<string, Set<string>>();
    silos.forEach(silo => {
      const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
      const batchIds = new Set(silo.batches.map(b => b.id));
      if (batchIds.size > 0) {
        batchesPorSilo.set(siloKey, batchIds);
      }
    });

    // Sum economic loss and damage from historial records, but only for batches currently in each silo
    historial.forEach(registro => {
      if (!registro.silo || !registro.batchId) return;
      
      const siloKey = registro.silo;
      const currentBatches = batchesPorSilo.get(siloKey);
      
      // Only include records for batches currently in this silo
      if (currentBatches && currentBatches.has(registro.batchId) && siloAggregation[siloKey]) {
        // Sum economic loss and damage from all muestreos for this silo (only for current batches)
        siloAggregation[siloKey].perdidaEconomicaAcumulada += registro.perdidaEconomicaSemanal || 0;
        siloAggregation[siloKey].danoTotalPlagaKg += registro.danoTotalPlagaKg || 0;
        siloAggregation[siloKey].danoGorgojosAdultosKg += registro.danoGorgojosAdultosKg || 0;
        siloAggregation[siloKey].danoGorgojosTotalKg += registro.danoGorgojosTotalKg || 0;
        siloAggregation[siloKey].danoPiojilloKg += registro.danoPiojilloKg || 0;
        
        // Collect tons, grain type, and dates
        if (registro.totalTons) {
          siloAggregation[siloKey].tons.push(registro.totalTons);
        }
        if (registro.tipoGrano) {
          siloAggregation[siloKey].tipoGrano.push(registro.tipoGrano);
        }
        if (registro.fechaSemana) {
          siloAggregation[siloKey].fechasSemana.push(registro.fechaSemana);
        }
      }
    });

    // Get entry dates from batches currently in each silo (only for current batches, only client's silos)
    silosDelCliente.forEach(silo => {
      const siloKey = `AP-${silo.number.toString().padStart(2, '0')}`;
      const currentBatches = batchesPorSilo.get(siloKey);
      if (currentBatches && siloAggregation[siloKey]) {
        currentBatches.forEach(batchId => {
          const batch = batches.get(batchId);
          if (batch && batch.entryDate) {
            if (!siloAggregation[siloKey].entryDates.includes(batch.entryDate)) {
              siloAggregation[siloKey].entryDates.push(batch.entryDate);
            }
          }
        });
      }
    });

    // Process each silo
    Object.entries(siloAggregation).forEach(([siloKey, data]) => {
      if (data.perdidaEconomicaAcumulada === 0 && data.danoTotalPlagaKg === 0 && data.tons.length === 0) {
        // Empty silo
        silosData.push({
          silo: siloKey,
          grano: 'Vacío',
          tons: 0,
          diasAlmacenados: 0,
          perdidaEconomicaAcumulada: 0,
          danoTotalPlagaKg: 0,
          danoGorgojosAdultosKg: 0,
          danoGorgojosTotalKg: 0,
          danoPiojilloKg: 0,
          nivelPerdida: 'Bajo',
        });
      } else {
        // Calculate tons (use maximum from all muestreos)
        const tonsTotal = data.tons.length > 0 ? Math.max(...data.tons) : 0;
        
        // Get earliest entry date from batches currently in this silo
        const entryDates = data.entryDates
          .map(d => {
            try {
              return new Date(d).getTime();
            } catch {
              return null;
            }
          })
          .filter((t): t is number => t !== null && !isNaN(t));
        const muestreoFechas = data.fechasSemana
          .map(d => {
            try {
              return new Date(d).getTime();
            } catch {
              return null;
            }
          })
          .filter((t): t is number => t !== null && !isNaN(t));
        
        const earliestEntry = entryDates.length > 0 ? new Date(Math.min(...entryDates)) : null;
        const latestMuestreo = muestreoFechas.length > 0 ? new Date(Math.max(...muestreoFechas)) : null;
        
        let diasAlmacenados = 0;
        if (earliestEntry && latestMuestreo) {
          const diffTime = latestMuestreo.getTime() - earliestEntry.getTime();
          diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        } else if (earliestEntry) {
          const today = new Date();
          const diffTime = today.getTime() - earliestEntry.getTime();
          diasAlmacenados = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        // Determine loss level based on accumulated economic loss
        // Categories: Bajo (0-5K), Moderado (5K-25K), Alto (25K-50K), Crítico (>50K)
        let nivelPerdida: 'Bajo' | 'Moderado' | 'Alto' | 'Crítico' = 'Bajo';
        if (data.perdidaEconomicaAcumulada > 50000) {
          nivelPerdida = 'Crítico';
        } else if (data.perdidaEconomicaAcumulada > 25000) {
          nivelPerdida = 'Alto';
        } else if (data.perdidaEconomicaAcumulada > 5000) {
          nivelPerdida = 'Moderado';
        }

        // Get grain type from current batch in silo (not from historical records)
        const siloNum = parseInt(siloKey.replace('AP-', '')) || 0;
        const siloObj = silosDelCliente.find(s => s.number === siloNum);
        let grano = 'N/A';
        
        if (siloObj && siloObj.batches.length > 0) {
          // Use the grain type from the current batch(es) in the silo
          // Format: "Trigo (Sww)" to match SiloCard format
          const grainTypes = siloObj.batches.map(b => {
            if (b.grainSubtype) {
              return `${b.grainType} (${b.grainSubtype})`;
            }
            return b.grainType;
          });
          // If multiple batches, use the first one (or most common if needed)
          grano = grainTypes[0] || 'N/A';
        } else {
          // Fallback to most common from historical records if no current batch
          const grainTypeCounts: Record<string, number> = {};
          data.tipoGrano.forEach(g => {
            if (g) {
              grainTypeCounts[g] = (grainTypeCounts[g] || 0) + 1;
            }
          });
          const mostCommonGrain = Object.entries(grainTypeCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
          grano = mostCommonGrain || 'N/A';
        }

        silosData.push({
          silo: siloKey,
          grano: grano,
          tons: Math.round(tonsTotal * 100) / 100,
          diasAlmacenados,
          perdidaEconomicaAcumulada: Math.round(data.perdidaEconomicaAcumulada * 100) / 100,
          danoTotalPlagaKg: Math.round(data.danoTotalPlagaKg * 100) / 100,
          danoGorgojosAdultosKg: Math.round(data.danoGorgojosAdultosKg * 100) / 100,
          danoGorgojosTotalKg: Math.round(data.danoGorgojosTotalKg * 100) / 100,
          danoPiojilloKg: Math.round(data.danoPiojilloKg * 100) / 100,
          nivelPerdida,
        });
      }
    });

    // Sort by silo number
    silosData.sort((a, b) => {
      const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // Create chart data (only silos with grain, sorted by economic loss descending)
    const chartData = silosData
      .filter(s => s.grano !== 'Vacío' && s.perdidaEconomicaAcumulada > 0)
      .sort((a, b) => b.perdidaEconomicaAcumulada - a.perdidaEconomicaAcumulada)
      .map(s => ({
        silo: s.silo,
        perdidaEconomicaAcumulada: s.perdidaEconomicaAcumulada,
        nivelPerdida: s.nivelPerdida,
      }));

    // Count silos by loss level
    const silosConGrano = silosData.filter(s => s.grano !== 'Vacío');
    const perdidaCounts = {
      Bajo: silosConGrano.filter(s => s.nivelPerdida === 'Bajo').length,
      Moderado: silosConGrano.filter(s => s.nivelPerdida === 'Moderado').length,
      Alto: silosConGrano.filter(s => s.nivelPerdida === 'Alto').length,
      Crítico: silosConGrano.filter(s => s.nivelPerdida === 'Crítico').length,
    };

    const totalSilosConGrano = silosConGrano.length;
    const perdidaDistributionData = [
      { name: 'Bajo', value: perdidaCounts.Bajo, color: '#10b981' },
      { name: 'Moderado', value: perdidaCounts.Moderado, color: '#f59e0b' },
      { name: 'Alto', value: perdidaCounts.Alto, color: '#ef4444' },
      { name: 'Crítico', value: perdidaCounts.Crítico, color: '#dc2626' },
    ].filter(item => item.value > 0);

    // Calculate monthly accumulated economic loss
    // Use muestreos' fechaServicio to group by month (not historial fechaSemana)
    // This ensures we only show months where PDFs were actually uploaded
    const monthlyPerdidaMap: Record<string, number> = {};
    
    // Group historial records by muestreo_id to get total loss per muestreo
    const perdidaPorMuestreo: Record<string, number> = {};
    historial.forEach(registro => {
      if (!registro.muestreoId) return;
      if (!perdidaPorMuestreo[registro.muestreoId]) {
        perdidaPorMuestreo[registro.muestreoId] = 0;
      }
      perdidaPorMuestreo[registro.muestreoId] += registro.perdidaEconomicaSemanal || 0;
    });
    
    // Group pérdida económica by month using fechaServicio from muestreos (already available at component level)
    Object.entries(perdidaPorMuestreo).forEach(([muestreoId, perdidaTotal]) => {
      const muestreo = muestreos.find(m => m.id === muestreoId);
      if (!muestreo || !muestreo.fechaServicio) return;
      
      const fecha = new Date(muestreo.fechaServicio);
      const monthKey = format(fecha, 'yyyy-MM', { locale: es }); // Use yyyy-MM for sorting
      
      if (!monthlyPerdidaMap[monthKey]) {
        monthlyPerdidaMap[monthKey] = 0;
      }
      
      // Sum the total loss for this muestreo to the monthly total
      monthlyPerdidaMap[monthKey] += perdidaTotal;
    });

    // Convert to array and sort by month
    const monthlyDataArray = Object.entries(monthlyPerdidaMap)
      .map(([monthKey, perdidaMensual]) => ({
        mes: format(new Date(monthKey + '-01'), 'MMM yyyy', { locale: es }),
        mesKey: monthKey,
        perdidaMensual: perdidaMensual,
      }))
      .sort((a, b) => a.mesKey.localeCompare(b.mesKey));

    // Calculate cumulative sum across months (running total - accumulated)
    let cumulativeTotal = 0;
    const monthlyData = monthlyDataArray.map(item => {
      cumulativeTotal += item.perdidaMensual;
      return {
        mes: item.mes,
        perdidaEconomicaAcumulada: cumulativeTotal,
      };
    });

    return {
      silosData,
      chartData,
      perdidaDistributionData,
      totalSilosConGrano,
      monthlyData,
    };
  }, [historialFiltrado, historialLoading, batches, accumulated2025Data, muestreosFiltrados]);

  // Calculate Recomendaciones data (combines economic loss, uric acid, and fumigation data)
  const recomendacionesData = useMemo(() => {
    if (historialLoading || historialFiltrado.length === 0) {
      return {
        silosData: [],
      };
    }

    // Get all silos (30 silos from AP-01 to AP-30)
    const silosData: Array<{
      silo: string;
      grano: string;
      perdidaEconomicaAcumulada: number;
      acidoUricoAcumulado: number;
      diasDesdeUltimaFumigacion: number | null;
      recomendacion: string;
    }> = [];

    // Create a map to store fumigation dates by silo (only for "Gas. y Encarpado" service)
    const ultimaFumigacionPorSilo: Record<string, Date> = {};
    
    fumigaciones
      .filter(f => f.servicioId === SERVICIO_GASIFICACION_ID && f.fechaFumigacion)
      .forEach(f => {
        const siloKey = f.silo;
        try {
          const fechaFumigacion = new Date(f.fechaFumigacion);
          if (!isNaN(fechaFumigacion.getTime())) {
            const fechaExistente = ultimaFumigacionPorSilo[siloKey];
            if (!fechaExistente || fechaFumigacion > fechaExistente) {
              ultimaFumigacionPorSilo[siloKey] = fechaFumigacion;
            }
          }
        } catch (error) {
          console.error(`Error parsing fumigation date for silo ${siloKey}:`, error);
        }
      });

    // Combine data from acidoUricoSiloData and perdidasEconomicasSiloData
    // Only include silos that currently have active batches
    acidoUricoSiloData.silosData
      .filter(siloAcidoUrico => silosConBatchesActivos.has(siloAcidoUrico.silo))
      .forEach(siloAcidoUrico => {
      // Find corresponding economic loss data for this silo
      const perdidaData = perdidasEconomicasSiloData.silosData.find(
        s => s.silo === siloAcidoUrico.silo
      );

      // Calculate days since last fumigation
      const ultimaFumigacion = ultimaFumigacionPorSilo[siloAcidoUrico.silo];
      let diasDesdeUltimaFumigacion: number | null = null;
      if (ultimaFumigacion) {
        const hoy = new Date();
        const diffTime = hoy.getTime() - ultimaFumigacion.getTime();
        diasDesdeUltimaFumigacion = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }

      // Calculate recommendation
      const perdidaEconomicaAcumulada = perdidaData?.perdidaEconomicaAcumulada || 0;
      const acidoUricoAcumulado = siloAcidoUrico.acidoUrico || 0;
      let recomendacion = 'Fumigación no necesaria';
      
      // Fumigar if:
      // 1. días > 45 AND pérdidas económicas > 0 AND ácido úrico > 0
      // OR
      // 2. Sin registro de fumigación AND (pérdidas económicas moderadas/altas OR ácido úrico moderado/alto)
      //    - Pérdida económica moderada/alta: > 5,000 Q. (amarillo, naranja, rojo)
      //    - Ácido úrico moderado/alto: > 5 mg/100g (amarillo, rojo)
      const tienePerdidaModeradaAlta = perdidaEconomicaAcumulada > 5000;
      const tieneAcidoUricoModeradoAlto = acidoUricoAcumulado > 5;
      
      if (
        (diasDesdeUltimaFumigacion !== null &&
         diasDesdeUltimaFumigacion > 45 &&
         perdidaEconomicaAcumulada > 0 &&
         acidoUricoAcumulado > 0) ||
        (diasDesdeUltimaFumigacion === null &&
         (tienePerdidaModeradaAlta || tieneAcidoUricoModeradoAlto))
      ) {
        recomendacion = 'Fumigar';
      }

      silosData.push({
        silo: siloAcidoUrico.silo,
        grano: siloAcidoUrico.grano !== 'Vacío' ? siloAcidoUrico.grano : (perdidaData?.grano || 'Vacío'),
        perdidaEconomicaAcumulada,
        acidoUricoAcumulado,
        diasDesdeUltimaFumigacion,
        recomendacion,
      });
    });

    // Sort by silo number
    silosData.sort((a, b) => {
      const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    return {
      silosData,
    };
  }, [historialFiltrado, historialLoading, acidoUricoSiloData, perdidasEconomicasSiloData, fumigaciones, silosConBatchesActivos]);

  // Calculate accumulated data grouped by silo (for the new "Por Silo" tab)
  // IMPORTANT: This groups by the silo where each muestreo was recorded, not by current batch silo
  const accumulatedSiloData = useMemo(() => {
    if (historialLoading || historialFiltrado.length === 0) {
      return null;
    }

    // Filter historial for 2025 data only
    const historial2025 = historialFiltrado.filter(h => {
      if (!h.silo) return false;
      const fecha = new Date(h.fechaSemana);
      return fecha.getFullYear() === 2025;
    });

    if (historial2025.length === 0) {
      return null;
    }

    // Group historial records directly by silo (where each muestreo was recorded)
    const siloDataMap: Record<string, {
      silo: string;
      gorgojosVivos: number;
      piojillo: number;
      acidoUrico: number;
      danoGorgojosAdultosKg: number;
      danoGorgojosTotalKg: number;
      danoPiojilloKg: number;
      danoTotalPlagaKg: number;
      perdidaEconomicaAcumulada: number;
      tons: number[];
      tipoGrano: string[];
      cantidadMuestreos: number;
      uniqueBatches: Set<string>;
    }> = {};

    // Initialize all 30 silos
    for (let i = 1; i <= 30; i++) {
      const siloNum = i.toString().padStart(2, '0');
      const siloKey = `AP-${siloNum}`;
      siloDataMap[siloKey] = {
        silo: siloKey,
        gorgojosVivos: 0,
        piojillo: 0,
        acidoUrico: 0,
        danoGorgojosAdultosKg: 0,
        danoGorgojosTotalKg: 0,
        danoPiojilloKg: 0,
        danoTotalPlagaKg: 0,
        perdidaEconomicaAcumulada: 0,
        tons: [],
        tipoGrano: [],
        cantidadMuestreos: 0,
        uniqueBatches: new Set(),
      };
    }

    // Sum all registros directly by the silo where each muestreo was recorded
    historial2025.forEach(registro => {
      if (!registro.silo) return;
      
      const siloKey = registro.silo;
      if (siloDataMap[siloKey]) {
        siloDataMap[siloKey].gorgojosVivos += registro.totalGorgojosVivos || 0;
        siloDataMap[siloKey].piojillo += registro.totalPiojillo || 0;
        siloDataMap[siloKey].acidoUrico += registro.acidoUrico || 0;
        siloDataMap[siloKey].danoGorgojosAdultosKg += registro.danoGorgojosAdultosKg || 0;
        siloDataMap[siloKey].danoGorgojosTotalKg += registro.danoGorgojosTotalKg || 0;
        siloDataMap[siloKey].danoPiojilloKg += registro.danoPiojilloKg || 0;
        siloDataMap[siloKey].danoTotalPlagaKg += registro.danoTotalPlagaKg || 0;
        siloDataMap[siloKey].perdidaEconomicaAcumulada += registro.perdidaEconomicaSemanal || 0;
        
        if (registro.totalTons) {
          siloDataMap[siloKey].tons.push(registro.totalTons);
        }
        if (registro.tipoGrano) {
          siloDataMap[siloKey].tipoGrano.push(registro.tipoGrano);
        }
        if (registro.muestreoId) {
          siloDataMap[siloKey].cantidadMuestreos += 1;
        }
        if (registro.batchId) {
          siloDataMap[siloKey].uniqueBatches.add(registro.batchId);
        }
      }
    });

    // Convert to array and determine grain type (most common) and calculate tons (max)
    const siloArray = Object.values(siloDataMap)
      .map(siloData => {
        // Determine most common grain type
        const grainTypeCounts: Record<string, number> = {};
        siloData.tipoGrano.forEach(g => {
          if (g) {
            grainTypeCounts[g] = (grainTypeCounts[g] || 0) + 1;
          }
        });
        const mostCommonGrain = Object.entries(grainTypeCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

        // Calculate max tons (as per business rule)
        const maxTons = siloData.tons.length > 0 ? Math.max(...siloData.tons) : 0;

        return {
          silo: siloData.silo,
          gorgojosVivos: siloData.gorgojosVivos,
          piojillo: siloData.piojillo,
          acidoUrico: siloData.acidoUrico,
          danoGorgojosAdultosKg: siloData.danoGorgojosAdultosKg,
          danoGorgojosTotalKg: siloData.danoGorgojosTotalKg,
          danoPiojilloKg: siloData.danoPiojilloKg,
          danoTotalPlagaKg: siloData.danoTotalPlagaKg,
          perdidaEconomicaAcumulada: siloData.perdidaEconomicaAcumulada,
          tons: maxTons,
          tipoGrano: mostCommonGrain,
          cantidadBatches: siloData.uniqueBatches.size,
          cantidadMuestreos: siloData.cantidadMuestreos,
        };
      })
      .sort((a, b) => {
        const numA = parseInt(a.silo.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.silo.replace(/\D/g, '')) || 0;
        return numA - numB;
      });

    // Filter out empty silos for some calculations
    const silosConGrano = siloArray.filter(s => s.cantidadMuestreos > 0);

    // Calculate totals by summing all silos (should match accumulated2025Data totals)
    const totals = {
      gorgojosVivos: siloArray.reduce((sum, s) => sum + s.gorgojosVivos, 0),
      piojillo: siloArray.reduce((sum, s) => sum + s.piojillo, 0),
    };

    const damageTotals = {
      danoGorgojosAdultosKg: siloArray.reduce((sum, s) => sum + s.danoGorgojosAdultosKg, 0),
      danoGorgojosTotalKg: siloArray.reduce((sum, s) => sum + s.danoGorgojosTotalKg, 0),
      danoPiojilloKg: siloArray.reduce((sum, s) => sum + s.danoPiojilloKg, 0),
      danoTotalPlagaKg: siloArray.reduce((sum, s) => sum + s.danoTotalPlagaKg, 0),
      perdidaEconomicaAcumulada: siloArray.reduce((sum, s) => sum + s.perdidaEconomicaAcumulada, 0),
    };

    // Group by grain type (from silos)
    const grainData: Record<string, { gorgojosVivos: number; piojillo: number }> = {};
    silosConGrano.forEach(silo => {
      const tipo = silo.tipoGrano || 'Otro';
      if (!grainData[tipo]) {
        grainData[tipo] = { gorgojosVivos: 0, piojillo: 0 };
      }
      grainData[tipo].gorgojosVivos += silo.gorgojosVivos;
      grainData[tipo].piojillo += silo.piojillo;
    });

    const grainArray = Object.entries(grainData).map(([tipo, data]) => ({
      tipo,
      gorgojosVivos: data.gorgojosVivos,
      piojillo: data.piojillo,
      totalPlaga: data.gorgojosVivos + data.piojillo,
    }));

    // Plaga total por tipo de grano
    const plagaTotalPorGranoData = grainArray
      .filter(item => item.totalPlaga > 0)
      .map((item, index) => {
        const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#a855f7'];
        return {
          name: item.tipo,
          value: item.totalPlaga,
          color: COLORS[index % COLORS.length],
        };
      });

    // Ácido úrico status distribution
    const acidoUricoStatus = {
      tolerable: 0,
      altamentePeligroso: 0,
      critico: 0,
    };

    silosConGrano.forEach(silo => {
      if (silo.acidoUrico <= 5) {
        acidoUricoStatus.tolerable++;
      } else if (silo.acidoUrico <= 10) {
        acidoUricoStatus.altamentePeligroso++;
      } else {
        acidoUricoStatus.critico++;
      }
    });

    const acidoUricoStatusData = [
      { name: 'Tolerable', value: acidoUricoStatus.tolerable, color: '#10b981' },
      { name: 'Altamente Peligroso', value: acidoUricoStatus.altamentePeligroso, color: '#f59e0b' },
      { name: 'Crítico', value: acidoUricoStatus.critico, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Calculate risk distribution from silos (based on accumulated uric acid per silo)
    const riskDistribution = {
      bajo: 0,
      medio: 0,
      alto: 0,
      critico: 0,
    };

    silosConGrano.forEach(silo => {
      if (silo.acidoUrico <= 5) {
        riskDistribution.bajo++;
      } else if (silo.acidoUrico <= 10) {
        riskDistribution.medio++;
      } else if (silo.acidoUrico <= 15) {
        riskDistribution.alto++;
      } else {
        riskDistribution.critico++;
      }
    });

    const riskDataForSilo = [
      { name: 'Bajo', value: riskDistribution.bajo, color: '#10b981' },
      { name: 'Medio', value: riskDistribution.medio, color: '#f59e0b' },
      { name: 'Alto', value: riskDistribution.alto, color: '#ef4444' },
      { name: 'Crítico', value: riskDistribution.critico, color: '#dc2626' },
    ].filter(item => item.value > 0);

    // Use same monthly data and pest breakdown as batch view (they're the same totals)
    // But we need accumulated2025Data to be available for monthlyData, pestTypeData, etc.
    const monthlyDataForSilo = accumulated2025Data?.monthlyData || [];
    const pestTypeDataForSilo = accumulated2025Data?.pestTypeData || [];
    const deadVsLiveDataForSilo = accumulated2025Data?.deadVsLiveData || [];
    const detailedPestDataForSilo = accumulated2025Data?.detailedPestData || [];

    return {
      siloData: siloArray,
      silosConGrano,
      totals,
      damageTotals,
      grainData: grainArray,
      plagaTotalPorGranoData,
      monthlyData: monthlyDataForSilo,
      pestTypeData: pestTypeDataForSilo,
      deadVsLiveData: deadVsLiveDataForSilo,
      detailedPestData: detailedPestDataForSilo,
      riskData: riskDataForSilo,
      acidoUrico: siloArray.reduce((sum, s) => sum + s.acidoUrico, 0),
      acidoUricoStatusData,
      totalSilos: silosConGrano.length,
      avgInsectsPerSilo: silosConGrano.length > 0 
        ? (totals.gorgojosVivos + totals.piojillo) / silosConGrano.length 
        : 0,
    };
  }, [accumulated2025Data]);

  const latestReportDate = latestReportData?.fecha
    ? format(new Date(latestReportData.fecha), 'dd/MM/yyyy')
    : '';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingDown size={32} />
            Análisis de Pérdidas Económicas y de Calidad del Grano Causadas por Plaga
          </h1>
          <p className="text-gray-600 mt-2">
            Análisis de insectos detectados en muestreos de granos. Los datos acumulados se rastrean por grain batch desde su fecha de entrada hasta hoy.
          </p>
          {/* Filtro por cliente - Solo visible para admin */}
          {isAdmin && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Cliente
              </label>
              <select
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todos los clientes</option>
                {clientesUnicos.map(cliente => (
                  <option key={cliente.email} value={cliente.email}>{cliente.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {(loading || historialLoading) ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Loader2 size={48} className="mx-auto text-emerald-600 animate-spin mb-4" />
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        ) : (
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
            <Tabs.List className="flex border-b border-gray-200 mb-6">
              <Tabs.Trigger
                value="ultimo"
                className="px-6 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
              >
                PLAGA ENCONTRADA EN EL ÚLTIMO MUESTREO {latestReportDate && `(${latestReportDate})`}
              </Tabs.Trigger>
              <Tabs.Trigger
                value="acumulado-silo"
                className="px-6 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
              >
                ACUMULADO POR SILO (2025)
              </Tabs.Trigger>
              <Tabs.Trigger
                value="acido-urico"
                className="px-6 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
              >
                ÁCIDO ÚRICO
              </Tabs.Trigger>
              <Tabs.Trigger
                value="perdidas-economicas"
                className="px-6 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
              >
                PÉRDIDAS ECONÓMICAS
              </Tabs.Trigger>
              <Tabs.Trigger
                value="recomendaciones"
                className="px-6 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-600"
              >
                RECOMENDACIONES
              </Tabs.Trigger>
            </Tabs.List>

            {/* Latest Report Tab */}
            <Tabs.Content value="ultimo" className="space-y-6">
              {!latestReportData ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">No hay reportes disponibles</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards - Ácido Úrico and Damage Calculations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Ácido Úrico */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ácido Úrico Semanal</h3>
                      <p className="text-xs text-gray-400 mb-2">Indicador de calidad del grano por contaminación</p>
                      <p className="text-3xl font-bold text-emerald-600">{latestReportData.acidoUrico.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">mg/100g</p>
                    </div>

                    {/* Daño Gorgojos Adultos */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Gorgojos Adultos</h3>
                      <p className="text-xs text-gray-400 mb-2">Grano consumido por gorgojos adultos</p>
                      <p className="text-3xl font-bold text-blue-600">{latestReportData.damageTotals.danoGorgojosAdultosKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>

                    {/* Daño Gorgojos Total */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Gorgojos Total</h3>
                      <p className="text-xs text-gray-400 mb-2">Grano consumido por gorgojos (adultos + larvas)</p>
                      <p className="text-3xl font-bold text-purple-600">{latestReportData.damageTotals.danoGorgojosTotalKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>

                    {/* Daño Piojillo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Piojillo</h3>
                      <p className="text-xs text-gray-400 mb-2">Grano consumido por piojillo (ácaro)</p>
                      <p className="text-3xl font-bold text-amber-600">{latestReportData.damageTotals.danoPiojilloKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>

                    {/* Daño Total Plaga */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Total Plaga</h3>
                      <p className="text-xs text-gray-400 mb-2">Total de grano consumido por todas las plagas</p>
                      <p className="text-3xl font-bold text-red-600">{latestReportData.damageTotals.danoTotalPlagaKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>

                    {/* Pérdida Económica Semanal */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Pérdida Económica Semanal</h3>
                      <p className="text-xs text-gray-400 mb-2">Valor económico del grano perdido esta semana</p>
                      <p className="text-3xl font-bold text-orange-600">Q. {Math.round(latestReportData.damageTotals.perdidaEconomicaSemanal)}</p>
                      <p className="text-xs text-gray-400 mt-1">Quetzales</p>
                    </div>
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gorgojos Vivos by Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos Encontrados En Último Muestreo Semanal
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={latestReportData.siloData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Piojillo by Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Piojillo Encontrado En Último Muestreo Semanal
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={latestReportData.siloData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="piojillo" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Grain Type */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos y Piojillo Encontrados En Último Muestreo
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={latestReportData.grainData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Overall Totals */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos y Piojillo Encontrados En Último Muestreo
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              tipo: 'Total',
                              gorgojosVivos: latestReportData.totals.gorgojosVivos,
                              piojillo: latestReportData.totals.piojillo,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts Row 3 - Pest Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pest Type Distribution Pie */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución por Tipo de Plaga
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={latestReportData.pestTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {latestReportData.pestTypeData.map((entry, index) => {
                              const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                              return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Dead vs Live Pie */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos vs Muertos
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={latestReportData.deadVsLiveData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#06b6d4" />
                            <Cell fill="#64748b" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts Row 4 - Detailed Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Pest Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Desglose Detallado por Tipo de Gorgojo
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={latestReportData.detailedPestData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="pest" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="vivos" fill="#06b6d4" name="Vivos" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="muertos" fill="#64748b" name="Muertos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Location Breakdown */}
                    {latestReportData.locationData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Distribución por Ubicación de Muestra
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={latestReportData.locationData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Charts Row 5 - Plaga Total por Tipo de Grano y Ácido Úrico */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Plaga Total por Tipo de Grano - Pie Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución de Plaga Total por Tipo de Grano
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={latestReportData.plagaTotalPorGranoData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${Math.round(value)} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {latestReportData.plagaTotalPorGranoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${Math.round(value)} insectos`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-sm text-gray-600">
                        <p>Total de plaga = Gorgojos Vivos + Piojillo</p>
                      </div>
                    </div>

                    {/* Ácido Úrico per Silo Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Ácido Úrico por Silo (mg/100g)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={latestReportData.siloData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'mg/100g', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)} mg/100g`} />
                          <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Límite 10 mg/100g", position: "right", offset: 5 }} />
                          <Bar dataKey="acidoUrico" name="Ácido Úrico" radius={[4, 4, 0, 0]}>
                            {latestReportData.siloData.map((entry: any, index: number) => {
                              let color = '#10b981'; // Tolerable (0-5)
                              if (entry.acidoUrico > 10) {
                                color = '#ef4444'; // Crítico (>10)
                              } else if (entry.acidoUrico > 5 && entry.acidoUrico <= 10) {
                                color = '#f59e0b'; // Altamente Peligroso (5-10)
                              }
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Ácido Úrico Status Distribution Pie Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución de Estado por Ácido Úrico
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={latestReportData.acidoUricoStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {latestReportData.acidoUricoStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-sm text-gray-600 space-y-1">
                        <p><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>Tolerable: 0-5 mg/100g</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Altamente Peligroso: 5-10 mg/100g</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Crítico: &gt;10 mg/100g</p>
                      </div>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">INTERPRETACIÓN</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        En el último muestreo se encontraron un total de{' '}
                        <strong>{latestReportData.totals.gorgojosVivos} gorgojos vivos</strong> y{' '}
                        <strong>{latestReportData.totals.piojillo} piojillos</strong>.
                      </p>
                      <p>
                        De este total se encontraron{' '}
                        {latestReportData.grainData.map((g, idx) => (
                          <React.Fragment key={g.tipo}>
                            <strong>{g.gorgojosVivos} gorgojos vivos</strong> y{' '}
                            <strong>{g.piojillo} piojillos</strong> en {g.tipo}
                            {idx < latestReportData.grainData.length - 1 ? ', ' : '.'}
                          </React.Fragment>
                        ))}
                      </p>
                      {latestReportData.thresholds.gorgojos.length > 0 && (
                        <p>
                          Los silos con una cantidad de gorgojos encontrada igual o mayor al umbral permitido (2 gorgojos por kilo) son los siguientes:{' '}
                          <strong>{latestReportData.thresholds.gorgojos.join(', ')}</strong>.
                        </p>
                      )}
                      {latestReportData.thresholds.piojillo.length > 0 && (
                        <p>
                          Los silos con una cantidad de piojillo encontrada mayor al umbral permitido (5 piojillos por kilo) son los siguientes:{' '}
                          <strong>{latestReportData.thresholds.piojillo.join(', ')}</strong>.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </Tabs.Content>

            {/* Accumulated by Silo Tab */}
            <Tabs.Content value="acumulado-silo" className="space-y-6">
              {!accumulatedSiloData ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                  <p className="text-gray-500">No hay datos de silos disponibles</p>
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Silos con Grano</h3>
                      <p className="text-xs text-gray-400 mb-2">Número de silos que actualmente tienen grano almacenado</p>
                      <p className="text-3xl font-bold text-gray-900">{accumulatedSiloData.totalSilos}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Promedio de Insectos por Silo</h3>
                      <p className="text-xs text-gray-400 mb-2">Promedio de insectos (gorgojos + piojillo) encontrados por silo</p>
                      <p className="text-3xl font-bold text-gray-900">{Math.round(accumulatedSiloData.avgInsectsPerSilo)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Insectos</h3>
                      <p className="text-xs text-gray-400 mb-2">Suma total de todos los insectos encontrados (gorgojos + piojillo)</p>
                      <p className="text-3xl font-bold text-gray-900">{accumulatedSiloData.totals.gorgojosVivos + accumulatedSiloData.totals.piojillo}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Ácido Úrico Acumulado</h3>
                      <p className="text-xs text-gray-400 mb-2">Suma total de ácido úrico acumulado en todos los silos</p>
                      <p className="text-3xl font-bold text-emerald-600">{accumulatedSiloData.acidoUrico.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">mg/100g</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Gorgojos Adultos</h3>
                      <p className="text-xs text-gray-400 mb-2">Total de grano consumido por gorgojos adultos</p>
                      <p className="text-3xl font-bold text-blue-600">{accumulatedSiloData.damageTotals.danoGorgojosAdultosKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Gorgojos Total</h3>
                      <p className="text-xs text-gray-400 mb-2">Total de grano consumido por gorgojos (adultos + larvas)</p>
                      <p className="text-3xl font-bold text-purple-600">{accumulatedSiloData.damageTotals.danoGorgojosTotalKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Piojillo</h3>
                      <p className="text-xs text-gray-400 mb-2">Total de grano consumido por piojillo (ácaro)</p>
                      <p className="text-3xl font-bold text-amber-600">{accumulatedSiloData.damageTotals.danoPiojilloKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Total Plaga</h3>
                      <p className="text-xs text-gray-400 mb-2">Total de grano consumido por todas las plagas</p>
                      <p className="text-3xl font-bold text-red-600">{accumulatedSiloData.damageTotals.danoTotalPlagaKg.toFixed(1)}</p>
                      <p className="text-xs text-gray-400 mt-1">kg</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Pérdida Económica Acumulada</h3>
                      <p className="text-xs text-gray-400 mb-2">Valor económico total del grano perdido acumulado</p>
                      <p className="text-3xl font-bold text-orange-600">Q. {Math.round(accumulatedSiloData.damageTotals.perdidaEconomicaAcumulada)}</p>
                      <p className="text-xs text-gray-400 mt-1">Quetzales</p>
                    </div>
                  </div>

                  {/* Monthly Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Gorgojos Vivos y Piojillo Encontrados En 2025
                    </h3>
                      <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={accumulatedSiloData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" />
                        <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Silo Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gorgojos Vivos por Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos Acumulados por Silo (2025)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={accumulatedSiloData.silosConGrano}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Piojillo por Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Piojillo Acumulado por Silo (2025)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={accumulatedSiloData.silosConGrano}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="piojillo" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Grain Type and Totals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* By Grain Type */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos Encontrados Por Grano En 2025
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={accumulatedSiloData.grainData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" />
                          <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Overall Totals */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Total Encontrado 2025
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            {
                              tipo: 'Total',
                              gorgojosVivos: accumulatedSiloData.totals.gorgojosVivos,
                              piojillo: accumulatedSiloData.totals.piojillo,
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="gorgojosVivos" fill="#06b6d4" name="Gorgojos Vivos" />
                          <Bar dataKey="piojillo" fill="#ec4899" name="Piojillo" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts Row 3 - Pest Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pest Type Distribution Pie */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución por Tipo de Plaga (2025)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={accumulatedSiloData.pestTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {accumulatedSiloData.pestTypeData.map((entry, index) => {
                              const COLORS = ['#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                              return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Dead vs Live Pie */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Gorgojos Vivos vs Muertos (2025)
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={accumulatedSiloData.deadVsLiveData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#06b6d4" />
                            <Cell fill="#64748b" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Charts Row 4 - Detailed Breakdown and Risk */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Detailed Pest Breakdown */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Desglose Detallado por Tipo de Gorgojo
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={accumulatedSiloData.detailedPestData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="pest" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'No.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="vivos" fill="#06b6d4" name="Vivos" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="muertos" fill="#64748b" name="Muertos" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Risk Level Distribution */}
                    {accumulatedSiloData.riskData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Distribución por Nivel de Riesgo
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={accumulatedSiloData.riskData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {accumulatedSiloData.riskData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Charts Row 5 - Plaga Total por Tipo de Grano y Ácido Úrico */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Plaga Total por Tipo de Grano - Pie Chart */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribución de Plaga Total por Tipo de Grano (Acumulado 2025)
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={accumulatedSiloData.plagaTotalPorGranoData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${Math.round(value)} (${(percent * 100).toFixed(1)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {accumulatedSiloData.plagaTotalPorGranoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${Math.round(value)} insectos`} />
                        <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                      <div className="mt-4 text-sm text-gray-600">
                        <p>Total de plaga = Gorgojos Vivos + Piojillo (acumulado por silo)</p>
                      </div>
                  </div>

                    {/* Ácido Úrico per Silo Chart */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Ácido Úrico Acumulado por Silo (mg/100g)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={accumulatedSiloData.silosConGrano}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'mg/100g', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(2)} mg/100g`} />
                          <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Límite 10 mg/100g", position: "right", offset: 5 }} />
                          <Bar dataKey="acidoUrico" name="Ácido Úrico" radius={[4, 4, 0, 0]}>
                            {accumulatedSiloData.silosConGrano.map((entry, index) => {
                              let color = '#10b981'; // Tolerable (0-5)
                              if (entry.acidoUrico > 10) {
                                color = '#ef4444'; // Crítico (>10)
                              } else if (entry.acidoUrico > 5 && entry.acidoUrico <= 10) {
                                color = '#f59e0b'; // Altamente Peligroso (5-10)
                              }
                              return <Cell key={`cell-${index}`} fill={color} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    </div>

                  {/* Ácido Úrico Status Distribution */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Distribución de Estado por Ácido Úrico (Por Silo)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                          data={accumulatedSiloData.acidoUricoStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                          {accumulatedSiloData.acidoUricoStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 text-sm text-gray-600 space-y-1">
                        <p><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>Tolerable: 0-5 mg/100g</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Altamente Peligroso: 5-10 mg/100g</p>
                        <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Crítico: &gt;10 mg/100g</p>
                      </div>
                  </div>

                  {/* Damage and Loss Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Damage by Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Daño Total Plaga por Silo (kg)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={accumulatedSiloData.silosConGrano}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'kg', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value: number) => `${value.toFixed(1)} kg`} />
                          <Bar dataKey="danoTotalPlagaKg" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Economic Loss by Silo */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Pérdida Económica Acumulada por Silo (Q.)
                      </h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={accumulatedSiloData.silosConGrano}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis
                            dataKey="silo"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} label={{ value: 'Q.', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value: number) => `Q. ${Math.round(value)}`} />
                          <Bar dataKey="perdidaEconomicaAcumulada" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Interpretation */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">INTERPRETACIÓN</h3>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        Los datos acumulados por silo muestran que en todo el 2025 se han encontrado un total de{' '}
                        <strong>{accumulatedSiloData.totals.gorgojosVivos} gorgojos vivos</strong> y{' '}
                        <strong>{accumulatedSiloData.totals.piojillo} piojillos</strong>.
                      </p>
                      <p>
                        De este total se han encontrado{' '}
                        {accumulatedSiloData.grainData.map((g, idx) => (
                          <React.Fragment key={g.tipo}>
                            <strong>{g.gorgojosVivos} gorgojos vivos</strong> y{' '}
                            <strong>{g.piojillo} piojillos</strong> en {g.tipo}
                            {idx < accumulatedSiloData.grainData.length - 1 ? ', ' : '.'}
                          </React.Fragment>
                        ))}
                      </p>
                      <p>
                        El total de <strong>{accumulatedSiloData.totalSilos} silos</strong> con grano acumulan{' '}
                        <strong>Q. {Math.round(accumulatedSiloData.damageTotals.perdidaEconomicaAcumulada)}</strong> en pérdida económica.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        * Los datos están agrupados por silo actual y acumulan todos los batches que están actualmente en cada silo. 
                        Los valores incluyen todos los muestreos realizados desde la entrada de cada batch hasta hoy.
                      </p>
          </div>
        </div>
                </>
              )}
            </Tabs.Content>

            {/* Ácido Úrico Tab */}
            <Tabs.Content value="acido-urico" className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Ácido Úrico Total Acumulado</h3>
                  <p className="text-xs text-gray-400 mb-2">Suma de ácido úrico en todos los silos</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {acidoUricoSiloData.silosData.reduce((sum, s) => sum + (s.acidoUrico || 0), 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">mg/100g</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Silos con Grano</h3>
                  <p className="text-xs text-gray-400 mb-2">Número de silos con grano almacenado</p>
                  <p className="text-3xl font-bold text-gray-900">{acidoUricoSiloData.totalSilosConGrano}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Silos en Estado Crítico</h3>
                  <p className="text-xs text-gray-400 mb-2">Silos con ácido úrico &gt;10 mg/100g</p>
                  <p className="text-3xl font-bold text-red-600">{acidoUricoSiloData.silosExcedidos.length}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ácido Úrico Acumulado Por Silo (mg/100g)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grano</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tons</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Días Almac.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ácido Úrico (mg/100g)</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alerta Calidad Grano</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {acidoUricoSiloData.silosData.map((silo) => (
                        <tr key={silo.silo} className={silo.grano === 'Vacío' ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{silo.silo}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{silo.grano}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {silo.grano === 'Vacío' ? '-' : silo.tons.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {silo.grano === 'Vacío' ? '-' : silo.diasAlmacenados}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : silo.acidoUrico.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {silo.grano === 'Vacío' ? (
                              <span className="text-sm text-gray-400">-</span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                silo.alerta === 'Crítico' 
                                  ? 'bg-red-100 text-red-800' 
                                  : silo.alerta === 'Moderadamente Peligroso'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {silo.alerta}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  No. de Silos Según Calidad del Grano (Ácido Úrico)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={acidoUricoSiloData.alertaDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${value} silos (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {acidoUricoSiloData.alertaDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Silos con Grano Actual Acumulando Mayor Cantidad de Ácido Úrico (mg/100g)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={acidoUricoSiloData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="silo" 
                      tick={{ fontSize: 12 }} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      label={{ value: 'mg/100g', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip formatter={(value: number) => `${value.toFixed(2)} mg/100g`} />
                    <ReferenceLine y={10} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Límite 10 mg/100g", position: "right", offset: 5 }} />
                    <Bar dataKey="acidoUrico" radius={[4, 4, 0, 0]}>
                      {acidoUricoSiloData.chartData.map((entry, index) => {
                        let color = '#10b981'; // Tolerable (0-5)
                        if (entry.alerta === 'Crítico') {
                          color = '#ef4444'; // Crítico (>10)
                        } else if (entry.alerta === 'Moderadamente Peligroso') {
                          color = '#f59e0b'; // Moderadamente Peligroso (5-10)
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Interpretation */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">INTERPRETACIÓN</h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <p>
                    Teniendo en cuenta los niveles máximos internacionales aceptados de ácido úrico para consumo humano (10 mg/100g), se observa lo siguiente:
                  </p>
                  {acidoUricoSiloData.silosModeradamente.length > 0 && (
                    <p>
                      • Los siguientes silos han alcanzado niveles <strong>moderadamente peligrosos</strong>: {acidoUricoSiloData.silosModeradamente.join(', ')}.
                    </p>
                  )}
                  {acidoUricoSiloData.silosExcedidos.length > 0 && (
                    <p>
                      • Los siguientes silos han superado el umbral de ácido úrico permitido para consumo humano: <strong>{acidoUricoSiloData.silosExcedidos.join(', ')}</strong>.
                    </p>
                  )}
                  {acidoUricoSiloData.silosModeradamente.length === 0 && acidoUricoSiloData.silosExcedidos.length === 0 && (
                    <p>
                      • Todos los silos con grano se encuentran dentro de los niveles tolerables de ácido úrico (≤10 mg/100g).
                    </p>
                  )}
                </div>
              </div>
            </Tabs.Content>

            {/* Pérdidas Económicas Tab */}
            <Tabs.Content value="perdidas-economicas" className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Pérdida Económica Total</h3>
                  <p className="text-xs text-gray-400 mb-2">Pérdida económica acumulada en todos los silos</p>
                  <p className="text-3xl font-bold text-orange-600">
                    Q. {Math.round(perdidasEconomicasSiloData.silosData.reduce((sum, s) => sum + (s.perdidaEconomicaAcumulada || 0), 0)).toLocaleString('es-GT')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Quetzales</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Daño Total Plaga</h3>
                  <p className="text-xs text-gray-400 mb-2">Total de grano consumido por todas las plagas</p>
                  <p className="text-3xl font-bold text-red-600">
                    {perdidasEconomicasSiloData.silosData.reduce((sum, s) => sum + (s.danoTotalPlagaKg || 0), 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">kg</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Silos con Grano</h3>
                  <p className="text-xs text-gray-400 mb-2">Número de silos con grano almacenado</p>
                  <p className="text-3xl font-bold text-gray-900">{perdidasEconomicasSiloData.totalSilosConGrano}</p>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Pérdidas Económicas Acumuladas Por Silo (Q.)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grano</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tons</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Días Almac.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daño Total Plaga (kg)
                          <div className="text-xs font-normal text-gray-400 mt-1">Cantidad de grano consumido por plaga</div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daño Gorgojos Adultos (kg)
                          <div className="text-xs font-normal text-gray-400 mt-1">Grano consumido por gorgojos adultos</div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daño Gorgojos Total (kg)
                          <div className="text-xs font-normal text-gray-400 mt-1">Grano consumido por todos los gorgojos</div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Daño Piojillo (kg)
                          <div className="text-xs font-normal text-gray-400 mt-1">Grano consumido por piojillo (ácaro)</div>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pérdida Económica (Q.)
                          <div className="text-xs font-normal text-gray-400 mt-1">Valor económico del grano perdido</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {perdidasEconomicasSiloData.silosData.map((silo) => (
                        <tr key={silo.silo} className={silo.grano === 'Vacío' ? 'bg-gray-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{silo.silo}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{silo.grano}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {silo.grano === 'Vacío' ? '-' : silo.tons.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {silo.grano === 'Vacío' ? '-' : silo.diasAlmacenados}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : silo.danoTotalPlagaKg.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : silo.danoGorgojosAdultosKg.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : silo.danoGorgojosTotalKg.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : silo.danoPiojilloKg.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 font-medium">
                            {silo.grano === 'Vacío' ? '-' : `Q. ${Math.round(silo.perdidaEconomicaAcumulada).toLocaleString('es-GT')}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  No. de Silos Según Nivel de Pérdida Económica
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={perdidasEconomicasSiloData.perdidaDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${value} silos (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {perdidasEconomicasSiloData.perdidaDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>Bajo: 0-5,000 Q.</p>
                  <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>Moderado: 5,000-25,000 Q.</p>
                  <p><span className="inline-block w-3 h-3 rounded-full bg-orange-500 mr-2"></span>Alto: 25,000-50,000 Q.</p>
                  <p><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>Crítico: &gt;50,000 Q.</p>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Silos con Grano Actual Acumulando Mayor Pérdida Económica (Q.)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={perdidasEconomicasSiloData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="silo" 
                      tick={{ fontSize: 12 }} 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      label={{ value: 'Q.', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip formatter={(value: number) => `Q. ${Math.round(value).toLocaleString('es-GT')}`} />
                    <Bar dataKey="perdidaEconomicaAcumulada" radius={[4, 4, 0, 0]}>
                      {perdidasEconomicasSiloData.chartData.map((entry, index) => {
                        let color = '#10b981'; // Bajo (0-5K)
                        if (entry.nivelPerdida === 'Crítico') {
                          color = '#dc2626'; // Crítico (>50K)
                        } else if (entry.nivelPerdida === 'Alto') {
                          color = '#ef4444'; // Alto (25K-50K)
                        } else if (entry.nivelPerdida === 'Moderado') {
                          color = '#f59e0b'; // Moderado (5K-25K)
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Interpretation */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">INTERPRETACIÓN</h3>
                <div className="text-sm text-gray-700 space-y-3">
                  <div>
                    <p className="font-semibold mb-1">Daño Total Plaga (kg):</p>
                    <p className="text-gray-600">Representa la cantidad total en kilogramos de grano que ha sido consumido por todas las plagas (gorgojos y piojillo) durante el período de almacenamiento en cada silo. Es la suma de todos los daños causados por los diferentes tipos de plagas.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Daño Gorgojos Adultos (kg):</p>
                    <p className="text-gray-600">Cantidad de grano en kilogramos consumido específicamente por los gorgojos adultos. Los gorgojos adultos causan daño directo al alimentarse del grano almacenado.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Daño Gorgojos Total (kg):</p>
                    <p className="text-gray-600">Incluye todo el daño causado por gorgojos, considerando tanto adultos como larvas. Las larvas también consumen grano durante su desarrollo, por lo que este valor es generalmente mayor que el daño de gorgojos adultos únicamente.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Daño Piojillo (kg):</p>
                    <p className="text-gray-600">Cantidad de grano en kilogramos consumido por el piojillo (ácaro). Los ácaros también se alimentan del grano almacenado, causando pérdidas adicionales.</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Pérdida Económica (Q.):</p>
                    <p className="text-gray-600">Valor económico total en Quetzales (Q.) que representa la pérdida financiera debido al grano consumido por las plagas. Se calcula multiplicando los kilogramos de grano dañado por el precio por kilogramo del tipo de grano correspondiente.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-semibold text-gray-900">
                      Total de silos con grano: {perdidasEconomicasSiloData.totalSilosConGrano}
                    </p>
                    <p className="text-gray-600 mt-1">
                      La pérdida económica acumulada muestra el impacto financiero total de las plagas en cada silo desde el inicio del almacenamiento hasta la fecha del último muestreo registrado.
                    </p>
                  </div>
                </div>
              </div>
            </Tabs.Content>

            {/* Recomendaciones Tab */}
            <Tabs.Content value="recomendaciones" className="space-y-6">
              {/* Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen de Recomendaciones por Silo
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Silo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grano</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pérdida Económica Acumulada (Q.)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ácido Úrico Acumulado (mg/100g)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Días desde Última Fumigación
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recomendación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recomendacionesData.silosData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No hay datos para mostrar
                          </td>
                        </tr>
                      ) : (
                        recomendacionesData.silosData.map((silo) => {
                          // Determine color for Pérdida Económica Acumulada
                          // Bajo: 0-5K (verde), Moderado: 5K-25K (amarillo), Alto: 25K-50K (naranja), Crítico: >50K (rojo)
                          let perdidaColor = '';
                          if (silo.grano === 'Vacío' || silo.perdidaEconomicaAcumulada === 0) {
                            perdidaColor = 'text-gray-400';
                          } else if (silo.perdidaEconomicaAcumulada > 50000) {
                            perdidaColor = 'text-red-600 font-semibold';
                          } else if (silo.perdidaEconomicaAcumulada > 25000) {
                            perdidaColor = 'text-orange-600 font-semibold';
                          } else if (silo.perdidaEconomicaAcumulada > 5000) {
                            perdidaColor = 'text-yellow-600 font-semibold';
                          } else {
                            perdidaColor = 'text-green-600';
                          }

                          // Determine color for Ácido Úrico Acumulado
                          // Tolerable: 0-5 (verde), Moderadamente Peligroso: 5-10 (amarillo), Crítico: >10 (rojo)
                          let acidoUricoColor = '';
                          if (silo.grano === 'Vacío' || silo.acidoUricoAcumulado === 0) {
                            acidoUricoColor = 'text-gray-400';
                          } else if (silo.acidoUricoAcumulado > 10) {
                            acidoUricoColor = 'text-red-600 font-semibold';
                          } else if (silo.acidoUricoAcumulado > 5) {
                            acidoUricoColor = 'text-yellow-600 font-semibold';
                          } else {
                            acidoUricoColor = 'text-green-600';
                          }

                          return (
                            <tr key={silo.silo} className={silo.grano === 'Vacío' ? 'bg-gray-50' : ''}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{silo.silo}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{silo.grano}</td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${perdidaColor}`}>
                                {silo.grano === 'Vacío' ? '-' : `Q. ${Math.round(silo.perdidaEconomicaAcumulada).toLocaleString('es-GT')}`}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${acidoUricoColor}`}>
                                {silo.grano === 'Vacío' ? '-' : silo.acidoUricoAcumulado.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                {silo.diasDesdeUltimaFumigacion === null ? (
                                  <span className="text-gray-400">Sin registro</span>
                                ) : (
                                  silo.diasDesdeUltimaFumigacion
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                {silo.recomendacion === 'Fumigar' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Fumigar
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Fumigación no necesaria
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tabs.Content>
          </Tabs.Root>
        )}
      </div>
    </div>
  );
};

export default PerdidaEconomica;
