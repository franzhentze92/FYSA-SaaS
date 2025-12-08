import { FormitizeApiResponse, FormitizeInvoice, FormitizeJob, FormitizeJobsResponse, FormitizeSubmittedForm, FormitizeSubmittedFormsResponse, FormitizeQuote, FormitizeQuotesResponse } from '@/types/formitize';

const FORMITIZE_BASE_URL = 'https://service.formitize.com/api/rest/v2';
const FORMITIZE_USER_AGENT = 'FYSA'; // Nombre de la compañía en Formitize
const FORMITIZE_TOKEN = '16250-611a9053-ad56-4510-bf80-f864987c278b';

// Credenciales de Formitize pre-configuradas
// El token puede usarse como password o como parte de la autenticación
let formitizeCredentials = {
  username: 'oficinafysa',
  password: 'oficina123!!',
  token: FORMITIZE_TOKEN,
};

export const setFormitizeCredentials = (username: string, password: string, token?: string) => {
  formitizeCredentials = { 
    username, 
    password,
    token: token || FORMITIZE_TOKEN,
  };
};

export const getFormitizeCredentials = () => {
  // No retornar el token completo por seguridad, solo indicar si existe
  return { 
    username: formitizeCredentials.username,
    password: formitizeCredentials.password ? '***' : undefined,
    hasToken: !!formitizeCredentials.token,
  };
};

export const fetchFormitizeInvoice = async (invoiceId: number): Promise<FormitizeApiResponse> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/crm/accounts/invoice/${invoiceId}`;
  
  // Según la documentación de Formitize:
  // - User-Agent debe ser el nombre de la compañía (FYSA) - REQUERIDO
  // - Autenticación puede ser:
  //   1. Basic Auth: username:password en base64 (método tradicional)
  //   2. Bearer Token: token de API con header Authorization: Bearer <token>
  //
  // PROBLEMA CRÍTICO: El User-Agent NO se puede establecer desde el navegador (header protegido)
  // Sin el User-Agent correcto, la API rechazará con 401
  //
  // Intentar primero con Bearer Token (método moderno de API tokens)
  // Si no funciona, intentar con Basic Auth
  
  let authHeader: string;
  if (formitizeCredentials.token) {
    // Intentar primero con Bearer Token (formato para tokens de API)
    authHeader = `Bearer ${formitizeCredentials.token}`;
    console.log('Intentando autenticación con Bearer Token');
  } else {
    // Fallback a Basic Auth con username:password
    const authString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.password}`);
    authHeader = `Basic ${authString}`;
    console.log('Intentando autenticación con Basic Auth');
  }
  
  console.log('Autenticación configurada:', {
    username: formitizeCredentials.username,
    usingToken: !!formitizeCredentials.token,
    authMethod: formitizeCredentials.token ? 'Bearer' : 'Basic',
  });

  try {
    console.log('Haciendo petición a:', url);
    console.log('Company (User-Agent requerido):', FORMITIZE_USER_AGENT);
    console.log('Username:', formitizeCredentials.username);
    console.log('Usando token:', !!formitizeCredentials.token);
    
    // PROBLEMA CRÍTICO: El User-Agent NO se puede establecer desde el navegador
    // La API de Formitize REQUIERE el User-Agent = "FYSA" (nombre de la compañía)
    // Sin este header, la API rechazará todas las peticiones con 401
    // 
    // SOLUCIONES POSIBLES:
    // 1. Crear un endpoint proxy en tu backend que agregue el User-Agent
    // 2. Usar un servicio de proxy como CORS Anywhere (solo para desarrollo)
    // 3. Hacer todas las peticiones desde el servidor (backend)
    //
    // Por ahora intentamos la petición, pero fallará sin el User-Agent correcto
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        // El User-Agent no se puede establecer aquí - es un header protegido del navegador
        // 'User-Agent': FORMITIZE_USER_AGENT, // ❌ NO FUNCIONA EN NAVEGADORES
        // La API de Formitize requiere este header, pero el navegador no lo permite
      },
      credentials: 'omit',
      mode: 'cors',
    });
    
    console.log('Status de respuesta:', response.status, response.statusText);
    console.log('Headers de respuesta:', Object.fromEntries(response.headers.entries()));

    // Leer el cuerpo de la respuesta para debugging
    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      // Intentar parsear el error si es JSON
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Si no es JSON, usar el texto de respuesta
        if (responseText) {
          errorMessage = responseText;
        }
      }

      if (response.status === 401) {
        // Si falla con Bearer, intentar con Basic Auth si tenemos token
        if (formitizeCredentials.token && authHeader.startsWith('Bearer')) {
          console.log('Bearer Token falló, intentando con Basic Auth usando token como password');
          // Intentar de nuevo con Basic Auth usando token como password
          const basicAuthString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.token}`);
          const retryResponse = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${basicAuthString}`,
              'Accept': 'application/json',
            },
            credentials: 'omit',
            mode: 'cors',
          });
          
          if (retryResponse.ok) {
            const retryText = await retryResponse.text();
            const retryData = JSON.parse(retryText);
            console.log('Basic Auth con token funcionó');
            return retryData;
          }
          
          // Si también falla, leer el error
          const retryText = await retryResponse.text();
          let retryErrorMessage = `Error ${retryResponse.status}: ${retryResponse.statusText}`;
          try {
            const retryErrorData = JSON.parse(retryText);
            if (retryErrorData.message) retryErrorMessage = retryErrorData.message;
            else if (retryErrorData.error) retryErrorMessage = retryErrorData.error;
          } catch {}
          
          throw new Error(`Credenciales inválidas después de intentar Bearer y Basic Auth. ${retryErrorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador. Se necesita un proxy o backend.`);
        }
        throw new Error(`Credenciales inválidas. ${errorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador. Se necesita un proxy o backend.`);
      }
      if (response.status === 404) {
        throw new Error(`Factura con ID ${invoiceId} no encontrada.`);
      }
      throw new Error(errorMessage);
    }

    // Parsear la respuesta JSON
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener facturas por rango de IDs
// Como la API de Formitize no tiene un endpoint para listar todas las facturas,
// intentamos obtener facturas por rango de IDs
export const fetchFormitizeInvoicesByRange = async (startId: number, endId: number): Promise<FormitizeInvoice[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  const invoices: FormitizeInvoice[] = [];
  const errors: string[] = [];

  // Intentar obtener facturas en el rango especificado
  // Hacer las peticiones en paralelo con un límite de concurrencia
  const batchSize = 10; // Procesar 10 facturas a la vez
  const totalIds = endId - startId + 1;
  
  for (let i = 0; i < totalIds; i += batchSize) {
    const batchPromises: Promise<void>[] = [];
    
    for (let j = 0; j < batchSize && (i + j) <= totalIds; j++) {
      const invoiceId = startId + i + j;
      const promise = fetchFormitizeInvoice(invoiceId)
        .then(response => {
          if (response && response.payload) {
            invoices.push(response.payload);
          }
        })
        .catch(error => {
          // Ignorar errores 404 (factura no existe)
          if (!error.message.includes('404') && !error.message.includes('no encontrada')) {
            errors.push(`ID ${invoiceId}: ${error.message}`);
          }
        });
      
      batchPromises.push(promise);
    }
    
    await Promise.all(batchPromises);
  }

  if (invoices.length === 0 && errors.length > 0) {
    throw new Error(`No se pudieron obtener facturas. Errores: ${errors.slice(0, 3).join(', ')}`);
  }

  return invoices;
};

// Función para obtener todas las facturas
// Nota: La API de Formitize no tiene un endpoint directo para listar todas las facturas
// Esta función intenta diferentes estrategias
export const fetchAllFormitizeInvoices = async (params?: {
  clientID?: number;
  status?: string;
  dateFrom?: number;
  dateTo?: number;
  limit?: number;
  offset?: number;
  startId?: number;
  endId?: number;
}): Promise<FormitizeInvoice[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  // Si se proporciona un rango de IDs, usar la función de rango
  if (params?.startId !== undefined && params?.endId !== undefined) {
    return fetchFormitizeInvoicesByRange(params.startId, params.endId);
  }

  // Intentar diferentes endpoints posibles para listar facturas
  // Formitize puede tener diferentes endpoints según la versión
  const possibleEndpoints = [
    '/crm/accounts/invoice',
    '/crm/invoices',
    '/crm/accounts/invoices',
  ];

  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  // Construir query parameters
  const queryParams = new URLSearchParams();
  if (params?.clientID) queryParams.append('clientID', params.clientID.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom.toString());
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  let lastError: Error | null = null;
  let lastStatus: number | null = null;

  // Intentar cada endpoint posible
  for (const endpoint of possibleEndpoints) {
    try {
      const url = `${FORMITIZE_BASE_URL}${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('Intentando obtener facturas desde:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json',
        },
        credentials: 'omit',
        mode: 'cors',
      });

      lastStatus = response.status;

      if (response.ok) {
        const responseText = await response.text();
        const data = JSON.parse(responseText);
        
        // La respuesta puede venir en diferentes formatos
        if (Array.isArray(data)) {
          return data;
        } else if (data.payload && Array.isArray(data.payload)) {
          return data.payload;
        } else if (data.invoices && Array.isArray(data.invoices)) {
          return data.invoices;
        } else if (data.data && Array.isArray(data.data)) {
          return data.data;
        }
        
        // Si la respuesta es un objeto con una factura única, convertir a array
        if (data.payload && data.payload.id) {
          return [data.payload];
        }
      } else if (response.status === 501) {
        // 501 Not Implemented - este endpoint no está disponible
        lastError = new Error(`El endpoint ${endpoint} no está implementado (501)`);
        continue; // Intentar siguiente endpoint
      } else if (response.status !== 404) {
        // Si no es 404, guardar el error pero continuar con el siguiente endpoint
        lastError = new Error(`Error ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      console.log(`Endpoint ${endpoint} falló, intentando siguiente...`);
    }
  }

  // Si todos los endpoints devolvieron 501, significa que no hay endpoint de lista disponible
  if (lastStatus === 501) {
    throw new Error('La API de Formitize no tiene un endpoint para listar todas las facturas. Usa la búsqueda por ID o proporciona un rango de IDs.');
  }

  // Si todos los endpoints fallaron, lanzar el último error
  if (lastError) {
    throw new Error(`No se pudo obtener la lista de facturas. ${lastError.message}`);
  }

  throw new Error('No se encontró un endpoint válido para listar facturas. Verifica la documentación de la API de Formitize.');
};

// Función para buscar facturas (si el API lo permite)
// Nota: Este endpoint puede no existir, pero lo dejamos preparado
export const searchFormitizeInvoices = async (params?: {
  clientID?: number;
  status?: string;
  dateFrom?: number;
  dateTo?: number;
}): Promise<FormitizeApiResponse[]> => {
  // Esta función requeriría un endpoint de búsqueda que puede no estar disponible
  // Por ahora retornamos un array vacío
  // En el futuro, si hay un endpoint de búsqueda, se implementaría aquí
  throw new Error('La búsqueda de facturas no está disponible en este momento. Use el ID de factura específico.');
};

// Función para obtener un job específico por ID
export const fetchFormitizeJob = async (jobId: number): Promise<FormitizeJobsResponse> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/job/${jobId}`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  try {
    console.log('Buscando job con ID:', jobId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      
      if (response.status === 404) {
        throw new Error(`Job con ID ${jobId} no encontrado.`);
      }
      throw new Error(errorMessage);
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener detalles completos de un job (incluyendo información de formularios)
export const fetchFormitizeJobDetails = async (jobId: number): Promise<FormitizeJob> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/job/${jobId}`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  try {
    console.log('Obteniendo detalles completos del job:', jobId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      
      if (response.status === 404) {
        throw new Error(`Job con ID ${jobId} no encontrado.`);
      }
      throw new Error(errorMessage);
    }

    const data: FormitizeJobsResponse = JSON.parse(responseText);
    
    if (data.payload && typeof data.payload === 'object') {
      const job = Object.values(data.payload)[0];
      if (job) {
        // Log detallado de toda la información del job
        console.log('Job completo obtenido:', job);
        console.log('Formularios del job:', job.forms);
        console.log('Todos los campos del job:', Object.keys(job));
        return job;
      }
    }
    
    throw new Error('La respuesta de la API no contiene datos de trabajo');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener lista de jobs
export const fetchAllFormitizeJobs = async (params?: {
  finished?: boolean;
  from?: string;
  to?: string;
  page?: number;
  order?: 'ASC' | 'DESC';
  ordernumber?: number;
  jobnumber?: number;
  status?: string;
  agentName?: string;
}): Promise<FormitizeJob[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/job/`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  // Construir query parameters
  const queryParams = new URLSearchParams();
  if (params?.finished !== undefined) queryParams.append('finished', params.finished.toString());
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.order) queryParams.append('order', params.order);
  if (params?.ordernumber) queryParams.append('ordernumber', params.ordernumber.toString());
  if (params?.jobnumber) queryParams.append('jobnumber', params.jobnumber.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.agentName) queryParams.append('agentName', params.agentName);

  try {
    const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Obteniendo jobs desde:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      throw new Error(errorMessage);
    }

    const data: FormitizeJobsResponse = JSON.parse(responseText);
    
    // Convertir el objeto de jobs a un array y loguear toda la información
    if (data.payload && typeof data.payload === 'object') {
      const jobs = Object.values(data.payload);
      
      // Log detallado de cada job para debugging
      jobs.forEach((job, index) => {
        console.log(`Job ${index + 1} (ID: ${job.id}):`, {
          id: job.id,
          title: job.title,
          jobNumber: job.jobNumber,
          orderNumber: job.orderNumber,
          forms: job.forms,
          formsCount: Object.keys(job.forms || {}).length,
          allFields: Object.keys(job), // Mostrar todos los campos disponibles
        });
      });
      
      return jobs;
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener lista de formularios enviados
export const fetchAllFormitizeSubmittedForms = async (params?: {
  title?: string;
  page?: number;
  jobID?: number;
  modifiedAfterDate?: string;
  formID?: string;
}): Promise<FormitizeSubmittedForm[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/form/submit/list`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  // Construir query parameters
  const queryParams = new URLSearchParams();
  if (params?.title) queryParams.append('title', params.title);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.jobID) queryParams.append('jobID', params.jobID.toString());
  if (params?.modifiedAfterDate) queryParams.append('modifiedAfterDate', params.modifiedAfterDate);
  if (params?.formID) queryParams.append('formID', params.formID);

  try {
    const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    console.log('Obteniendo formularios enviados desde:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      throw new Error(errorMessage);
    }

    const data: FormitizeSubmittedFormsResponse = JSON.parse(responseText);
    
    // Convertir el objeto de formularios a un array
    if (data.payload && typeof data.payload === 'object') {
      const forms = Object.values(data.payload);
      
      // Log detallado de cada formulario para debugging
      forms.forEach((form, index) => {
        console.log(`Formulario ${index + 1} (ID: ${form.submittedFormID}):`, {
          submittedFormID: form.submittedFormID,
          title: form.title,
          formID: form.formID,
          jobID: form.jobID,
          status: form.status,
          dateSubmitted: form.dateSubmitted,
          allFields: Object.keys(form),
        });
      });
      
      return forms;
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener un formulario enviado específico por ID
export const fetchFormitizeSubmittedForm = async (formId: number, simple?: boolean): Promise<FormitizeSubmittedForm> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/form/submit/${formId}${simple ? '?simple=true' : ''}`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  try {
    console.log('Obteniendo formulario enviado con ID:', formId);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      
      if (response.status === 404) {
        throw new Error(`Formulario con ID ${formId} no encontrado.`);
      }
      throw new Error(errorMessage);
    }

    const data: FormitizeSubmittedFormsResponse = JSON.parse(responseText);
    
    if (data.payload && typeof data.payload === 'object') {
      const form = Object.values(data.payload)[0];
      if (form) {
        console.log('Formulario completo obtenido:', form);
        console.log('Contenido del formulario:', form.content);
        console.log('Adjuntos:', form.attachments);
        return form;
      }
    }
    
    throw new Error('La respuesta de la API no contiene datos de formulario');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener múltiples formularios por IDs
export const fetchFormitizeSubmittedFormsByIds = async (ids: string, simple?: boolean, jobID?: number): Promise<FormitizeSubmittedForm[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const queryParams = new URLSearchParams();
  queryParams.append('id', ids);
  if (simple) queryParams.append('simple', 'true');
  if (jobID) queryParams.append('jobID', jobID.toString());

  const url = `${FORMITIZE_BASE_URL}/form/submit/?${queryParams.toString()}`;
  
  const password = formitizeCredentials.token || formitizeCredentials.password;
  const authString = btoa(`${formitizeCredentials.username}:${password}`);
  const authHeader = formitizeCredentials.token 
    ? `Bearer ${formitizeCredentials.token}` 
    : `Basic ${authString}`;

  try {
    console.log('Obteniendo formularios con IDs:', ids);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      throw new Error(errorMessage);
    }

    const data: FormitizeSubmittedFormsResponse = JSON.parse(responseText);
    
    if (data.payload && typeof data.payload === 'object') {
      return Object.values(data.payload);
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener lista de cotizaciones
export const fetchAllFormitizeQuotes = async (params?: {
  page?: number;
  clientID?: number;
  value?: string;
  datecreatedFrom?: string;
  datecreatedTo?: string;
}): Promise<FormitizeQuote[]> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/crm/accounts/quote/list`;
  
  // Construir query parameters
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.clientID) queryParams.append('clientID', params.clientID.toString());
  if (params?.value) queryParams.append('value', params.value);
  if (params?.datecreatedFrom) queryParams.append('datecreated-from', params.datecreatedFrom);
  if (params?.datecreatedTo) queryParams.append('datecreated-to', params.datecreatedTo);

  const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  
  // Intentar primero con Bearer Token, luego con Basic Auth si falla
  let authHeader: string;
  if (formitizeCredentials.token) {
    authHeader = `Bearer ${formitizeCredentials.token}`;
    console.log('Intentando autenticación con Bearer Token para cotizaciones');
  } else {
    const authString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.password}`);
    authHeader = `Basic ${authString}`;
    console.log('Intentando autenticación con Basic Auth para cotizaciones');
  }

  try {
    console.log('Obteniendo cotizaciones desde:', fullUrl);

    let response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    // Si falla con 401 y tenemos token, intentar con Basic Auth
    if (!response.ok && response.status === 401 && formitizeCredentials.token) {
      console.log('Bearer Token falló, intentando con Basic Auth...');
      const authString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.password}`);
      const basicAuthHeader = `Basic ${authString}`;
      
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': basicAuthHeader,
          'Accept': 'application/json',
        },
        credentials: 'omit',
        mode: 'cors',
      });
      
      const retryText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(retryText);
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
        } catch {}
        throw new Error(`Error de autenticación: ${errorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador.`);
      }
      
      // Usar la respuesta del retry
      const data: FormitizeQuotesResponse = JSON.parse(retryText);
      
      if (data.payload && Array.isArray(data.payload)) {
        return data.payload;
      }
      
      return [];
    }
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      throw new Error(`Error de autenticación: ${errorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador.`);
    }

    const data: FormitizeQuotesResponse = JSON.parse(responseText);
    
    // La respuesta viene como un array directamente en payload
    if (data.payload && Array.isArray(data.payload)) {
      const quotes = data.payload;
      
      // Log detallado de cada cotización para debugging
      quotes.forEach((quote, index) => {
        console.log(`Cotización ${index + 1} (ID: ${quote.id}):`, {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          companyname: quote.companyname,
          total: quote.total,
          status: quote.status,
          quoteDate: quote.quoteDate,
          allFields: Object.keys(quote),
        });
      });
      
      return quotes;
    }
    
    return [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

// Función para obtener una cotización específica por ID
export const fetchFormitizeQuote = async (quoteId: number): Promise<FormitizeQuote> => {
  if (!formitizeCredentials.username || (!formitizeCredentials.password && !formitizeCredentials.token)) {
    throw new Error('Las credenciales de Formitize no están configuradas');
  }

  const url = `${FORMITIZE_BASE_URL}/crm/accounts/quote/${quoteId}`;
  
  // Intentar primero con Bearer Token, luego con Basic Auth si falla
  let authHeader: string;
  if (formitizeCredentials.token) {
    authHeader = `Bearer ${formitizeCredentials.token}`;
    console.log('Intentando autenticación con Bearer Token para cotización individual');
  } else {
    const authString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.password}`);
    authHeader = `Basic ${authString}`;
    console.log('Intentando autenticación con Basic Auth para cotización individual');
  }

  try {
    console.log('Obteniendo cotización con ID:', quoteId);
    
    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
      credentials: 'omit',
      mode: 'cors',
    });

    const responseText = await response.text();
    
    // Si falla con 401 y tenemos token, intentar con Basic Auth
    if (!response.ok && response.status === 401 && formitizeCredentials.token) {
      console.log('Bearer Token falló, intentando con Basic Auth...');
      const authString = btoa(`${formitizeCredentials.username}:${formitizeCredentials.password}`);
      const basicAuthHeader = `Basic ${authString}`;
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': basicAuthHeader,
          'Accept': 'application/json',
        },
        credentials: 'omit',
        mode: 'cors',
      });
      
      const retryText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(retryText);
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
        } catch {}
        
        if (response.status === 404) {
          throw new Error(`Cotización con ID ${quoteId} no encontrada.`);
        }
        throw new Error(`Error de autenticación: ${errorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador.`);
      }
      
      // Usar la respuesta del retry
      const data = JSON.parse(retryText);
      
      if (data.payload) {
        const quote = Array.isArray(data.payload) ? data.payload[0] : data.payload;
        if (quote) {
          console.log('Cotización completa obtenida:', quote);
          return quote;
        }
      }
      
      throw new Error('La respuesta de la API no contiene datos de cotización');
    }
    
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      } catch {}
      
      if (response.status === 404) {
        throw new Error(`Cotización con ID ${quoteId} no encontrada.`);
      }
      throw new Error(`Error de autenticación: ${errorMessage}. Nota: El User-Agent "FYSA" es requerido pero no se puede establecer desde el navegador.`);
    }

    const data = JSON.parse(responseText);
    
    // La respuesta puede venir en diferentes formatos
    if (data.payload) {
      const quote = Array.isArray(data.payload) ? data.payload[0] : data.payload;
      if (quote) {
        console.log('Cotización completa obtenida:', quote);
        return quote;
      }
    }
    
    throw new Error('La respuesta de la API no contiene datos de cotización');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al conectar con la API de Formitize');
  }
};

