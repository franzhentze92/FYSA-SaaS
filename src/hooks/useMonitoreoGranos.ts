import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MuestreoGrano, MuestraGrano, ParsedPdfData } from '@/types/monitoreoGranos';
import { FormitizeSubmittedForm } from '@/types/formitize';
import { fetchFormitizeSubmittedForm } from '@/services/formitizeApi';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export const useMonitoreoGranos = () => {
  const [muestreos, setMuestreos] = useState<MuestreoGrano[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);

  // Fetch all reports
  const fetchMuestreos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('muestreos_granos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          console.warn('Table muestreos_granos does not exist. Please run the SQL schema.');
          setMuestreos([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      // Fetch samples for each report
      const muestreosConMuestras = await Promise.all(
        (data || []).map(async (muestreo) => {
          // Try to fetch with all columns, fallback to basic columns if new ones don't exist
          let muestras: any[] | null = null;
          let muestrasError: any = null;
          
          // First try with all columns including new damage calculation columns
          const { data: muestrasFull, error: errorFull } = await supabase
            .from('muestras_granos')
            .select('*')
            .eq('muestreo_id', muestreo.id)
            .order('silo', { ascending: true });

          if (errorFull && (errorFull.message?.includes('column') || errorFull.code === 'PGRST116' || errorFull.code === '42703')) {
            // If error is due to missing columns, try without the new columns
            console.warn('New damage calculation columns not found, fetching without them. Please run the SQL migration: supabase/add-dano-calculations.sql');
            const { data: muestrasBasic, error: errorBasic } = await supabase
              .from('muestras_granos')
              .select('id, muestreo_id, silo, muestra, barco, tipo_grano, fecha_almacenamiento, dias_almacenamiento, piojillo_acaro, trib_vivos, trib_muertos, rhyz_vivos, rhyz_muertos, chry_vivos, chry_muertos, sito_vivos, sito_muertos, steg_vivos, steg_muertos, observaciones, total_insectos_vivos, total_insectos_muertos, acido_urico')
              .eq('muestreo_id', muestreo.id)
              .order('silo', { ascending: true });
            
            if (errorBasic) {
              muestrasError = errorBasic;
            } else {
              muestras = muestrasBasic;
            }
          } else if (errorFull) {
            muestrasError = errorFull;
          } else {
            muestras = muestrasFull;
          }

          if (muestrasError) {
            console.error('Error fetching muestras:', muestrasError);
            // Continue with empty array rather than failing completely
            muestras = [];
          }

          // Ensure muestras is never null
          if (!muestras) {
            muestras = [];
          }

          // Recalculate totals and risk level from actual sample data
          const muestrasData = (muestras || []).map((m: any) => {
            // Recalculate totals from raw pest counts (don't trust stored totals)
            const piojilloAcaro = m.piojillo_acaro || 0;
            const tribVivos = m.trib_vivos || 0;
            const tribMuertos = m.trib_muertos || 0;
            const rhyzVivos = m.rhyz_vivos || 0;
            const rhyzMuertos = m.rhyz_muertos || 0;
            const chryVivos = m.chry_vivos || 0;
            const chryMuertos = m.chry_muertos || 0;
            const sitoVivos = m.sito_vivos || 0;
            const sitoMuertos = m.sito_muertos || 0;
            const stegVivos = m.steg_vivos || 0;
            const stegMuertos = m.steg_muertos || 0;

            // Calculate totals from raw counts
            const totalInsectosVivos = piojilloAcaro + tribVivos + rhyzVivos + chryVivos + sitoVivos + stegVivos;
            const totalInsectosMuertos = tribMuertos + rhyzMuertos + chryMuertos + sitoMuertos + stegMuertos;

            return {
              id: m.id,
              silo: m.silo,
              muestra: m.muestra,
              barco: m.barco,
              tipoGrano: m.tipo_grano,
              fechaAlmacenamiento: m.fecha_almacenamiento,
              diasAlmacenamiento: m.dias_almacenamiento,
              piojilloAcaro,
              tribVivos,
              tribMuertos,
              rhyzVivos,
              rhyzMuertos,
              chryVivos,
              chryMuertos,
              sitoVivos,
              sitoMuertos,
              stegVivos,
              stegMuertos,
              observaciones: parseFloat(m.observaciones) || 0,
              totalInsectosVivos,
              totalInsectosMuertos,
              acidoUrico: m.acido_urico != null ? parseFloat(m.acido_urico) : undefined,
              danoGorgojosAdultosKg: m.dano_gorgojos_adultos_kg != null ? parseFloat(m.dano_gorgojos_adultos_kg) : undefined,
              danoGorgojosTotalKg: m.dano_gorgojos_total_kg != null ? parseFloat(m.dano_gorgojos_total_kg) : undefined,
              danoPiojilloKg: m.dano_piojillo_kg != null ? parseFloat(m.dano_piojillo_kg) : undefined,
              danoTotalPlagaKg: m.dano_total_plaga_kg != null ? parseFloat(m.dano_total_plaga_kg) : undefined,
              perdidaEconomicaSemanal: m.perdida_economica_semanal != null ? parseFloat(m.perdida_economica_semanal) : undefined,
            };
          });

          // Recalculate total insects from recalculated sample data
          const recalculatedTotalInsectos = muestrasData.reduce(
            (sum, m) => sum + m.totalInsectosVivos + m.totalInsectosMuertos,
            0
          );

          // Calculate unique silos for risk calculation
          const uniqueSilos = new Set(muestrasData.map(m => m.silo).filter(Boolean));
          const numSilos = uniqueSilos.size;

          // Recalculate risk level based on average insects per SILO (not per sample)
          let recalculatedNivelRiesgo: 'bajo' | 'medio' | 'alto' | 'critico' = 'bajo';
          const avgInsectosPorSilo = numSilos > 0 ? recalculatedTotalInsectos / numSilos : 0;
          
          // Risk based on average per silo
          if (avgInsectosPorSilo > 10) {
            recalculatedNivelRiesgo = 'critico';
          } else if (avgInsectosPorSilo > 5) {
            recalculatedNivelRiesgo = 'alto';
          } else if (avgInsectosPorSilo > 0) {
            recalculatedNivelRiesgo = 'medio';
          }
          
          // Log if risk level differs from stored value (only in development)
          if (process.env.NODE_ENV === 'development' && recalculatedNivelRiesgo !== muestreo.nivel_riesgo) {
            console.log(`[Risk Mismatch] Report ${muestreo.numero_reporte}: Stored=${muestreo.nivel_riesgo}, Calculated=${recalculatedNivelRiesgo}, AvgPorSilo=${avgInsectosPorSilo.toFixed(2)}`);
          }

          return {
            id: muestreo.id,
            numeroReporte: muestreo.numero_reporte,
            fechaReporte: muestreo.fecha_reporte,
            fechaServicio: muestreo.fecha_servicio,
            cliente: muestreo.cliente,
            totalMuestras: muestrasData.length,
            totalInsectos: recalculatedTotalInsectos,
            nivelRiesgo: recalculatedNivelRiesgo,
            archivoPdf: muestreo.archivo_url ? {
              nombre: muestreo.archivo_nombre,
              url: muestreo.archivo_url,
            } : undefined,
            muestras: muestrasData,
            creadoPor: muestreo.creado_por,
            fechaCreacion: muestreo.created_at,
            fechaModificacion: muestreo.updated_at,
          } as MuestreoGrano;
        })
      );

      setMuestreos(muestreosConMuestras);
    } catch (error) {
      console.error('Error fetching muestreos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMuestreos();
  }, [fetchMuestreos]);

  // Extract text from PDF with position info
  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Sort items by position (top to bottom, left to right)
      const items = textContent.items as any[];
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]; // Y position (inverted)
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.transform[4] - b.transform[4]; // X position
      });
      
      let lastY = 0;
      for (const item of items) {
        const y = item.transform[5];
        // Add newline if Y position changed significantly
        if (lastY && Math.abs(y - lastY) > 5) {
          fullText += '\n';
        }
        fullText += item.str + ' ';
        lastY = y;
      }
      fullText += '\n--- PAGE BREAK ---\n';
    }
    
    return fullText;
  };

  // Parse the table from extracted text
  const parseTableFromText = (text: string): MuestraGrano[] => {
    const muestras: MuestraGrano[] = [];
    const lines = text.split('\n');
    
    // Pattern to match table rows: starts with AP-XX or similar silo code
    const siloPattern = /^(AP-\d+|[A-Z]{1,3}-\d+)/i;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if line starts with a silo code
      const siloMatch = trimmedLine.match(siloPattern);
      if (siloMatch) {
        // Try to parse this as a table row
        const parts = trimmedLine.split(/\s+/);
        
        if (parts.length >= 10) {
          const muestra = parseTableRow(parts);
          if (muestra) {
            muestras.push(muestra);
          }
        }
      }
    }
    
    return muestras;
  };

  // Parse a single table row
  const parseTableRow = (parts: string[]): MuestraGrano | null => {
    try {
      // Expected order based on the table:
      // Silo, Muestra, Barco (may have spaces), Tipo, Fecha (optional), Días, Piojillo, TribV, TribM, RhyzV, RhyzM, ChryV, ChryM, SitoV, SitoM, StegV, StegM, Obs
      
      if (parts.length < 10) {
        console.warn('Row has too few parts:', parts);
        return null;
      }
      
      let idx = 0;
      const silo = parts[idx++] || '';
      
      // Muestra: Arriba or Abajo
      let muestra = parts[idx++] || '';
      if (!['Arriba', 'Abajo', 'arriba', 'abajo'].includes(muestra)) {
        // Might be part of silo name, adjust
        muestra = parts[idx++] || '';
      }
      
      // Barco: might be multiple words
      // Stop when we find something that looks like a grain type OR a date OR a number (days)
      let barco = parts[idx++] || '';
      while (idx < parts.length) {
        const nextPart = parts[idx];
        // Stop conditions (in order of priority):
        // 1. It's a known grain type (most reliable)
        // 2. It's a date format (full date with year) - date comes after grain type, so if we find date, grain type is missing
        // 3. It's a small number (likely days) - days come after date, so if we find days, both grain type and date might be missing
        if (isGrainType(nextPart)) {
          // Definitely a grain type, stop here
          break;
        }
        if (isDateFormat(nextPart)) {
          // Found date before grain type - this shouldn't happen normally, but handle it
          console.warn(`[Row ${silo}] Found date before grain type:`, nextPart);
          break;
        }
        if (!isNaN(parseInt(nextPart)) && parseInt(nextPart) < 1000) {
          // Found number that could be days - stop here
          break;
        }
        // Not a stop condition, add to barco
        barco += ' ' + nextPart;
        idx++;
      }
      
      // Tipo de grano - take next part if it's NOT a date and NOT a number
      let tipoGrano = '';
      if (idx < parts.length) {
        const tipoCandidate = parts[idx];
        // Skip if it's a date or a number (days)
        if (isDateFormat(tipoCandidate) || (!isNaN(parseInt(tipoCandidate)) && parseInt(tipoCandidate) < 1000)) {
          // This is a date or days, skip it
          idx++;
          // Try next one for grain type
          if (idx < parts.length && !isDateFormat(parts[idx]) && isNaN(parseInt(parts[idx]))) {
            tipoGrano = parts[idx++];
          }
        } else {
          // Not a date or number, use it as grain type
          tipoGrano = parts[idx++];
        }
      }
      
      // Fecha de almacenamiento (format: 06Apr2024) - might be missing
      let fechaAlmacenamiento = '';
      let diasAlmacenamiento = 0;
      
      // Check if next part is a date (should come after grain type)
      // Also check if it's a partial date that might be in the next few parts
      if (idx < parts.length) {
        const nextPart = parts[idx];
        console.log(`[Row ${silo}] Checking for date at idx ${idx}:`, nextPart, 'All parts:', parts);
        
        // Check if it's a full date format
        if (isDateFormat(nextPart)) {
          const fechaAlmStr = parts[idx++];
          fechaAlmacenamiento = parseStorageDate(fechaAlmStr);
          console.log(`[Row ${silo}] Found date at idx:`, fechaAlmStr, '->', fechaAlmacenamiento);
        } else {
          // Try to find date in current or next part (might be split)
          // Look ahead a few parts to find date pattern
          let dateFound = false;
          for (let i = 0; i < 3 && (idx + i) < parts.length; i++) {
            const candidate = parts[idx + i];
            console.log(`[Row ${silo}] Checking candidate at idx ${idx + i}:`, candidate, 'isDate?', isDateFormat(candidate));
            if (isDateFormat(candidate)) {
              fechaAlmacenamiento = parseStorageDate(candidate);
              idx += i + 1; // Skip to after the date
              console.log(`[Row ${silo}] Found date (lookahead ${i}):`, candidate, '->', fechaAlmacenamiento);
              dateFound = true;
              break;
            }
          }
          if (!dateFound) {
            console.warn(`[Row ${silo}] No date found in next 3 parts after tipoGrano`);
          }
        }
      } else {
        console.warn(`[Row ${silo}] No more parts available after tipoGrano`);
      }
      
      // Días de almacenamiento - should be a small integer
      if (idx < parts.length) {
        const diasCandidate = parts[idx];
        const parsedDias = parseInt(diasCandidate);
        // Days should be a reasonable number (0-1000)
        if (!isNaN(parsedDias) && parsedDias >= 0 && parsedDias < 1000) {
          diasAlmacenamiento = parsedDias;
          idx++;
        }
      }
      
      // Pest counts (all numeric from here)
      const piojilloAcaro = parseInt(parts[idx++]) || 0;
      const tribVivos = parseInt(parts[idx++]) || 0;
      const tribMuertos = parseInt(parts[idx++]) || 0;
      const rhyzVivos = parseInt(parts[idx++]) || 0;
      const rhyzMuertos = parseInt(parts[idx++]) || 0;
      const chryVivos = parseInt(parts[idx++]) || 0;
      const chryMuertos = parseInt(parts[idx++]) || 0;
      const sitoVivos = parseInt(parts[idx++]) || 0;
      const sitoMuertos = parseInt(parts[idx++]) || 0;
      const stegVivos = parseInt(parts[idx++]) || 0;
      const stegMuertos = parseInt(parts[idx++]) || 0;
      
      // Observations (last column, might have decimals)
      // Should be the very last part after all pest counts
      let observaciones = 0;
      if (idx < parts.length) {
        // Take the last remaining part as observations
        const obsStr = parts[parts.length - 1].replace(',', '.').replace(/[^\d.]/g, '');
        const parsed = parseFloat(obsStr);
        if (!isNaN(parsed)) {
          observaciones = parsed;
        }
      }
      
      // Final cleanup: only move tipoGrano to fecha if it's clearly a date format
      // (This should rarely happen now with improved parsing, but keep as safety check)
      let finalTipoGrano = tipoGrano;
      let finalFechaAlmacenamiento = fechaAlmacenamiento;
      
      // Only move if tipoGrano is a FULL date (with year) AND fechaAlmacenamiento is empty
      if (!finalFechaAlmacenamiento && isDateFormat(tipoGrano)) {
        finalFechaAlmacenamiento = parseStorageDate(tipoGrano);
        finalTipoGrano = ''; // Only clear if we moved it
      }
      
      // Calculate totals
      const totalInsectosVivos = piojilloAcaro + tribVivos + rhyzVivos + chryVivos + sitoVivos + stegVivos;
      const totalInsectosMuertos = tribMuertos + rhyzMuertos + chryMuertos + sitoMuertos + stegMuertos;
      
      const result = {
        id: `temp-${silo}-${muestra}-${Date.now()}`,
        silo,
        muestra,
        barco: barco.trim(),
        tipoGrano: finalTipoGrano,
        fechaAlmacenamiento: finalFechaAlmacenamiento,
        diasAlmacenamiento,
        piojilloAcaro,
        tribVivos,
        tribMuertos,
        rhyzVivos,
        rhyzMuertos,
        chryVivos,
        chryMuertos,
        sitoVivos,
        sitoMuertos,
        stegVivos,
        stegMuertos,
        observaciones,
        totalInsectosVivos,
        totalInsectosMuertos,
      };
      
      console.log(`[Row ${silo}] Final parsed result:`, {
        silo: result.silo,
        tipoGrano: result.tipoGrano,
        fechaAlmacenamiento: result.fechaAlmacenamiento,
        diasAlmacenamiento: result.diasAlmacenamiento,
      });
      
      return result;
    } catch (e) {
      console.warn('Failed to parse row:', parts, e);
      return null;
    }
  };

  // Helper: check if string looks like a grain type
  const isGrainType = (str: string): boolean => {
    if (!str) return false;
    const grainTypes = ['Malta', 'Cprs', 'Cwrs', 'Srw', 'Hrw', 'Maiz', 'Maíz', 'Trigo', 'Soya', 'Sorgo'];
    // Check if it's a known grain type
    if (grainTypes.some(g => str.toLowerCase() === g.toLowerCase())) {
      return true;
    }
    // Also accept short uppercase codes (2-4 letters) that aren't dates
    if (/^[A-Za-z]{2,4}$/.test(str) && !isDateFormat(str)) {
      return true;
    }
    return false;
  };

  // Helper: check if string looks like a date (06Apr2024 format)
  // Must have day, month abbreviation, and 4-digit year
  const isDateFormat = (str: string): boolean => {
    // Full date format: 06Apr2024, 31Mar2024, etc.
    const fullDatePattern = /^\d{1,2}[A-Za-z]{3}\d{4}$/;
    // Also check for date-like patterns that are clearly dates (not grain codes)
    // But exclude things like "31Mar" without year (could be grain code)
    return fullDatePattern.test(str);
  };

  // Helper: parse storage date from format like "06Apr2024"
  const parseStorageDate = (dateStr: string): string => {
    if (!dateStr) return '';
    
    const months: Record<string, string> = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };
    
    // Match date format: 1-2 digits, 3 letters (month), 4 digits (year)
    const match = dateStr.match(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthAbbr = match[2].toLowerCase();
      const month = months[monthAbbr] || '01';
      const year = match[3];
      const result = `${year}-${month}-${day}`;
      console.log('Parsed date:', dateStr, '->', result);
      return result;
    }
    console.warn('Failed to parse date:', dateStr);
    return '';
  };

  // Parse PDF file
  const parsePdf = async (file: File): Promise<ParsedPdfData> => {
    setParsing(true);
    try {
      const text = await extractTextFromPdf(file);
      console.log('Extracted text:', text.substring(0, 2000));
      
      const warnings: string[] = [];
      
      // Extract report number from filename
      const reportNumberMatch = file.name.match(/(\d{8})/);
      const numeroReporte = reportNumberMatch ? reportNumberMatch[1] : '';
      
      // Extract client name from filename or text
      let cliente = '';
      const clienteMatch = file.name.match(/Aprovigra|Molinos\s+Modernos/i) || 
                          text.match(/Aprovigra|Molinos\s+Modernos[^,\n]*/i);
      if (clienteMatch) {
        cliente = clienteMatch[0];
      }
      
      // Try to find client in text
      if (!cliente) {
        const clienteTextMatch = text.match(/Cliente:\s*([^\n]+)/i) ||
                                 text.match(/Empresa:\s*([^\n]+)/i);
        if (clienteTextMatch) {
          cliente = clienteTextMatch[1].trim();
        }
      }
      
      // Try to extract service date (fecha de servicio)
      // Look for patterns like "Fecha de Servicio:", "Fecha Servicio:", "Servicio:", or date patterns near "servicio"
      let fechaServicio = '';
      const fechaServicioPatterns = [
        /Fecha\s+de\s+Servicio[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /Fecha\s+Servicio[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /Servicio[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /Fecha\s+de\s+Servicio[:\s]+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i,
        /(\d{1,2}[A-Za-z]{3}\d{4})/i, // Date format like 25Dec2024
      ];
      
      for (const pattern of fechaServicioPatterns) {
        const match = text.match(pattern);
        if (match) {
          const dateStr = match[1];
          // Try to parse the date
          if (dateStr.includes('/') || dateStr.includes('-')) {
            // Format: DD/MM/YYYY or DD-MM-YYYY
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              fechaServicio = `${year}-${month}-${day}`;
              break;
            }
          } else if (/^\d{1,2}[A-Za-z]{3}\d{4}$/i.test(dateStr)) {
            // Format: 25Dec2024
            fechaServicio = parseStorageDate(dateStr);
            if (fechaServicio) break;
          }
        }
      }
      
      // Parse the table
      const muestras = parseTableFromText(text);
      
      if (muestras.length === 0) {
        warnings.push('No se pudieron extraer filas de la tabla automáticamente.');
        warnings.push('Es posible que el PDF tenga un formato diferente o esté escaneado como imagen.');
      }
      
      // Calculate confidence
      let confidence = 0;
      if (numeroReporte) confidence += 20;
      if (cliente) confidence += 20;
      if (muestras.length > 0) confidence += 60;
      
      if (!cliente) {
        warnings.push('No se detectó el nombre del cliente.');
      }
      if (!numeroReporte) {
        warnings.push('No se detectó el número de reporte.');
      }
      
      return {
        rawText: text,
        extractedData: {
          numeroReporte,
          cliente,
          fechaReporte: new Date().toISOString().split('T')[0],
          fechaServicio: fechaServicio || undefined,
          muestras,
        },
        confidence,
        warnings,
      };
    } catch (error) {
      console.error('Error parsing PDF:', error);
      return {
        rawText: '',
        extractedData: {
          muestras: [],
        },
        confidence: 0,
        warnings: ['Error al procesar el PDF. El archivo puede estar protegido o ser una imagen escaneada.'],
      };
    } finally {
      setParsing(false);
    }
  };

  // Parse Formitize form data
  const parseFormitizeForm = async (formId: number): Promise<ParsedPdfData> => {
    setParsing(true);
    try {
      console.log('Fetching Formitize form:', formId);
      const formData = await fetchFormitizeSubmittedForm(formId, false); // Don't use simple mode
      
      if (!formData || typeof formData === 'number') {
        throw new Error('No se pudo obtener el formulario de Formitize o la respuesta no es válida');
      }

      console.log('Formitize form data:', formData);
      console.log('Form content:', formData.content);
      console.log('All form keys:', Object.keys(formData));
      
      const warnings: string[] = [];
      const muestras: MuestraGrano[] = [];
      
      // Extract basic info
      const numeroReporte = String(formData.submittedFormID || '');
      const cliente = formData.title?.match(/Aprovigra|Molinos\s+Modernos/i)?.[0] || 
                     (formData.content as any)?.nombrecliente || 
                     (formData.content as any)?.cliente || 
                     '';
      
      // Extract table data from form content
      // The table data might be in various formats - check common field names
      const content = formData.content || {};
      
      console.log('Content type:', typeof content);
      console.log('Content keys:', content ? Object.keys(content) : 'null/undefined');
      
      // Try to find table/repeater data
      // Common field names for tables: 'table', 'repeater', 'rows', 'data', 'muestras', 'samples'
      let tableData: any[] = [];
      
      // First, check if content itself is an array
      if (Array.isArray(content)) {
        tableData = content;
        console.log('Content is an array with', tableData.length, 'items');
      } else if (content && typeof content === 'object') {
        // Check for repeater/table fields
        for (const key in content) {
          const value = content[key];
          console.log(`Checking field "${key}":`, typeof value, Array.isArray(value) ? `array[${value.length}]` : '');
          
          if (Array.isArray(value) && value.length > 0) {
            // Check if it looks like table rows
            if (value[0] && typeof value[0] === 'object') {
              tableData = value;
              console.log(`Found table data in field "${key}" with ${tableData.length} rows`);
              break;
            }
          }
        }
        
        // If no array found, check for object with row-like structure
        if (tableData.length === 0) {
          // Look for fields that might contain row data
          const possibleRowFields = Object.keys(content).filter(k => 
            k.toLowerCase().includes('row') || 
            k.toLowerCase().includes('silo') ||
            k.toLowerCase().includes('muestra') ||
            k.toLowerCase().includes('table') ||
            k.toLowerCase().includes('repeater')
          );
          
          console.log('Possible row fields:', possibleRowFields);
          
          if (possibleRowFields.length > 0) {
            // Try to reconstruct rows from individual fields
            // This is a fallback - actual structure depends on form design
            console.warn('No table array found, trying to reconstruct from fields');
          }
        }
      }
      
      // Parse table rows
      if (tableData.length > 0) {
        tableData.forEach((row: any, index: number) => {
          try {
            const muestra: MuestraGrano = {
              id: `formitize-${formId}-${index}`,
              silo: row.silo || row.Silo || row.silo_id || '',
              muestra: row.muestra || row.Muestra || row.sample || row.position || 'Arriba',
              barco: row.barco || row.Barco || row.ship || row.barco_id || '',
              tipoGrano: row.tipoGrano || row['Tipo de grano'] || row.tipo || row.grainType || '',
              fechaAlmacenamiento: row.fechaAlmacenamiento || row['Fecha de almac.'] || row.fecha || row.storageDate || '',
              diasAlmacenamiento: parseInt(row.diasAlmacenamiento || row['Días alm.'] || row.dias || row.days || '0') || 0,
              piojilloAcaro: parseInt(row.piojilloAcaro || row['Piojillo/Ácaro'] || row.piojillo || '0') || 0,
              tribVivos: parseInt(row.tribVivos || row['Trib vivos'] || row.trib_vivos || '0') || 0,
              tribMuertos: parseInt(row.tribMuertos || row['Trib muertos'] || row.trib_muertos || '0') || 0,
              rhyzVivos: parseInt(row.rhyzVivos || row['Rhyz vivos'] || row.rhyz_vivos || '0') || 0,
              rhyzMuertos: parseInt(row.rhyzMuertos || row['Rhyz muertos'] || row.rhyz_muertos || '0') || 0,
              chryVivos: parseInt(row.chryVivos || row['Chry vivos'] || row.chry_vivos || '0') || 0,
              chryMuertos: parseInt(row.chryMuertos || row['Chry muertos'] || row.chry_muertos || '0') || 0,
              sitoVivos: parseInt(row.sitoVivos || row['Sito vivos'] || row.sito_vivos || '0') || 0,
              sitoMuertos: parseInt(row.sitoMuertos || row['Sito muertos'] || row.sito_muertos || '0') || 0,
              stegVivos: parseInt(row.stegVivos || row['Steg vivos'] || row.steg_vivos || '0') || 0,
              stegMuertos: parseInt(row.stegMuertos || row['Steg muertos'] || row.steg_muertos || '0') || 0,
              observaciones: parseFloat(row.observaciones || row.Obs || row.obs || '0') || 0,
              totalInsectosVivos: 0,
              totalInsectosMuertos: 0,
            };
            
            // Calculate totals
            muestra.totalInsectosVivos = muestra.piojilloAcaro + muestra.tribVivos + muestra.rhyzVivos + 
                                         muestra.chryVivos + muestra.sitoVivos + muestra.stegVivos;
            muestra.totalInsectosMuertos = muestra.tribMuertos + muestra.rhyzMuertos + muestra.chryMuertos + 
                                          muestra.sitoMuertos + muestra.stegMuertos;
            
            muestras.push(muestra);
          } catch (e) {
            console.warn('Failed to parse row:', row, e);
          }
        });
      } else {
        warnings.push('No se encontró estructura de tabla en el formulario. Los datos pueden estar en un formato diferente.');
      }
      
      if (muestras.length === 0) {
        warnings.push('No se pudieron extraer muestras del formulario. Verifica la estructura de datos.');
        warnings.push('Revisa la consola del navegador para ver la estructura completa del formulario.');
      }
      
      // Calculate confidence
      let confidence = 0;
      if (numeroReporte) confidence += 20;
      if (cliente) confidence += 20;
      if (muestras.length > 0) confidence += 60;
      
      // Format raw text for display - show the full form structure
      const rawText = JSON.stringify({
        submittedFormID: formData.submittedFormID,
        title: formData.title,
        content: formData.content,
        contentKeys: formData.content ? Object.keys(formData.content) : [],
        allKeys: Object.keys(formData),
      }, null, 2);
      
      return {
        rawText,
        extractedData: {
          numeroReporte,
          cliente,
          fechaReporte: formData.dateSubmitted ? new Date(Number(formData.dateSubmitted) * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          muestras,
        },
        confidence,
        warnings,
      };
    } catch (error) {
      console.error('Error parsing Formitize form:', error);
      return {
        rawText: '',
        extractedData: {
          muestras: [],
        },
        confidence: 0,
        warnings: [error instanceof Error ? error.message : 'Error al obtener el formulario de Formitize'],
      };
    } finally {
      setParsing(false);
    }
  };

  // Save report to Supabase
  const saveMuestreo = async (
    data: {
      numeroReporte: string;
      cliente: string;
      fechaReporte?: string;
      fechaServicio?: string;
      muestras: MuestraGrano[];
    },
    pdfFile?: File,
    originalArchivoPdf?: { nombre: string; url: string }
  ): Promise<string | null> => {
    try {
      let archivoUrl: string | undefined;
      let archivoNombre: string | undefined;

      // Upload PDF if provided
      if (pdfFile) {
        const fileName = `muestreos/${Date.now()}-${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(fileName, pdfFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('documentos')
            .getPublicUrl(fileName);
          archivoUrl = urlData.publicUrl;
          archivoNombre = pdfFile.name;
        }
      } else if (originalArchivoPdf) {
        // Preserve original PDF info if no new file is uploaded
        archivoUrl = originalArchivoPdf.url;
        archivoNombre = originalArchivoPdf.nombre;
      }

      // Calculate totals
      const totalInsectos = data.muestras.reduce(
        (sum, m) => sum + m.totalInsectosVivos + m.totalInsectosMuertos, 0
      );
      
      // Calculate unique silos for risk calculation
      const uniqueSilos = new Set(data.muestras.map(m => m.silo).filter(Boolean));
      const numSilos = uniqueSilos.size;
      
      // Determine risk level based on average insects per SILO (not per sample)
      let nivelRiesgo: 'bajo' | 'medio' | 'alto' | 'critico' = 'bajo';
      const avgInsectosPorSilo = numSilos > 0 ? totalInsectos / numSilos : 0;
      if (avgInsectosPorSilo > 10) nivelRiesgo = 'critico';
      else if (avgInsectosPorSilo > 5) nivelRiesgo = 'alto';
      else if (avgInsectosPorSilo > 0) nivelRiesgo = 'medio';

      // Insert main record
      const { data: insertedMuestreo, error } = await supabase
        .from('muestreos_granos')
        .insert({
          numero_reporte: data.numeroReporte,
          fecha_reporte: data.fechaReporte || null,
          fecha_servicio: data.fechaServicio || null,
          cliente: data.cliente,
          total_muestras: data.muestras.length,
          total_insectos: totalInsectos,
          nivel_riesgo: nivelRiesgo,
          archivo_nombre: archivoNombre,
          archivo_url: archivoUrl,
        } as any)
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
          throw new Error('La tabla no existe. Por favor ejecuta el esquema SQL en Supabase.');
        }
        throw error;
      }

      if (!insertedMuestreo) {
        throw new Error('Error al crear el reporte');
      }

      const muestreoId = insertedMuestreo.id;

      // Insert samples
      if (data.muestras.length > 0) {
        // Group muestras by silo to calculate Ácido Úrico per silo
        const siloGroups: Record<string, typeof data.muestras> = {};
        data.muestras.forEach(m => {
          const silo = m.silo || 'Sin silo';
          if (!siloGroups[silo]) {
            siloGroups[silo] = [];
          }
          siloGroups[silo].push(m);
        });

        // Fetch grain varieties to get costs
        const { data: variedadesData } = await supabase
          .from('variedades_grano')
          .select('*');
        
        const variedades = (variedadesData || []).map((v: any) => ({
          tipoGrano: v.tipo_grano,
          variedad: v.variedad,
          costoPorKg: v.costo_por_kg != null ? parseFloat(v.costo_por_kg) : undefined,
        }));

        // Helper function to get grain cost
        const getGrainCost = (tipoGrano: string): number => {
          // Try to match by full tipoGrano string (e.g., "Cwrs - Trigo")
          const match = variedades.find(v => 
            tipoGrano.includes(v.tipoGrano) || 
            tipoGrano.includes(v.variedad) ||
            (v.variedad && tipoGrano.includes(`${v.variedad} - ${v.tipoGrano}`)) ||
            (v.variedad && tipoGrano.includes(`${v.tipoGrano} - ${v.variedad}`))
          );
          return match?.costoPorKg || 0; // Default to 0 if no cost found
        };

        // Get fechaSemana for batch matching (needed before calculations)
        const fechaSemana = data.fechaServicio ? new Date(data.fechaServicio) : (data.fechaReporte ? new Date(data.fechaReporte) : new Date());

        // Fetch all batches to match with muestras (needed for findBatchForMuestra)
        const { data: batchesData } = await supabase
          .from('grain_batches')
          .select('*');
        
        const allBatches = batchesData || [];

        // Fetch all silos with their names and IDs
        const { data: silosData } = await supabase
          .from('silos')
          .select('id, nombre');
        
        // Fetch barcos to get barco names from barco_id
        const { data: barcosData } = await supabase
          .from('barcos_detalle')
          .select('id, nombre');
        
        const barcosMap = new Map((barcosData || []).map((b: any) => [b.id, b.nombre]));
        
        // Create map from silo name to silo ID
        // Handle variations like "AP-01", "AP-1", "Silo 1", etc.
        const siloNameToIdMap = new Map<string, string>();
        (silosData || []).forEach((silo: any) => {
          if (silo.nombre) {
            // Normalize the name (remove extra spaces, convert to uppercase for matching)
            const normalizedName = silo.nombre.trim().toUpperCase();
            siloNameToIdMap.set(normalizedName, silo.id);
            
            // Also add variations for matching (e.g., "AP-01" matches "AP-1", "Silo 1")
            // Extract number and add variations
            const numMatch = silo.nombre.match(/(\d+)/);
            if (numMatch) {
              const num = numMatch[1];
              siloNameToIdMap.set(`AP-${num.padStart(2, '0')}`, silo.id); // AP-01
              siloNameToIdMap.set(`AP-${num}`, silo.id); // AP-1
              siloNameToIdMap.set(`SILO ${num}`, silo.id); // SILO 1
            }
          }
        });

        // Helper function to get barco name from batch (origin or from barco_id)
        const getBatchBarcoName = (batch: any): string => {
          if (batch.origin) return batch.origin;
          if (batch.barco_id) {
            const barcoNombre = barcosMap.get(batch.barco_id);
            if (barcoNombre) return barcoNombre;
          }
          return '';
        };

        // Helper function to find batch for a silo and muestra
        // Returns batch object with id and quantity, or null if not found
        const findBatchForMuestra = (siloIdentifier: string, barcoNombre: string, tipoGrano: string, fechaMuestreo: Date): { id: string; quantityInTonnes: number } | null => {
          if (!siloIdentifier || siloIdentifier === 'Sin silo') {
            console.log(`findBatchForMuestra: Invalid silo identifier: ${siloIdentifier}`);
            return null;
          }
          
          // Helper to convert quantity to tonnes
          const convertToTonnes = (quantity: number, unit: string): number => {
            if (!quantity) return 0;
            return unit === 'tonnes' ? quantity : quantity / 1000;
          };
          
          // Normalize silo identifier (e.g., "AP-01", "AP-1" -> "AP-01")
          const normalizedSiloName = siloIdentifier.trim().toUpperCase();
          
          // Find silo ID from the silo name
          const siloId = siloNameToIdMap.get(normalizedSiloName);
          
          if (!siloId) {
            console.log(`findBatchForMuestra: Silo "${siloIdentifier}" not found in database. Available silos:`, Array.from(siloNameToIdMap.keys()));
            return null;
          }
          
          console.log(`findBatchForMuestra: Looking for batch in silo "${siloIdentifier}" (ID: ${siloId}), barco: "${barcoNombre}", tipo: "${tipoGrano}"`);
          
          // Find batches that are in this silo (using silo_id)
          const batchesInSilo = allBatches.filter((b: any) => b.silo_id === siloId);
          
          console.log(`findBatchForMuestra: Found ${batchesInSilo.length} batch(es) in silo ${siloId}`);

          // Filter by barco and grain type
          const matchingBatches = batchesInSilo.filter((b: any) => {
            // Check if batch matches barco (origin or from barco_id) - case insensitive partial match
            if (barcoNombre && barcoNombre.trim()) {
              const batchBarcoName = getBatchBarcoName(b);
              const batchBarco = batchBarcoName.toLowerCase().trim();
              const muestraBarco = barcoNombre.toLowerCase().trim();
              
              if (batchBarco && muestraBarco) {
                // Check if either contains the other (for partial matches)
                const matches = batchBarco.includes(muestraBarco) || muestraBarco.includes(batchBarco);
                if (!matches) {
                  console.log(`findBatchForMuestra: Batch ${b.id} barco "${batchBarco}" does not match "${muestraBarco}"`);
                  return false;
                }
              } else if (!batchBarco && muestraBarco) {
                // If batch has no barco name but muestra has one, skip this batch
                console.log(`findBatchForMuestra: Batch ${b.id} has no barco name, but muestra requires "${muestraBarco}"`);
                return false;
              }
            }
            
            // Check if batch matches grain type - case insensitive partial match
            if (tipoGrano && tipoGrano.trim()) {
              const batchGrainType = ((b.grain_subtype || b.grain_type) || '').toLowerCase().trim();
              const muestraGrainType = tipoGrano.toLowerCase().trim();
              
              if (batchGrainType && muestraGrainType) {
                // Try exact match first
                if (batchGrainType === muestraGrainType) {
                  // Exact match, continue
                } else if (batchGrainType.includes(muestraGrainType) || muestraGrainType.includes(batchGrainType)) {
                  // One contains the other, continue
                } else {
                  // Try to match parts (e.g., "Malta - Malta" vs "Malta")
                  const batchParts = batchGrainType.split(/[\s-]+/).filter(p => p.length > 0);
                  const muestraParts = muestraGrainType.split(/[\s-]+/).filter(p => p.length > 0);
                  const hasCommonPart = batchParts.some(bp => 
                    muestraParts.some(mp => bp === mp || bp.includes(mp) || mp.includes(bp))
                  );
                  if (!hasCommonPart) {
                    console.log(`findBatchForMuestra: Batch ${b.id} grain type "${batchGrainType}" does not match "${muestraGrainType}"`);
                    return false;
                  }
                }
              } else if (!batchGrainType && muestraGrainType) {
                // If batch has no grain type but muestra has one, skip this batch
                console.log(`findBatchForMuestra: Batch ${b.id} has no grain type, but muestra requires "${muestraGrainType}"`);
                return false;
              }
            }
            
            return true;
          });

          console.log(`findBatchForMuestra: After filtering by barco/tipo: ${matchingBatches.length} matching batch(es)`);

          // If multiple matches, prefer the one with most recent entry_date or highest quantity
          if (matchingBatches.length > 0) {
            const sorted = matchingBatches.sort((a: any, b: any) => {
              const dateA = a.entry_date ? new Date(a.entry_date).getTime() : 0;
              const dateB = b.entry_date ? new Date(b.entry_date).getTime() : 0;
              if (dateB !== dateA) return dateB - dateA;
              return (b.quantity || 0) - (a.quantity || 0);
            });
            const selectedBatch: any = sorted[0];
            const quantityInTonnes = convertToTonnes(selectedBatch.quantity || 0, selectedBatch.unit || 'tonnes');
            console.log(`findBatchForMuestra: Selected batch: ${selectedBatch.id} with ${quantityInTonnes} tonnes`);
            return { id: selectedBatch.id, quantityInTonnes };
          }
          
          console.log(`findBatchForMuestra: No matching batches found after filtering.`);
          return null;
        };

        // Calculate Ácido Úrico and damage values for each silo
        const acidoUricoPorSilo: Record<string, number> = {};
        const danoGorgojosAdultosPorSilo: Record<string, number> = {};
        const danoGorgojosTotalPorSilo: Record<string, number> = {};
        const danoPiojilloPorSilo: Record<string, number> = {};
        const danoTotalPlagaPorSilo: Record<string, number> = {};
        const perdidaEconomicaPorSilo: Record<string, number> = {};

        Object.entries(siloGroups).forEach(([silo, muestras]) => {
          // Calculate averages for this silo (1 or 2 muestras per silo)
          const numMuestras = muestras.length || 1; // Avoid division by zero
          
          const totalGorgojosVivos = muestras.reduce((sum, m) => {
            return sum +
              (m.tribVivos || 0) +
              (m.rhyzVivos || 0) +
              (m.chryVivos || 0) +
              (m.sitoVivos || 0) +
              (m.stegVivos || 0);
          }, 0) / numMuestras; // Average instead of sum

          const totalPiojillo = muestras.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras; // Average instead of sum
          // Use maximum of observaciones from PDF (user-edited values take priority)
          // If no observaciones available, fall back to batch quantity
          const maxObservaciones = Math.max(...muestras.map(m => m.observaciones || 0), 0);
          const tipoGrano = muestras[0]?.tipoGrano || '';
          const barcoNombre = muestras[0]?.barco || '';
          
          const batchInfo = findBatchForMuestra(silo, barcoNombre, tipoGrano, fechaSemana);
          // Prioritize PDF observaciones (user-edited values) over batch quantity
          const totalTons = maxObservaciones > 0 ? maxObservaciones : (batchInfo?.quantityInTonnes || 0);

          // Ácido Úrico: ((([Gorgojos Vivos]*0.1)+(([Gorgojos Vivos]*6)*0.1))*7)/10 * (tons/1000)
          // Now includes tons to make it proportional to grain quantity
          // Prioritizes PDF observaciones (user-edited values) over batch quantity
          acidoUricoPorSilo[silo] = (((totalGorgojosVivos * 0.1) + ((totalGorgojosVivos * 6) * 0.1)) * 7) / 10 * (totalTons / 1000);

          // Daño Gorgojos Adultos Kg = [Gorgojos Vivos] * (tons * 1000) * 0.000001 * 7
          danoGorgojosAdultosPorSilo[silo] = totalGorgojosVivos * (totalTons * 1000) * 0.000001 * 7;

          // Daño Gorgojos Total Kg = [Daño Gorgojos Adultos Kg] * 6
          danoGorgojosTotalPorSilo[silo] = danoGorgojosAdultosPorSilo[silo] * 6;

          // Daño Piojillo = [Piojillo/Ácaro] * (tons * 1000) * 0.00000033 * 7
          danoPiojilloPorSilo[silo] = totalPiojillo * (totalTons * 1000) * 0.00000033 * 7;

          // Daño Total Plaga Kg = [Daño Gorgojos Total Kg] + [Daño Piojillo]
          danoTotalPlagaPorSilo[silo] = danoGorgojosTotalPorSilo[silo] + danoPiojilloPorSilo[silo];

          // Pérdida Económica Semanal = [Daño Total Plaga Kg] * (grain type cost)
          // Get cost from first muestra's grain type (assuming all muestras in silo have same grain type)
          const grainType = muestras[0]?.tipoGrano || '';
          const grainCost = getGrainCost(grainType);
          perdidaEconomicaPorSilo[silo] = danoTotalPlagaPorSilo[silo] * grainCost;
        });

        const muestrasData = data.muestras.map(m => {
          const silo = m.silo || 'Sin silo';
          return {
            muestreo_id: muestreoId,
            silo: m.silo,
            muestra: m.muestra,
            barco: m.barco,
            tipo_grano: m.tipoGrano,
            fecha_almacenamiento: m.fechaAlmacenamiento || null,
            dias_almacenamiento: m.diasAlmacenamiento,
            piojillo_acaro: m.piojilloAcaro,
            trib_vivos: m.tribVivos,
            trib_muertos: m.tribMuertos,
            rhyz_vivos: m.rhyzVivos,
            rhyz_muertos: m.rhyzMuertos,
            chry_vivos: m.chryVivos,
            chry_muertos: m.chryMuertos,
            sito_vivos: m.sitoVivos,
            sito_muertos: m.sitoMuertos,
            steg_vivos: m.stegVivos,
            steg_muertos: m.stegMuertos,
            observaciones: m.observaciones,
            total_insectos_vivos: m.totalInsectosVivos,
            total_insectos_muertos: m.totalInsectosMuertos,
            acido_urico: acidoUricoPorSilo[silo] || 0,
            dano_gorgojos_adultos_kg: danoGorgojosAdultosPorSilo[silo] || 0,
            dano_gorgojos_total_kg: danoGorgojosTotalPorSilo[silo] || 0,
            dano_piojillo_kg: danoPiojilloPorSilo[silo] || 0,
            dano_total_plaga_kg: danoTotalPlagaPorSilo[silo] || 0,
            perdida_economica_semanal: perdidaEconomicaPorSilo[silo] || 0,
          };
        });

        await supabase.from('muestras_granos').insert(muestrasData as any);

        // Guardar historial de pérdidas por batch
        // fechaSemana already defined above
        
        // Create historial entries for each batch found in each silo group
        // Note: All calculations (acidoUrico, danos, perdidaEconomica) were already calculated
        // using averages in the previous loop, so we just reuse those values here
        const historialPerdidasData: any[] = [];
        
        Object.entries(siloGroups).forEach(([silo, muestras]) => {
          // Recalculate averages to save to database (already calculated above for damage calculations)
          const numMuestras = muestras.length || 1;
          
          const totalGorgojosVivos = muestras.reduce((sum, m) => {
            return sum +
              (m.tribVivos || 0) +
              (m.rhyzVivos || 0) +
              (m.chryVivos || 0) +
              (m.sitoVivos || 0) +
              (m.stegVivos || 0);
          }, 0) / numMuestras;

          const totalPiojillo = muestras.reduce((sum, m) => sum + (m.piojilloAcaro || 0), 0) / numMuestras;
          const tipoGrano = muestras[0]?.tipoGrano || '';
          const barcoNombre = muestras[0]?.barco || '';

          // Find batch for this silo/barco/grain type combination at the muestreo date
          // This considers the batch's historical position based on movement history
          const batchInfo = findBatchForMuestra(silo, barcoNombre, tipoGrano, fechaSemana);
          const batchId = batchInfo?.id || null;
          // Use batch quantity if available, otherwise use maximum of observaciones from PDF (not average)
          const totalTons = batchInfo?.quantityInTonnes || Math.max(...muestras.map(m => m.observaciones || 0));
          
          // Log for debugging if no match found
          if (!batchId) {
            console.log(`No batch match found for silo ${silo}, barco: ${barcoNombre}, tipo: ${tipoGrano}, fecha: ${fechaSemana.toISOString()}. Using PDF observaciones: ${totalTons} tonnes`);
          } else {
            console.log(`Using batch quantity for silo ${silo}: ${totalTons} tonnes from batch ${batchId}`);
          }

          historialPerdidasData.push({
            muestreo_id: muestreoId,
            batch_id: batchId, // Can be null if no batch found
            silo: silo,
            fecha_semana: fechaSemana.toISOString().split('T')[0],
            tipo_grano: tipoGrano,
            total_gorgojos_vivos: Math.round(totalGorgojosVivos), // Round to nearest integer (average)
            total_piojillo: Math.round(totalPiojillo), // Round to nearest integer (average)
            total_tons: totalTons, // Average tons
            // All damage calculations below use the averages calculated in the previous loop
            acido_urico: acidoUricoPorSilo[silo] || 0, // Calculated using average gorgojos vivos
            dano_gorgojos_adultos_kg: danoGorgojosAdultosPorSilo[silo] || 0, // Calculated using average gorgojos vivos and tons
            dano_gorgojos_total_kg: danoGorgojosTotalPorSilo[silo] || 0, // Calculated using average
            dano_piojillo_kg: danoPiojilloPorSilo[silo] || 0, // Calculated using average piojillo and tons
            dano_total_plaga_kg: danoTotalPlagaPorSilo[silo] || 0, // Calculated using averages
            perdida_economica_semanal: perdidaEconomicaPorSilo[silo] || 0, // Calculated using averages
          });
        });

        // Insertar registros de historial de pérdidas (si hay datos)
        if (historialPerdidasData.length > 0) {
          await supabase.from('historial_perdidas_silos').insert(historialPerdidasData as any);
        }
      }

      await fetchMuestreos();
      return muestreoId;
    } catch (error) {
      console.error('Error saving muestreo:', error);
      throw error;
    }
  };

  // Delete report
  const deleteMuestreo = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('muestreos_granos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchMuestreos();
      return true;
    } catch (error) {
      console.error('Error deleting muestreo:', error);
      return false;
    }
  };

  return {
    muestreos,
    loading,
    parsing,
    parsePdf,
    parseFormitizeForm,
    saveMuestreo,
    deleteMuestreo,
    refetch: fetchMuestreos,
  };
};
