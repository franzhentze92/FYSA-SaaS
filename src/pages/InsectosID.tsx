import React, { useState, useRef } from 'react';
import { Upload, Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const InsectosID: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<any>(null);
  const [includeLocation, setIncludeLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Por favor selecciona una imagen menor a 10MB');
        return;
      }

      setSelectedImage(file);
      setError(null);
      setIdentificationResult(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen primero');
      return;
    }

    setIdentifying(true);
    setError(null);
    setIdentificationResult(null);

    try {
      // Create FormData to send the image
      const formData = new FormData();
      formData.append('image', selectedImage);
      
      if (includeLocation) {
        // Get user's location if they want to include it
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          formData.append('latitude', position.coords.latitude.toString());
          formData.append('longitude', position.coords.longitude.toString());
        } catch (geoError) {
          console.warn('Could not get location:', geoError);
          // Continue without location if user denies permission
        }
      }

      // Use Supabase Edge Function as proxy to avoid CORS issues
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      if (!SUPABASE_URL) {
        throw new Error('Supabase URL no configurada en VITE_SUPABASE_URL');
      }
      
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!SUPABASE_ANON_KEY) {
        throw new Error('Supabase anon key no configurada en VITE_SUPABASE_ANON_KEY');
      }
      
      const PROXY_ENDPOINT = `${SUPABASE_URL}/functions/v1/insect-id-proxy`;
      
      // Note: Don't set Content-Type header when sending FormData, browser will set it automatically with boundary
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to our expected format
      // Adjust this mapping based on your actual API response structure
      const transformedResult = {
        species: data.species || data.name || data.insect_name || data.common_name || 'Desconocido',
        scientificName: data.scientific_name || data.scientificName || data.taxonomy?.species || '',
        confidence: data.confidence || data.probability || data.score || 0,
        description: data.description || data.info || data.details || '',
        habitat: data.habitat || data.environment || '',
        additionalInfo: data.additional_info || data.notes || data.more_info || '',
        // Include raw response for debugging
        rawResponse: data,
      };
      
      setIdentificationResult(transformedResult);
    } catch (err) {
      console.error('Error identifying insect:', err);
      setError(err instanceof Error ? err.message : 'Error al identificar el insecto. Por favor intenta nuevamente.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setIdentificationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full min-h-screen bg-muted py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-1">Insect ID</h1>
        <div className="text-muted-foreground text-lg mb-6 font-normal">
          Use this tool to identify insect species from a photo and get more information about your sample.
        </div>

        {/* Upload and Identify Controls */}
        <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </button>
            <button
              onClick={handleIdentify}
              disabled={!selectedImage || identifying}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
            >
              {identifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Identificando...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Identify
                </>
              )}
            </button>
            {selectedImage && (
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-gray-200 text-gray-800 hover:bg-gray-300 h-10 px-4 py-2"
              >
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include-location"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
              className="accent-green-600"
            />
            <label htmlFor="include-location" className="font-medium">
              Include location
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl shadow p-4 mb-6 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col items-center">
            <img
              src={imagePreview}
              alt="Uploaded insect"
              className="w-full h-64 object-contain rounded-2xl shadow-lg border mb-2"
            />
            {selectedImage && (
              <p className="text-sm text-muted-foreground">
                {selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        )}

        {/* Identification Results */}
        {identificationResult && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">Resultados de Identificación</h2>
            </div>
            <div className="space-y-4">
              {identificationResult.species && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Especie Identificada:</h3>
                  <p className="text-xl font-medium text-primary">{identificationResult.species}</p>
                  {identificationResult.scientificName && (
                    <p className="text-sm text-gray-600 italic mt-1">
                      {identificationResult.scientificName}
                    </p>
                  )}
                </div>
              )}
              {identificationResult.confidence !== undefined && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nivel de Confianza:</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          identificationResult.confidence >= 80
                            ? 'bg-green-600'
                            : identificationResult.confidence >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, identificationResult.confidence))}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium min-w-[50px]">
                      {typeof identificationResult.confidence === 'number'
                        ? `${Math.round(identificationResult.confidence)}%`
                        : identificationResult.confidence}
                    </span>
                  </div>
                </div>
              )}
              {identificationResult.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Descripción:</h3>
                  <p className="text-gray-700">{identificationResult.description}</p>
                </div>
              )}
              {identificationResult.habitat && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Hábitat:</h3>
                  <p className="text-gray-700">{identificationResult.habitat}</p>
                </div>
              )}
              {identificationResult.additionalInfo && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Información Adicional:</h3>
                  <div className="text-gray-700 whitespace-pre-line">{identificationResult.additionalInfo}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Placeholder when no image is selected */}
        {!imagePreview && !identificationResult && (
          <div className="bg-white rounded-xl shadow p-6 mb-6 flex flex-col items-center justify-center min-h-[400px]">
            <Camera className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">Selecciona una imagen para comenzar la identificación</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsectosID;

