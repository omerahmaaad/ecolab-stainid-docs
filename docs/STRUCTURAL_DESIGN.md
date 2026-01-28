# Structural Design - Ecolab Stain ID v8.0

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    React Native Screens (app/)                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │ │
│  │  │  Login   │ │  Camera  │ │ Analysis │ │ Gallery  │ │  Stats  │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘ │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                          │ │
│  │  │ Settings │ │  Models  │ │   Home   │                          │ │
│  │  └──────────┘ └──────────┘ └──────────┘                          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          STATE MANAGEMENT LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  AuthContext    │  │  StainContext   │  │  LanguageContext       │ │
│  │  (Zustand)      │  │  (Zustand)      │  │  (i18n)                │ │
│  │  - User         │  │  - Images       │  │  - Current Language    │ │
│  │  - Session      │  │  - Model Select │  │  - Translations        │ │
│  │  - Biometric    │  │  - Results      │  │  - t() function        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              React Query (TanStack Query)                        │    │
│  │  - Server State Caching                                          │    │
│  │  - Automatic Refetching                                          │    │
│  │  - Optimistic Updates                                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                           API COMMUNICATION LAYER                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                        tRPC Client (lib/)                        │    │
│  │  - Type-safe API calls                                           │    │
│  │  - Automatic TypeScript inference                                │    │
│  │  - SuperJSON transformer                                         │    │
│  │  - HTTP batch link                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND SERVER LAYER                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Hono Server (backend/)                        │    │
│  │  - CORS enabled                                                  │    │
│  │  - Request logging                                               │    │
│  │  - Error handling                                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    tRPC Router (backend/trpc/)                   │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐    │    │
│  │  │ stainAnalysis │  │   settings    │  │    feedback      │    │    │
│  │  │  - analyze    │  │   - get       │  │    - submit      │    │    │
│  │  │  - history    │  │   - update    │  │    - export      │    │    │
│  │  └───────────────┘  └───────────────┘  └──────────────────┘    │    │
│  │  ┌───────────────┐  ┌───────────────┐                          │    │
│  │  │ databricksUc  │  │   mulesoft    │                          │    │
│  │  │  - invoke     │  │   - getToken  │                          │    │
│  │  └───────────────┘  └───────────────┘                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                           UTILITY & HELPER LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Token Manager  │  │  Vision AI      │  │  Image Utils           │ │
│  │  - OAuth flow   │  │  - AI analysis  │  │  - Compression         │ │
│  │  - Token cache  │  │  - Prompts      │  │  - Base64 conversion   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ Feedback Store  │  │  Stain Data     │  │  OAuth Config          │ │
│  │  - Local cache  │  │  - Treatments   │  │  - Credentials         │ │
│  │  - Accuracy     │  │  - Colors       │  │  - Endpoints           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA PERSISTENCE LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  AsyncStorage   │  │  SecureStore    │  │  In-Memory Cache       │ │
│  │  - User data    │  │  - Credentials  │  │  - Token cache         │ │
│  │  - Settings     │  │  - Biometrics   │  │  - API responses       │ │
│  │  - Feedback     │  │                 │  │                        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES LAYER                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Databricks ML  │  │  MuleSoft OAuth │  │  SurrealDB             │ │
│  │  - Claude Model │  │  - Token gen    │  │  - User settings       │ │
│  │  - Gemma Model  │  │  - Auth service │  │  - Feedback data       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Presentation Layer (app/)

```
app/
├── _layout.tsx                 # Root Layout
│   ├── Navigation Setup
│   ├── Context Providers
│   │   ├── AuthContext
│   │   ├── StainContext
│   │   └── LanguageContext
│   ├── React Query Provider
│   └── Auth Gate
│
├── index.tsx                   # Home Screen
│   ├── Main Menu
│   ├── Navigation Buttons
│   └── User Info Display
│
├── login.tsx                   # Authentication
│   ├── Username/Password Input
│   ├── Biometric Login
│   ├── Session Management
│   └── Error Handling
│
├── camera.tsx                  # Image Capture
│   ├── Camera Component
│   ├── Flash Control
│   ├── Image Compression
│   └── Dual Capture Logic
│
├── analysis.tsx                # Results Display
│   ├── AI Results
│   ├── Treatment Info
│   ├── Feedback Widget
│   └── Share/Export
│
├── gallery.tsx                 # History Browser
│   ├── Folder View
│   ├── Image Grid
│   ├── Detail View
│   └── Accuracy Display
│
├── statistics.tsx              # Analytics
│   ├── Accuracy Metrics
│   ├── Charts/Graphs
│   ├── Per-Stain Breakdown
│   └── Admin Controls
│
├── settings.tsx                # User Preferences
│   ├── Language Selector
│   ├── Connection Test
│   ├── Account Info
│   └── Logout
│
└── models.tsx                  # Model Selection (Admin)
    ├── Claude Sonnet Option
    ├── Gemma Option
    └── Model Info Display
```

### 2. State Management Layer

```
hooks/
│
├── auth-context.tsx            # Authentication State
│   ├── State:
│   │   ├── user: User | null
│   │   ├── isAuthenticated: boolean
│   │   └── biometricEnabled: boolean
│   ├── Actions:
│   │   ├── login(username, password)
│   │   ├── logout()
│   │   ├── enableBiometric()
│   │   └── biometricLogin()
│   └── Effects:
│       ├── Load saved session
│       └── Handle session expiry
│
├── stain-context.tsx           # Stain Analysis State
│   ├── State:
│   │   ├── imageWithFlash: string | null
│   │   ├── imageWithoutFlash: string | null
│   │   ├── selectedModel: 'claude' | 'gemma'
│   │   ├── analysisResult: Result | null
│   │   └── isAnalyzing: boolean
│   ├── Actions:
│   │   ├── setImages(flash, noFlash)
│   │   ├── setModel(model)
│   │   ├── clearImages()
│   │   └── setResult(result)
│   └── Selectors:
│       ├── hasImages()
│       └── canAnalyze()
│
└── language-context.tsx        # Localization State
    ├── State:
    │   └── language: 'en' | 'es'
    ├── Actions:
    │   └── setLanguage(lang)
    ├── Functions:
    │   └── t(key): string
    └── Effects:
        └── Load saved preference
```

### 3. API Communication Layer

```
lib/trpc.ts                     # tRPC Client
├── HTTP Batch Link
├── SuperJSON Transformer
├── Retry Configuration
└── Error Handling

backend/trpc/
│
├── app-router.ts               # Main Router
│   ├── stainAnalysis router
│   ├── settings router
│   ├── feedback router
│   ├── databricksUc router
│   └── mulesoft router
│
├── create-context.ts           # Request Context
│   ├── User info
│   ├── Request metadata
│   └── Database connections
│
└── routes/
    │
    ├── stain-analysis.ts       # Stain Analysis API
    │   ├── analyze mutation
    │   │   ├── Input validation
    │   │   ├── Token acquisition
    │   │   ├── Databricks call
    │   │   └── Response parsing
    │   └── getHistory query
    │
    ├── settings.ts             # Settings API
    │   ├── get query
    │   └── update mutation
    │
    ├── feedback.ts             # Feedback API
    │   ├── submit mutation
    │   └── export query
    │
    ├── databricks-uc.ts        # Databricks Integration
    │   └── invoke mutation
    │
    └── mulesoft.ts             # OAuth Integration
        └── getToken query
```

### 4. Utility Layer

```
utils/
│
├── vision-ai.ts                # AI Analysis Wrapper
│   ├── analyzeStain()
│   ├── formatPrompt()
│   └── parseResponse()
│
├── token-manager.ts            # OAuth Token Management
│   ├── fetchAccessToken()
│   ├── getValidToken()
│   ├── clearTokenCache()
│   ├── isTokenValid()
│   └── Platform-specific timeouts
│
├── image-utils.ts              # Image Processing
│   ├── compressImage()
│   ├── resizeImage()
│   ├── convertToBase64()
│   └── Image validation
│
├── stain-data.ts               # Stain Metadata
│   ├── Stain type definitions
│   ├── Color mappings
│   ├── Treatment recommendations
│   └── Product information
│
├── feedback-storage.ts         # Feedback Persistence
│   ├── saveFeedback()
│   ├── getFeedback()
│   ├── calculateAccuracy()
│   └── exportFeedback()
│
├── feedback-helpers.ts         # Feedback Utilities
│   ├── buildFeedbackEntry()
│   └── validateFeedback()
│
├── oauth-config.ts             # OAuth Configuration
│   ├── OAUTH_CONFIG
│   ├── TokenCache interface
│   └── buildTokenRequestBody()
│
├── databricks-uc.ts            # Databricks Client
│   ├── invokeDatabricks()
│   └── formatRequest()
│
├── mulesoft-api.ts             # MuleSoft Client
│   ├── getMulesoftToken()
│   └── API configuration
│
└── camera-autofocus.ts         # Camera Utilities
    ├── Auto-focus logic
    └── Camera permissions
```

---

## Data Flow Architecture

### User Authentication Flow

```
┌─────────┐    credentials    ┌──────────────┐    validate    ┌─────────────┐
│  User   │ ────────────────> │ login.tsx    │ ─────────────> │ AuthContext │
└─────────┘                    └──────────────┘                └─────────────┘
                                      │                               │
                                      │ biometric                     │ save
                                      ▼                               ▼
                              ┌──────────────┐                ┌─────────────┐
                              │ SecureStore  │                │ AsyncStorage│
                              └──────────────┘                └─────────────┘
```

### Stain Analysis Flow

```
┌─────────┐   capture   ┌──────────────┐   compress   ┌─────────────────┐
│ Camera  │ ──────────> │ camera.tsx   │ ───────────> │ image-utils.ts  │
└─────────┘             └──────────────┘              └─────────────────┘
                               │                                │
                               │ store                          │ base64
                               ▼                                ▼
                        ┌──────────────┐                ┌─────────────────┐
                        │StainContext  │                │   tRPC Client   │
                        └──────────────┘                └─────────────────┘
                                                                 │
                                                                 │ mutation
                                                                 ▼
                        ┌──────────────┐   OAuth    ┌─────────────────────┐
                        │Token Manager │ <────────> │ stain-analysis.ts   │
                        └──────────────┘            └─────────────────────┘
                                                                 │
                                                                 │ invoke
                                                                 ▼
                        ┌──────────────┐            ┌─────────────────────┐
                        │ Databricks   │ <────────> │   vision-ai.ts      │
                        │   ML API     │   analyze  └─────────────────────┘
                        └──────────────┘
                               │
                               │ result
                               ▼
                        ┌──────────────┐   display   ┌─────────────────┐
                        │ analysis.tsx │ <────────── │  React Query    │
                        └──────────────┘             └─────────────────┘
                               │
                               │ feedback
                               ▼
                        ┌──────────────┐    save    ┌─────────────────┐
                        │feedback.ts   │ ─────────> │ AsyncStorage    │
                        └──────────────┘            └─────────────────┘
```

### Settings & Localization Flow

```
┌─────────┐   select    ┌──────────────┐   update   ┌──────────────────┐
│  User   │ ──────────> │ settings.tsx │ ─────────> │LanguageContext   │
└─────────┘             └──────────────┘            └──────────────────┘
                                                              │
                                                              │ apply
                                                              ▼
                        ┌──────────────┐            ┌──────────────────┐
                        │   i18n.ts    │ <────────> │  All Screens     │
                        └──────────────┘   t(key)   └──────────────────┘
                               │
                               │ persist
                               ▼
                        ┌──────────────┐
                        │ AsyncStorage │
                        └──────────────┘
```

---

## Design Patterns Used

### 1. **Context Provider Pattern**
- **Purpose**: Global state management
- **Implementation**: AuthContext, StainContext, LanguageContext
- **Benefits**: Avoids prop drilling, centralized state

### 2. **Repository Pattern**
- **Purpose**: Data access abstraction
- **Implementation**: feedback-storage.ts, token-manager.ts
- **Benefits**: Testable, swappable storage backends

### 3. **Factory Pattern**
- **Purpose**: Object creation
- **Implementation**: buildTokenRequestBody(), buildFeedbackEntry()
- **Benefits**: Consistent object creation, encapsulation

### 4. **Strategy Pattern**
- **Purpose**: Algorithm selection
- **Implementation**: Model selection (Claude vs Gemma)
- **Benefits**: Runtime algorithm switching

### 5. **Singleton Pattern**
- **Purpose**: Single instance management
- **Implementation**: Token cache, tRPC client
- **Benefits**: Shared state, memory efficiency

### 6. **Observer Pattern**
- **Purpose**: State change notifications
- **Implementation**: Zustand stores, React Query
- **Benefits**: Reactive updates, decoupled components

### 7. **Facade Pattern**
- **Purpose**: Simplified interface
- **Implementation**: vision-ai.ts wrapper
- **Benefits**: Hides complexity, easier to use

### 8. **Middleware Pattern**
- **Purpose**: Request/response processing
- **Implementation**: tRPC procedures, Hono middleware
- **Benefits**: Reusable logic, separation of concerns

---

## Key Architectural Decisions

### 1. **Expo Router for Navigation**
- **Decision**: File-based routing
- **Rationale**:
  - Simplifies navigation structure
  - Type-safe route parameters
  - Deep linking support
- **Trade-offs**: Learning curve for developers used to React Navigation

### 2. **tRPC for API Layer**
- **Decision**: Type-safe RPC framework
- **Rationale**:
  - End-to-end type safety
  - No code generation
  - Excellent TypeScript inference
- **Trade-offs**: Couples frontend and backend more tightly

### 3. **Dual Image Capture**
- **Decision**: Flash + No Flash photos
- **Rationale**:
  - Color analysis from no-flash image
  - Texture/wicking from flash image
  - Higher AI accuracy
- **Trade-offs**: Double upload time, more storage

### 4. **Local-First Data Storage**
- **Decision**: AsyncStorage for most data
- **Rationale**:
  - Offline capability
  - Privacy (no unnecessary data transmission)
  - Fast access
- **Trade-offs**: No cross-device sync

### 5. **Aggressive Image Compression**
- **Decision**: 400KB max, 640px width
- **Rationale**:
  - Faster uploads
  - Reduced bandwidth costs
  - Acceptable accuracy trade-off
- **Trade-offs**: Potential quality loss

### 6. **Client-Side Token Caching**
- **Decision**: In-memory token cache with expiry
- **Rationale**:
  - Reduces auth API calls
  - Faster requests
  - Better UX
- **Trade-offs**: Complexity in cache invalidation

### 7. **Role-Based UI Rendering**
- **Decision**: Conditional rendering based on user role
- **Rationale**:
  - Simple implementation
  - No separate admin app needed
  - Single codebase
- **Trade-offs**: Admin code shipped to all users

---

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Security Layers                            │
├──────────────────────────────────────────────────────────────────┤
│ Layer 1: Authentication                                           │
│  ├── Username/Password validation                                │
│  ├── Biometric (Face ID / Touch ID)                              │
│  └── Session management                                           │
├──────────────────────────────────────────────────────────────────┤
│ Layer 2: Credential Storage                                       │
│  ├── SecureStore (encrypted keychain)                            │
│  └── AsyncStorage (non-sensitive data)                           │
├──────────────────────────────────────────────────────────────────┤
│ Layer 3: API Authorization                                        │
│  ├── OAuth 2.0 tokens                                             │
│  ├── Bearer token authentication                                  │
│  └── Token expiry & refresh                                       │
├──────────────────────────────────────────────────────────────────┤
│ Layer 4: Data Transmission                                        │
│  ├── HTTPS only                                                   │
│  ├── Certificate pinning (production)                             │
│  └── No sensitive data in logs                                    │
├──────────────────────────────────────────────────────────────────┤
│ Layer 5: Role-Based Access                                        │
│  ├── Admin vs Tester permissions                                  │
│  ├── Feature gating                                               │
│  └── UI conditional rendering                                     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimizations

### 1. **Image Compression Pipeline**
```
Raw Image (2-5MB)
    ↓
Resize to 640px width
    ↓
JPEG compression (40% quality)
    ↓
Validate size < 400KB
    ↓
Convert to base64
    ↓
Send to API
```

### 2. **Caching Strategy**
- **Token Cache**: In-memory, 1-hour TTL
- **React Query Cache**: 2-minute stale time
- **API Response Cache**: Dedupe identical requests
- **Image Cache**: Expo's native cache

### 3. **Lazy Loading**
- Screens loaded on-demand
- Heavy dependencies code-split
- Images lazy-loaded in gallery

### 4. **Retry Logic**
```
Request → Fail (502/503/504)
    ↓
Retry 1 (1s delay)
    ↓
Retry 2 (2s delay)
    ↓
...
    ↓
Retry 12 (30s delay)
    ↓
Final error
```

---

## Scalability Considerations

### 1. **Horizontal Scaling**
- Backend is stateless (can run multiple instances)
- Token caching prevents auth bottleneck
- SurrealDB can be clustered

### 2. **Vertical Scaling**
- Image compression reduces bandwidth
- Efficient React Native rendering
- Minimal re-renders with Zustand

### 3. **Future Enhancements**
- CDN for static assets
- Edge caching for API responses
- Background sync for feedback data
- Multi-region deployment

---

## Testing Strategy

### Unit Tests
- Utility functions (image-utils, token-manager)
- State management (Zustand stores)
- Data transformations

### Integration Tests
- tRPC procedures
- API route handlers
- Authentication flows

### E2E Tests
- Login → Capture → Analysis → Feedback
- Gallery navigation
- Settings changes

### Performance Tests
- Image compression benchmarks
- API response times
- Memory profiling

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │     iOS     │  │   Android   │  │        Web          │ │
│  │   (Expo)    │  │   (Expo)    │  │     (Browser)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server (Hono)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Cloud Run / Vercel / Docker                 ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   Databricks    │  │    MuleSoft     │  │   SurrealDB      │
│   ML Endpoints  │  │  OAuth Service  │  │   Database       │
└─────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## Technology Justification

| Technology | Purpose | Why Chosen |
|------------|---------|------------|
| **React Native** | Mobile framework | Cross-platform, large ecosystem, TypeScript support |
| **Expo** | Build & deploy | Simplifies native setup, OTA updates, managed workflow |
| **TypeScript** | Type safety | Compile-time errors, better IDE support, maintainability |
| **tRPC** | API layer | Type-safe, no codegen, great DX |
| **Hono** | Backend server | Lightweight, fast, edge-compatible |
| **Zustand** | State management | Simple API, minimal boilerplate, TypeScript-first |
| **React Query** | Server state | Caching, refetching, optimistic updates |
| **Bun** | Package manager | Fast installs, built-in TypeScript support |
| **SurrealDB** | Database | NoSQL + SQL hybrid, real-time capabilities |

---

## Future Structural Enhancements

### 1. **Microservices Architecture**
```
Current: Monolithic backend
Future: Split into services
  - Auth Service
  - Analysis Service
  - Storage Service
  - Analytics Service
```

### 2. **Event-Driven Architecture**
```
Current: Synchronous API calls
Future: Event bus for async operations
  - Image uploaded → Event
  - Analysis complete → Event
  - Feedback submitted → Event
```

### 3. **Progressive Web App (PWA)**
```
Current: Native mobile apps + basic web
Future: Full PWA with offline support
  - Service workers
  - Local database (IndexedDB)
  - Push notifications
```

### 4. **Plugin Architecture**
```
Current: Monolithic features
Future: Pluggable features
  - Custom stain types
  - Alternative AI models
  - Custom treatments
```
