// Supabase Edge Function to proxy insect identification API requests
// This avoids CORS issues by making the request from the server
// Deploy with: supabase functions deploy insect-id-proxy

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const INSECT_API_BASE_URL = 'https://insect.kindwise.com/api/v1';
const INSECT_API_KEY = Deno.env.get('INSECT_ID_API_KEY') || '';

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
    if (!INSECT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the image from the request
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create new FormData for the Kindwise API
    const apiFormData = new FormData();
    apiFormData.append('image', image);

    // Add location if provided
    const latitude = formData.get('latitude');
    const longitude = formData.get('longitude');
    if (latitude && longitude) {
      apiFormData.append('latitude', latitude.toString());
      apiFormData.append('longitude', longitude.toString());
    }

    // Make request to Kindwise API
    const apiResponse = await fetch(`${INSECT_API_BASE_URL}/identification`, {
      method: 'POST',
      headers: {
        'X-Api-Key': INSECT_API_KEY,
      },
      body: apiFormData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return new Response(
        JSON.stringify({
          error: 'API request failed',
          details: errorText,
          status: apiResponse.status,
        }),
        {
          status: apiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in insect-id-proxy:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})

