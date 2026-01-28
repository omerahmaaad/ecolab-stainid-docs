const DATABRICKS_WORKSPACE_URL = process.env.DATABRICKS_WORKSPACE_URL || '';
const DATABRICKS_CLIENT_ID = process.env.DATABRICKS_CLIENT_ID || '';
const DATABRICKS_CLIENT_SECRET = process.env.DATABRICKS_CLIENT_SECRET || '';

const UC_TABLE = 'ai_engineering.eva_stainid_dev.stain_classifications';

interface DatabricksTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ClassificationRecord {
  id: string;
  timestamp: number;
  image_with_flash: string;
  image_without_flash: string;
  predicted_stain_type: string;
  predicted_category: string;
  user_feedback: 'correct' | 'incorrect';
  corrected_stain_type: string | null;
  corrected_category: string | null;
  model_used: string;
  confidence: number | null;
  username: string;
  created_at: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    console.log('[DatabricksUC] Using cached token');
    return cachedToken.token;
  }

  console.log('[DatabricksUC] Fetching new access token...');
  
  if (!DATABRICKS_WORKSPACE_URL || !DATABRICKS_CLIENT_ID || !DATABRICKS_CLIENT_SECRET) {
    throw new Error('Databricks credentials not configured');
  }

  const tokenUrl = `${DATABRICKS_WORKSPACE_URL}/oidc/v1/token`;
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: DATABRICKS_CLIENT_ID,
      client_secret: DATABRICKS_CLIENT_SECRET,
      scope: 'all-apis',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DatabricksUC] Token fetch failed:', errorText);
    throw new Error(`Failed to get Databricks token: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[DatabricksUC] Token response is not JSON:', text);
    throw new Error('Databricks token response is not JSON');
  }

  let data: DatabricksTokenResponse;
  try {
    data = await response.json();
  } catch (error: any) {
    const text = await response.text();
    console.error('[DatabricksUC] Failed to parse token JSON:', text);
    throw new Error(`Failed to parse token response: ${error.message}`);
  }
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  console.log('[DatabricksUC] Token obtained successfully');
  return data.access_token;
}

async function executeSQL(sql: string, parameters?: Record<string, any>[]): Promise<any> {
  const token = await getAccessToken();
  
  const sqlEndpoint = `${DATABRICKS_WORKSPACE_URL}/api/2.0/sql/statements`;
  
  const payload: any = {
    statement: sql,
    warehouse_id: process.env.DATABRICKS_WAREHOUSE_ID || '',
    wait_timeout: '30s',
  };

  if (parameters && parameters.length > 0) {
    payload.parameters = parameters;
  }

  console.log('[DatabricksUC] Executing SQL:', sql.substring(0, 200));

  const response = await fetch(sqlEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[DatabricksUC] SQL execution failed:', errorText);
    throw new Error(`SQL execution failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('[DatabricksUC] SQL response is not JSON:', text);
    throw new Error('Databricks SQL response is not JSON');
  }

  let result: any;
  try {
    result = await response.json();
  } catch (error: any) {
    const text = await response.text();
    console.error('[DatabricksUC] Failed to parse SQL JSON:', text);
    throw new Error(`Failed to parse SQL response: ${error.message}`);
  }
  
  if (result.status?.state === 'FAILED') {
    console.error('[DatabricksUC] SQL error:', result.status?.error);
    throw new Error(result.status?.error?.message || 'SQL execution failed');
  }

  console.log('[DatabricksUC] SQL executed successfully');
  return result;
}

export async function saveClassificationToUC(record: Omit<ClassificationRecord, 'created_at'>): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[DatabricksUC] Saving classification record:', record.id);

    const imageFlashTruncated = record.image_with_flash.length > 1000 
      ? record.image_with_flash.substring(0, 1000) + '...[truncated]' 
      : record.image_with_flash;
    const imageNoFlashTruncated = record.image_without_flash.length > 1000 
      ? record.image_without_flash.substring(0, 1000) + '...[truncated]' 
      : record.image_without_flash;

    const sql = `
      INSERT INTO ${UC_TABLE} (
        id,
        timestamp,
        image_with_flash,
        image_without_flash,
        predicted_stain_type,
        predicted_category,
        user_feedback,
        corrected_stain_type,
        corrected_category,
        model_used,
        confidence,
        username,
        created_at
      ) VALUES (
        '${escapeSql(record.id)}',
        ${record.timestamp},
        '${escapeSql(imageFlashTruncated)}',
        '${escapeSql(imageNoFlashTruncated)}',
        '${escapeSql(record.predicted_stain_type)}',
        '${escapeSql(record.predicted_category)}',
        '${escapeSql(record.user_feedback)}',
        ${record.corrected_stain_type ? `'${escapeSql(record.corrected_stain_type)}'` : 'NULL'},
        ${record.corrected_category ? `'${escapeSql(record.corrected_category)}'` : 'NULL'},
        '${escapeSql(record.model_used)}',
        ${record.confidence !== null ? record.confidence : 'NULL'},
        '${escapeSql(record.username)}',
        current_timestamp()
      )
    `;

    await executeSQL(sql);
    
    console.log('[DatabricksUC] Classification saved successfully:', record.id);
    return { success: true };
  } catch (error: any) {
    console.error('[DatabricksUC] Failed to save classification:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getClassificationsFromUC(limit: number = 100): Promise<ClassificationRecord[]> {
  try {
    const sql = `SELECT * FROM ${UC_TABLE} ORDER BY timestamp DESC LIMIT ${limit}`;
    const result = await executeSQL(sql);
    
    if (!result.manifest?.schema?.columns || !result.result?.data_array) {
      return [];
    }

    const columns = result.manifest.schema.columns.map((col: any) => col.name);
    const rows = result.result.data_array;

    return rows.map((row: any[]) => {
      const record: any = {};
      columns.forEach((col: string, index: number) => {
        record[col] = row[index];
      });
      return record as ClassificationRecord;
    });
  } catch (error: any) {
    console.error('[DatabricksUC] Failed to get classifications:', error.message);
    return [];
  }
}

export async function getUCStats(): Promise<{
  total: number;
  correct: number;
  incorrect: number;
  byModel: Record<string, { correct: number; total: number }>;
  byStainType: Record<string, { correct: number; total: number }>;
}> {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN user_feedback = 'correct' THEN 1 ELSE 0 END) as correct,
        SUM(CASE WHEN user_feedback = 'incorrect' THEN 1 ELSE 0 END) as incorrect
      FROM ${UC_TABLE}
    `;
    
    const result = await executeSQL(sql);
    const row = result.result?.data_array?.[0] || [0, 0, 0];
    
    return {
      total: parseInt(row[0]) || 0,
      correct: parseInt(row[1]) || 0,
      incorrect: parseInt(row[2]) || 0,
      byModel: {},
      byStainType: {},
    };
  } catch (error: any) {
    console.error('[DatabricksUC] Failed to get stats:', error.message);
    return { total: 0, correct: 0, incorrect: 0, byModel: {}, byStainType: {} };
  }
}

function escapeSql(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export function isDatabricksConfigured(): boolean {
  return !!(DATABRICKS_WORKSPACE_URL && DATABRICKS_CLIENT_ID && DATABRICKS_CLIENT_SECRET && process.env.DATABRICKS_WAREHOUSE_ID);
}
