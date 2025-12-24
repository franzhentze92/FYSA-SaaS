import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface FumigacionRecord {
  id: string;
  formTitle: string;
  dateSubmitted: string;
  fechaServicio: string;
  nombreCliente: string;
  tipoServicio: string;
  productosUtilizados: string;
  dosis: string;
  unidadMedida: string;
  mezclautilizada: string;
  cantidad: number;
  comentarios: string;
  tecnico: string;
  status: string;
  pdfLink: string;
}

const SHEET_ID = '17itEw9iLloWd1CrdWbB1hN901ScoD9NxULJjqPHA7Lg';

// Supabase Edge Function URL - Update with your Supabase project URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_FUNCTION_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/google-sheets-proxy` : '';

// Google Apps Script Web App URL - Alternative option
const APPS_SCRIPT_URL = '';

// Multiple URL options to try (fallbacks)
const getSheetUrls = () => {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
  const pubUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
  
  return [
    csvUrl,
    pubUrl,
    `https://corsproxy.io/?${encodeURIComponent(csvUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(csvUrl)}`,
  ];
};

// Parse CSV string to array of objects
const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n');
  const result: string[][] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    row.push(currentValue.trim());
    
    if (row.length > 1 || row[0] !== '') {
      result.push(row);
    }
  }
  
  return result;
};

export const useGoogleSheets = () => {
  const [data, setData] = useState<FumigacionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // First, try Supabase table (most reliable - manual import)
    try {
      console.log('Checking Supabase table for data...');
      const { data: supabaseData, error: supabaseError } = await supabase
        .from('fumigacion_aprovigra')
        .select('*')
        .order('fecha_servicio', { ascending: false });
      
      if (!supabaseError && supabaseData && supabaseData.length > 0) {
        console.log(`Found ${supabaseData.length} records in Supabase table`);
        const records: FumigacionRecord[] = supabaseData.map(row => ({
          id: row.id,
          formTitle: row.form_title || '',
          dateSubmitted: row.date_submitted || '',
          fechaServicio: row.fecha_servicio || '',
          nombreCliente: row.nombre_cliente || '',
          tipoServicio: row.tipo_servicio || '',
          productosUtilizados: row.productos_utilizados || '',
          dosis: row.dosis || '',
          unidadMedida: row.unidad_medida || '',
          mezclautilizada: row.mezcla_utilizada || '',
          cantidad: parseFloat(row.cantidad) || 0,
          comentarios: row.comentarios || '',
          tecnico: row.tecnico || '',
          status: row.status || '',
          pdfLink: row.pdf_link || '',
        }));
        setData(records);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Supabase table fetch failed:', err);
    }
    
    // Second, try Supabase Edge Function (server-side proxy)
    if (SUPABASE_FUNCTION_URL) {
      try {
        console.log('Fetching from Supabase Edge Function...');
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });
        
        if (response.ok) {
          const json = await response.json();
          
          if (json.success && Array.isArray(json.data)) {
            console.log(`Successfully fetched ${json.data.length} records from Supabase Function`);
            setData(json.data as FumigacionRecord[]);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase Function fetch failed:', err);
      }
    }
    
    // Third, try Google Apps Script if configured
    if (APPS_SCRIPT_URL) {
      try {
        console.log('Fetching from Google Apps Script...');
        const response = await fetch(APPS_SCRIPT_URL);
        
        if (response.ok) {
          const json = await response.json();
          
          if (json.success && Array.isArray(json.data)) {
            console.log(`Successfully fetched ${json.data.length} records from Apps Script`);
            setData(json.data as FumigacionRecord[]);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Apps Script fetch failed:', err);
      }
    }
    
    // Fallback: Try CSV URLs
    const urls = getSheetUrls();
    let lastError: Error | null = null;
    
    for (const url of urls) {
      try {
        console.log('Trying to fetch from:', url.substring(0, 60) + '...');
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv, text/plain, */*',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const csvText = await response.text();
        
        // Validate it looks like CSV data
        if (!csvText || csvText.length < 50 || csvText.includes('<!DOCTYPE') || csvText.includes('<html')) {
          throw new Error('Invalid response - not CSV data');
        }
        
        const rows = parseCSV(csvText);
        
        if (rows.length < 2) {
          setData([]);
          setLoading(false);
          return;
        }
        
        // Skip header row, parse data rows
        const records: FumigacionRecord[] = rows.slice(1).map((row, index) => {
          return {
            id: row[0] || `row-${index}`,
            formTitle: row[6] || row[5] || '',
            dateSubmitted: row[8] || '',
            fechaServicio: row[16] || '',
            nombreCliente: row[17] || '',
            tipoServicio: row[35] || '', // AJ column
            productosUtilizados: row[36] || '', // AK column
            dosis: row[37] || '', // AL column
            unidadMedida: row[38] || '', // AM column
            mezclautilizada: row[39] || '', // AN column
            cantidad: parseFloat(row[40]) || 0, // AO column
            comentarios: row[41] || '', // AP column
            tecnico: row[42] || '', // AQ column
            status: row[14] || '',
            pdfLink: row[15] || '',
          };
        }).filter(record => record.formTitle || record.nombreCliente);
        
        console.log(`Successfully fetched ${records.length} records from CSV`);
        setData(records);
        setLoading(false);
        return;
        
      } catch (err) {
        console.warn('Failed to fetch from URL:', err);
        lastError = err instanceof Error ? err : new Error('Unknown error');
      }
    }
    
    // All URLs failed, use mock data
    console.error('All fetch attempts failed, using mock data');
    setError(lastError?.message || 'Error al cargar datos desde Google Sheets');
    setData(getMockData());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics calculations
  const stats = {
    totalRecords: data.length,
    byServiceType: getGroupedCount(data, 'tipoServicio'),
    byClient: getGroupedCount(data, 'nombreCliente'),
    byTechnician: getGroupedCount(data, 'tecnico'),
    byMonth: getByMonth(data),
    totalQuantity: data.reduce((sum, r) => sum + (r.cantidad || 0), 0),
  };

  return {
    data,
    loading,
    error,
    stats,
    refetch: fetchData,
  };
};

// Helper function to group and count records
function getGroupedCount(data: FumigacionRecord[], field: keyof FumigacionRecord): Record<string, number> {
  return data.reduce((acc, record) => {
    const value = String(record[field] || 'Sin especificar');
    if (value && value !== 'Sin especificar') {
      acc[value] = (acc[value] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

// Helper function to group by month
function getByMonth(data: FumigacionRecord[]): Record<string, number> {
  return data.reduce((acc, record) => {
    if (record.fechaServicio) {
      // Parse date format like "30 Aug 2025" or similar
      try {
        const date = new Date(record.fechaServicio);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          acc[monthKey] = (acc[monthKey] || 0) + 1;
        }
      } catch {
        // Skip invalid dates
      }
    }
    return acc;
  }, {} as Record<string, number>);
}

// Mock data for development/demo when API fails
function getMockData(): FumigacionRecord[] {
  return [
    {
      id: '21570967',
      formTitle: 'Aspersión en banda - Molino Excelsior Quetzaltenango',
      dateSubmitted: '2025-09-03',
      fechaServicio: '30 Aug 2025',
      nombreCliente: 'Molino Excelsior Quetzaltenango / Molinos Modernos, S.A',
      tipoServicio: 'Aspersión en banda',
      productosUtilizados: 'Jupiter 12C',
      dosis: '22',
      unidadMedida: 'ml/Ton',
      mezclautilizada: 'Agua',
      cantidad: 806.58,
      comentarios: 'Aspersión en banda de 806.580 T.M de maíz',
      tecnico: 'Esvin Sosa',
      status: 'Complete',
      pdfLink: 'https://service.formitize.com/file/hash/report/f65e079e3d087c63182d595b501fcffe',
    },
    {
      id: '21559007',
      formTitle: 'Aspersión en banda - Molino Excelsior Quetzaltenango',
      dateSubmitted: '2025-09-03',
      fechaServicio: '24 Aug 2025',
      nombreCliente: 'Molino Excelsior Quetzaltenango / Molinos Modernos, S.A',
      tipoServicio: 'Aspersión en banda',
      productosUtilizados: 'Jupiter 12C',
      dosis: '22',
      unidadMedida: 'ml/Ton',
      mezclautilizada: 'Agua',
      cantidad: 940.935,
      comentarios: 'Aspersión en banda de 940.935 toneladas de maíz',
      tecnico: 'José Ortiz',
      status: 'Complete',
      pdfLink: 'https://service.formitize.com/file/hash/report/2da050dcb2e8716c8eeb909386221ea7',
    },
    {
      id: '21559006',
      formTitle: 'Aspersión en banda - Molino Excelsior Quetzaltenango',
      dateSubmitted: '2025-09-08',
      fechaServicio: '24 Aug 2025',
      nombreCliente: 'Molino Excelsior Quetzaltenango / Molinos Modernos, S.A',
      tipoServicio: 'Aspersión en banda',
      productosUtilizados: 'Jupiter 12C',
      dosis: '22',
      unidadMedida: 'ml/Ton',
      mezclautilizada: 'Agua',
      cantidad: 59.935,
      comentarios: 'Aspersión en banda de 59.935 toneladas de maíz',
      tecnico: 'José Ortiz',
      status: 'Complete',
      pdfLink: 'https://service.formitize.com/file/hash/report/032b67345360a4cbbcacb30118f8dd92',
    },
    {
      id: '21559005',
      formTitle: 'Aspersión en banda - Molino Excelsior Quetzaltenango',
      dateSubmitted: '2025-09-08',
      fechaServicio: '23 Aug 2025',
      nombreCliente: 'Molino Excelsior Quetzaltenango / Molinos Modernos, S.A',
      tipoServicio: 'Aspersión en banda',
      productosUtilizados: 'Jupiter 12C',
      dosis: '22',
      unidadMedida: 'ml/Ton',
      mezclautilizada: 'Agua',
      cantidad: 200,
      comentarios: 'Aspersión en banda de 200 toneladas de maíz',
      tecnico: 'José Ortiz',
      status: 'Complete',
      pdfLink: 'https://service.formitize.com/file/hash/report/c5ba085a03424b1fb0070f53a02dc3e2',
    },
    {
      id: '21500001',
      formTitle: 'Control de Roedores APROVIGRA',
      dateSubmitted: '2025-08-15',
      fechaServicio: '15 Aug 2025',
      nombreCliente: 'APROVIGRA',
      tipoServicio: 'Control de Roedores',
      productosUtilizados: 'Rodenticida',
      dosis: '50',
      unidadMedida: 'g/estación',
      mezclautilizada: 'N/A',
      cantidad: 25,
      comentarios: 'Control mensual de roedores',
      tecnico: 'Carlos Méndez',
      status: 'Complete',
      pdfLink: '',
    },
    {
      id: '21500002',
      formTitle: 'Gasificación y Encarpado APROVIGRA',
      dateSubmitted: '2025-08-20',
      fechaServicio: '20 Aug 2025',
      nombreCliente: 'APROVIGRA',
      tipoServicio: 'Gasificación y Encarpado',
      productosUtilizados: 'Fosfuro de Aluminio',
      dosis: '3',
      unidadMedida: 'tabletas/ton',
      mezclautilizada: 'N/A',
      cantidad: 500,
      comentarios: 'Gasificación de 500 toneladas',
      tecnico: 'Roberto García',
      status: 'Complete',
      pdfLink: '',
    },
    {
      id: '21500003',
      formTitle: 'Muestreo de Granos APROVIGRA',
      dateSubmitted: '2025-08-25',
      fechaServicio: '25 Aug 2025',
      nombreCliente: 'APROVIGRA',
      tipoServicio: 'Muestreo de Granos',
      productosUtilizados: 'N/A',
      dosis: 'N/A',
      unidadMedida: 'N/A',
      mezclautilizada: 'N/A',
      cantidad: 1000,
      comentarios: 'Muestreo de 1000 toneladas de maíz',
      tecnico: 'Luis Hernández',
      status: 'Complete',
      pdfLink: '',
    },
    {
      id: '21500004',
      formTitle: 'Liberación de Encarpado APROVIGRA',
      dateSubmitted: '2025-08-28',
      fechaServicio: '28 Aug 2025',
      nombreCliente: 'APROVIGRA',
      tipoServicio: 'Liberación de Encarpado',
      productosUtilizados: 'N/A',
      dosis: 'N/A',
      unidadMedida: 'N/A',
      mezclautilizada: 'N/A',
      cantidad: 500,
      comentarios: 'Liberación post fumigación',
      tecnico: 'Roberto García',
      status: 'Complete',
      pdfLink: '',
    },
  ];
}

