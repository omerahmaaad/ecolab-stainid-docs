# API Documentation

## Overview

Ecolab Stain ID uses tRPC for type-safe API communication between the React Native frontend and the Hono backend server.

## Base Configuration

```typescript
// lib/trpc.ts
const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_BASE_URL}/api/trpc`,
      maxURLLength: 2083,
    }),
  ],
  transformer: superjson,
});
```

## API Endpoints

### Stain Analysis

#### `stainAnalysis.analyzeStain`

Analyzes captured stain images using AI models.

**Type**: Mutation

**Input**:
```typescript
{
  imageWithFlash: string;    // Base64 encoded image
  imageWithoutFlash: string; // Base64 encoded image
  model: 'claude' | 'gemma'; // AI model selection
  language: 'en' | 'es';     // Response language
}
```

**Output**:
```typescript
{
  stainType: string;         // Identified stain type
  category: string;          // Stain category
  confidence: number;        // 0-100 confidence score
  treatment: {
    product: string;         // Ecolab product name
    instructions: string;    // Usage instructions
    productImage: string;    // Product image URL
  };
  reasoning: string;         // AI analysis explanation
  timestamp: string;         // ISO timestamp
}
```

**Example Usage**:
```typescript
const result = await trpc.stainAnalysis.analyzeStain.mutate({
  imageWithFlash: base64FlashImage,
  imageWithoutFlash: base64NoFlashImage,
  model: 'claude',
  language: 'en',
});
```

---

#### `stainAnalysis.getHistory`

Retrieves analysis history for the current user.

**Type**: Query

**Input**: None

**Output**:
```typescript
Array<{
  id: string;
  stainType: string;
  timestamp: string;
  imageUrl: string;
  wasCorrect: boolean | null;
}>
```

---

### Settings

#### `settings.get`

Retrieves user settings.

**Type**: Query

**Output**:
```typescript
{
  language: 'en' | 'es';
  biometricEnabled: boolean;
  selectedModel: 'claude' | 'gemma';
  notifications: boolean;
}
```

---

#### `settings.update`

Updates user settings.

**Type**: Mutation

**Input**:
```typescript
{
  language?: 'en' | 'es';
  biometricEnabled?: boolean;
  selectedModel?: 'claude' | 'gemma';
  notifications?: boolean;
}
```

---

### Feedback

#### `feedback.submit`

Submits accuracy feedback for an analysis.

**Type**: Mutation

**Input**:
```typescript
{
  analysisId: string;
  wasCorrect: boolean;
  correctStainType?: string; // If wasCorrect is false
  comments?: string;
}
```

**Output**:
```typescript
{
  success: boolean;
  feedbackId: string;
}
```

---

#### `feedback.export`

Exports feedback data for analysis.

**Type**: Query

**Output**:
```typescript
{
  totalAnalyses: number;
  correctPredictions: number;
  accuracyRate: number;
  feedbackByStainType: Record<string, {
    total: number;
    correct: number;
    accuracy: number;
  }>;
}
```

---

### Databricks Integration

#### `databricksUc.invoke`

Invokes Databricks ML model endpoint.

**Type**: Mutation

**Input**:
```typescript
{
  endpoint: string;
  payload: {
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string | Array<{
        type: 'text' | 'image_url';
        text?: string;
        image_url?: { url: string };
      }>;
    }>;
  };
}
```

**Output**:
```typescript
{
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}
```

---

### MuleSoft OAuth

#### `mulesoft.getToken`

Retrieves OAuth access token.

**Type**: Query

**Output**:
```typescript
{
  access_token: string;
  token_type: string;
  expires_in: number;
}
```

---

## Error Handling

### Error Response Format

```typescript
{
  error: {
    code: string;
    message: string;
    data?: any;
  };
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or expired authentication |
| `BAD_REQUEST` | Invalid request parameters |
| `INTERNAL_SERVER_ERROR` | Server processing error |
| `TIMEOUT` | Request exceeded time limit |
| `RATE_LIMITED` | Too many requests |

### Retry Configuration

```typescript
const retryConfig = {
  maxRetries: 12,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 1.5,
  retryableStatusCodes: [502, 503, 504],
};
```

## Rate Limits

- **Analysis requests**: 60/minute per user
- **Settings updates**: 30/minute per user
- **Feedback submissions**: 100/minute per user

## Authentication

All API requests require authentication via session token:

```typescript
headers: {
  'Authorization': `Bearer ${sessionToken}`,
  'Content-Type': 'application/json',
}
```

## Response Caching

React Query caching configuration:

```typescript
{
  staleTime: 2 * 60 * 1000,  // 2 minutes
  cacheTime: 5 * 60 * 1000,  // 5 minutes
  retry: 3,
  retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
}
```
