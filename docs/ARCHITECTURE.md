# Architecture Documentation

## System Overview

Ecolab Stain ID follows a modern mobile application architecture with a React Native frontend, tRPC API layer, and cloud-based AI services.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Expo      │  │   React     │  │    Expo Router      │  │
│  │   Camera    │  │   Native    │  │    (Navigation)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                           │                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              State Management                        │    │
│  │   Zustand (Global) + React Query (Server State)     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 tRPC Client                          │    │
│  │         (Type-safe API Communication)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Hono     │  │    tRPC     │  │    SurrealDB        │  │
│  │   Server    │  │   Router    │  │    Client           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Databricks │  │  MuleSoft   │  │    SurrealDB        │  │
│  │  ML Models  │  │    OAuth    │  │    Database         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### Screen Components (`/app`)
- **_layout.tsx**: Root layout with authentication gate, query provider, and navigation setup
- **index.tsx**: Home screen with main menu navigation
- **login.tsx**: Authentication screen with biometric support
- **camera.tsx**: Dual-image capture with flash control
- **analysis.tsx**: AI results display with feedback
- **gallery.tsx**: Historical analysis browser
- **statistics.tsx**: Accuracy metrics dashboard
- **settings.tsx**: User preferences

#### Context Providers (`/hooks`)
- **AuthContext**: User session, login/logout, biometric auth
- **StainContext**: Image state, model selection, analysis results
- **LanguageContext**: i18n localization state

### Backend Architecture

#### API Router Structure
```
AppRouter
├── stainAnalysis
│   ├── analyzeStain (mutation)
│   └── getHistory (query)
├── settings
│   ├── get (query)
│   └── update (mutation)
├── feedback
│   ├── submit (mutation)
│   └── export (query)
├── databricksUc
│   └── invoke (mutation)
└── mulesoft
    └── getToken (query)
```

## Data Flow

### Stain Analysis Flow

```
1. User captures two images (flash/no-flash)
           │
           ▼
2. Images compressed (400KB max, 640px width)
           │
           ▼
3. tRPC mutation: analyzeStain
           │
           ▼
4. Backend formats request for Databricks
           │
           ▼
5. Databricks ML model processes images
           │
           ▼
6. Response parsed and formatted
           │
           ▼
7. Results cached in React Query
           │
           ▼
8. UI displays stain type + treatment
           │
           ▼
9. User provides feedback (optional)
           │
           ▼
10. Feedback stored in AsyncStorage
```

### Authentication Flow

```
1. User enters credentials
           │
           ▼
2. Credentials validated locally
           │
           ▼
3. Session stored in AsyncStorage
           │
           ▼
4. (Optional) Credentials saved to SecureStore
           │
           ▼
5. Future logins: Biometric → SecureStore → Auto-login
```

## State Management Strategy

### Zustand Stores
- **User state**: Current user, role, session
- **UI state**: Loading states, modal visibility
- **Preferences**: Language, theme settings

### React Query
- **Server state**: API responses, analysis results
- **Caching**: 2-minute cache for identical requests
- **Retry logic**: 12 attempts with exponential backoff

### Local Storage
- **AsyncStorage**: User data, feedback, settings
- **SecureStore**: Credentials for biometric auth

## Security Architecture

### Authentication Layers
1. **Username/Password**: Initial authentication
2. **Biometric**: Face ID/Touch ID verification
3. **SecureStore**: Encrypted credential storage
4. **Role-based access**: Admin vs Tester permissions

### Data Protection
- No sensitive data sent to external analytics
- Local-first data storage
- Encrypted credential storage
- Session-based authentication

## Error Handling

### Network Resilience
- 60-second request timeout
- 12 retry attempts
- Exponential backoff strategy
- Graceful degradation for offline mode

### Error Boundaries
- React error boundaries catch component crashes
- Fallback UI for error states
- Error logging for debugging

## Performance Optimizations

### Image Processing
- Aggressive compression reduces upload time
- 640px max width balances quality/speed
- JPEG format for smaller file sizes

### Caching Strategy
- React Query caching prevents redundant API calls
- 2-minute cache for analysis results
- Stale-while-revalidate pattern

### Bundle Optimization
- Expo manages code splitting
- Lazy loading for non-critical screens
- Tree shaking for unused code
