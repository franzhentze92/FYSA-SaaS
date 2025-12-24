// Supabase Edge Function to proxy Google Sheets data
// Deploy with: supabase functions deploy google-sheets-proxy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SHEET_ID = '17itEw9iLloWd1CrdWbB1hN901ScoD9NxULJjqPHA7Lg';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Try to fetch the CSV from Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    const rows = parseCSV(csvText);
    
    if (rows.length < 2) {
      return new Response(
        JSON.stringify({ success: true, data: [], count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Map rows to records
    const records = rows.slice(1).map((row, index) => ({
      id: row[0] || `row-${index}`,
      formTitle: row[6] || row[5] || '',
      dateSubmitted: row[8] || '',
      fechaServicio: row[16] || '',
      nombreCliente: row[17] || '',
      tipoServicio: row[35] || '',
      productosUtilizados: row[36] || '',
      dosis: row[37] || '',
      unidadMedida: row[38] || '',
      mezclautilizada: row[39] || '',
      cantidad: parseFloat(row[40]) || 0,
      comentarios: row[41] || '',
      tecnico: row[42] || '',
      status: row[14] || '',
      pdfLink: row[15] || '',
    })).filter(r => r.formTitle || r.nombreCliente || r.tipoServicio);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: records, 
        count: records.length,
        lastUpdated: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function parseCSV(csvText: string): string[][] {
  const lines = csvText.split('\n');
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (const char of line) {
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
}

