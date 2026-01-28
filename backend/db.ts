export interface FeedbackRecord {
  id?: string;
  timestamp: number;
  imageWithFlash: string;
  imageWithoutFlash: string;
  predictedStainType: string;
  predictedCategory: string;
  userFeedback: 'correct' | 'incorrect';
  correctedStainType?: string;
  correctedCategory?: string;
  modelUsed: string;
  confidence?: number;
  [key: string]: unknown;
}

export interface UserSettings {
  id?: string;
  selectedModel?: string;
  aiModel?: 'gemma' | 'sonnet';
  apiLanguage?: 'english' | 'spanish';
  databricksConfig?: {
    endpoint: string;
    token: string;
  };
}

export class SurrealFetchClient {
  private endpoint: string;
  private namespace: string;
  private database: string;
  private token: string;

  constructor(endpoint: string, namespace: string, database: string, token: string) {
    // Ensure HTTP(S) protocol
    this.endpoint = endpoint
      .replace('wss://', 'https://')
      .replace('ws://', 'http://');
    
    // Remove trailing slash
    if (this.endpoint.endsWith('/')) {
        this.endpoint = this.endpoint.slice(0, -1);
    }
    
    this.namespace = namespace;
    this.database = database;
    this.token = token;
  }

  async query<T = any[]>(sql: string, vars?: Record<string, unknown>): Promise<T> {
    let finalSql = sql;
    
    // Prepend LET statements for variables
    if (vars && Object.keys(vars).length > 0) {
      const declarations = Object.entries(vars).map(([key, value]) => {
        return `LET $${key} = ${JSON.stringify(value)};`;
      }).join('\n');
      finalSql = `${declarations}\n${sql}`;
    }

    try {
      const response = await fetch(`${this.endpoint}/sql`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'NS': this.namespace,
          'DB': this.database,
          'Authorization': `Bearer ${this.token}`,
        },
        body: finalSql
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[SurrealFetchClient] Query failed:', response.status, text);
        throw new Error(`SurrealDB Error: ${response.status} ${text}`);
      }

      const json = await response.json();
      
      // If we added LET statements, we need to ignore their results (which come first)
      const numVars = vars ? Object.keys(vars).length : 0;
      const actualResults = json.slice(numVars);
      
      // Check for query execution errors in the result
      for (const res of actualResults) {
        if (res.status !== 'OK') {
           console.error('[SurrealFetchClient] Query execution error:', res);
           throw new Error(`SurrealDB Query Error: ${res.detail || res.status}`);
        }
      }

      return actualResults.map((r: any) => r.result) as T;
    } catch (error) {
      console.error('[SurrealFetchClient] Network or parsing error:', error);
      throw error;
    }
  }

  async create<T = any>(thing: string, data: Record<string, unknown>): Promise<T> {
    // Using SQL to create allows us to reuse the query method
    // We use type::table to safely handle the table name
    const results = await this.query<any[]>(`CREATE type::table($tb) CONTENT $data;`, {
        tb: thing,
        data: data
    });
    
    // CREATE returns an array of created records as the result of the query
    // Our query method returns [ resultOfStatement1 ]
    // So results[0] is the array of created records.
    return results[0] as T;
  }
}

let db: SurrealFetchClient | null = null;

export async function getDb(): Promise<SurrealFetchClient> {
  if (db) return db;

  const endpoint = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
  const namespace = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
  const token = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

  console.log('[DB] Initializing with endpoint:', endpoint ? 'set' : 'missing');

  if (!endpoint || !namespace || !token) {
    console.error('[DB] Configuration missing - endpoint:', !!endpoint, 'namespace:', !!namespace, 'token:', !!token);
    throw new Error('Database configuration missing');
  }

  try {
    db = new SurrealFetchClient(endpoint, namespace, 'stainid', token);
    console.log('[DB] Initialized SurrealFetchClient successfully');
    return db;
  } catch (error) {
    console.error('[DB] Failed to initialize:', error);
    throw error;
  }
}
