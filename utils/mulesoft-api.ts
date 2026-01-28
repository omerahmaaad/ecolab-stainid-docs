const MULESOFT_BASE_URL = process.env.MULESOFT_BASE_URL || 'https://api-cloudhubcentral-dev.ecolab.com';
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || '';
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || '';
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_SCOPE = process.env.AZURE_SCOPE || '';

interface AzureTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
}

interface MuleSoftApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

let cachedMuleSoftToken: { token: string; expiresAt: number } | null = null;

async function getAzureADToken(): Promise<string> {
  if (cachedMuleSoftToken && Date.now() < cachedMuleSoftToken.expiresAt - 60000) {
    console.log('[MuleSoft] Using cached Azure AD token');
    return cachedMuleSoftToken.token;
  }

  console.log('[MuleSoft] Fetching new Azure AD access token...');

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET || !AZURE_SCOPE) {
    throw new Error('Azure AD credentials not configured for MuleSoft');
  }

  const tokenUrl = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope: AZURE_SCOPE,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[MuleSoft] Azure AD token fetch failed:', errorText);
    throw new Error(`Failed to get Azure AD token: ${response.status} - ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[MuleSoft] Token response is not JSON:', text);
    throw new Error('Azure AD token response is not JSON');
  }

  const data: AzureTokenResponse = await response.json();

  cachedMuleSoftToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  console.log('[MuleSoft] Azure AD token obtained successfully');
  return data.access_token;
}

export async function muleSoftRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<MuleSoftApiResponse<T>> {
  try {
    const token = await getAzureADToken();
    const url = `${MULESOFT_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    console.log(`[MuleSoft] ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MuleSoft] Request failed:', response.status, errorText);
      return {
        success: false,
        error: `MuleSoft API error: ${response.status} - ${errorText}`,
      };
    }

    let data: T;

    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error: any) {
        const text = await response.text();
        console.error('[MuleSoft] Failed to parse JSON response:', text);
        return {
          success: false,
          error: `Failed to parse response: ${error.message}`,
        };
      }
    } else {
      data = (await response.text()) as unknown as T;
    }

    console.log('[MuleSoft] Request successful');
    return { success: true, data };
  } catch (error: any) {
    console.error('[MuleSoft] Request error:', error.message);
    return { success: false, error: error.message };
  }
}

export async function saveClassificationViaMuleSoft(record: {
  id: string;
  timestamp: number;
  imageWithFlash: string;
  imageWithoutFlash: string;
  predictedStainType: string;
  predictedCategory: string;
  userFeedback: 'correct' | 'incorrect';
  correctedStainType?: string | null;
  correctedCategory?: string | null;
  modelUsed: string;
  confidence?: number | null;
  username: string;
}): Promise<MuleSoftApiResponse> {
  console.log('[MuleSoft] Saving classification record:', record.id);

  const payload = {
    id: record.id,
    timestamp: record.timestamp,
    image_with_flash: record.imageWithFlash.length > 1000
      ? record.imageWithFlash.substring(0, 1000) + '...[truncated]'
      : record.imageWithFlash,
    image_without_flash: record.imageWithoutFlash.length > 1000
      ? record.imageWithoutFlash.substring(0, 1000) + '...[truncated]'
      : record.imageWithoutFlash,
    predicted_stain_type: record.predictedStainType,
    predicted_category: record.predictedCategory,
    user_feedback: record.userFeedback,
    corrected_stain_type: record.correctedStainType || null,
    corrected_category: record.correctedCategory || null,
    model_used: record.modelUsed,
    confidence: record.confidence ?? null,
    username: record.username,
    created_at: new Date().toISOString(),
  };

  return muleSoftRequest('/api/stain-classifications', {
    method: 'POST',
    body: payload,
  });
}

export async function getClassificationsViaMuleSoft(limit: number = 100): Promise<MuleSoftApiResponse<any[]>> {
  console.log('[MuleSoft] Fetching classifications, limit:', limit);
  return muleSoftRequest(`/api/stain-classifications?limit=${limit}`);
}

export async function getStatsViaMuleSoft(): Promise<MuleSoftApiResponse<{
  total: number;
  correct: number;
  incorrect: number;
}>> {
  console.log('[MuleSoft] Fetching stats');
  return muleSoftRequest('/api/stain-classifications/stats');
}

export function isMuleSoftConfigured(): boolean {
  const configured = !!(AZURE_TENANT_ID && AZURE_CLIENT_ID && AZURE_CLIENT_SECRET && AZURE_SCOPE);
  console.log('[MuleSoft] Configuration check:', configured);
  return configured;
}

export async function testMuleSoftConnection(): Promise<MuleSoftApiResponse<{ connected: boolean; message: string }>> {
  try {
    await getAzureADToken();
    return {
      success: true,
      data: {
        connected: true,
        message: 'Successfully connected to MuleSoft via Azure AD',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      data: {
        connected: false,
        message: error.message,
      },
    };
  }
}
