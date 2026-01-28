# Ecolab Stain ID v8.0

An enterprise mobile application for professional stain identification and treatment recommendation using artificial intelligence.

## Overview

Ecolab Stain ID uses computer vision and multimodal AI models to analyze photographic images of stains and provide:

- **Stain Identification**: Analyzes two images (with and without flash) to identify stain types
- **Treatment Recommendations**: Provides Ecolab-specific cleaning product recommendations
- **Analysis History**: Maintains a gallery of previous analyses with accuracy tracking
- **Feedback System**: Collects user feedback on AI accuracy
- **Multi-language Support**: Available in English and Spanish
- **Biometric Authentication**: Supports Face ID/Touch ID for secure login

### Supported Stain Types

- Foundation
- Iron
- Sunscreen
- Carbon Black
- Mascara
- Lipstick
- Blood
- Ink/Dye/Hair Dye
- Food Soil (Grease)
- Dirt
- Body Soil/Lotion

## Tech Stack

### Frontend
- **React Native 0.81.5** - Cross-platform mobile development
- **Expo 54.0.20** - Development platform and SDK
- **Expo Router 6.0.13** - File-based routing system
- **React 19.1.0** - UI library
- **TypeScript 5.9.2** - Type-safe JavaScript

### State Management
- **Zustand 5.0.2** - Lightweight state management
- **TanStack React Query 5.90.5** - Server state management

### Backend & API
- **tRPC 11.7.2** - Type-safe API framework
- **Hono 4.10.8** - Lightweight web framework
- **SurrealDB 1.3.2** - NoSQL/SQL database

### Authentication & Security
- **Expo LocalAuthentication** - Biometric authentication
- **Expo SecureStore** - Secure credential storage

### Camera & Image Processing
- **expo-camera** - Native camera access
- **expo-image-picker** - Image selection
- **expo-image-manipulator** - Image compression

## Project Structure

```
Ecolab_v8/
├── app/                    # Main app screens (Expo Router)
│   ├── _layout.tsx        # Root layout with auth gate
│   ├── index.tsx          # Home screen
│   ├── login.tsx          # Login screen
│   ├── camera.tsx         # Camera capture screen
│   ├── analysis.tsx       # Results display
│   ├── gallery.tsx        # History of analyzed stains
│   ├── models.tsx         # AI model selection (admin)
│   ├── statistics.tsx     # Analytics dashboard
│   ├── settings.tsx       # App settings
│   └── api/
│       └── [...route].ts  # tRPC API handler
│
├── backend/               # Backend server code
│   ├── hono.ts           # Hono server setup
│   ├── db.ts             # SurrealDB client
│   └── trpc/
│       ├── app-router.ts # Main tRPC router
│       └── routes/       # API endpoints
│
├── hooks/                 # Custom React hooks
│   ├── auth-context.tsx  # Authentication state
│   ├── stain-context.tsx # Stain images state
│   └── language-context.tsx
│
├── utils/                 # Utility functions
│   ├── vision-ai.ts      # AI analysis wrapper
│   ├── stain-data.ts     # Stain colors, treatments
│   ├── token-manager.ts  # OAuth token management
│   └── feedback-storage.ts
│
├── lib/
│   └── trpc.ts           # tRPC client config
│
├── components/            # Reusable components
├── locales/              # Translations (en, es)
└── assets/               # Static assets
```

## Installation

### Prerequisites

- Node.js (v18+ recommended)
- Bun package manager
- iOS: Xcode (for simulator)
- Android: Android Studio (for emulator)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd Ecolab_v8

# Install dependencies
bun install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```env
EXPO_PUBLIC_RORK_API_BASE_URL=<backend-url>
EXPO_PUBLIC_RORK_DB_ENDPOINT=<surrealdb-url>
EXPO_PUBLIC_RORK_DB_NAMESPACE=<namespace>
EXPO_PUBLIC_RORK_DB_TOKEN=<token>
OAUTH_CLIENT_ID=<mulesoft-client-id>
OAUTH_CLIENT_SECRET=<mulesoft-client-secret>
```

## Running the Application

### Development

```bash
# Start development server
bun run start

# Start web preview
bun run start-web

# Start with debug logging
bun run start-web-dev

# Run linting
bun run lint
```

### Testing on Devices

```bash
# iOS Simulator - press 'i' after starting
bun run start

# Android Emulator
bun run start -- --android

# Physical Device
# Scan QR code with Expo Go app
```

## Building for Production

```bash
# Install EAS CLI
bun install -g @expo/eas-cli

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Authentication

The app supports two user roles:

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | admin | Eco@09 | Full access, model selection, statistics reset |
| Tester | tester | Eco01 | Stain identification, gallery, statistics view |

Biometric authentication (Face ID/Touch ID) is available after initial login.

## Key Features

### Dual Image Capture
- Takes two photos: one without flash (natural color) and one with flash (texture)
- Provides complementary information for accurate stain identification

### AI-Powered Analysis
- Claude Sonnet model via Databricks (92% accuracy)
- Gemma model option (85% accuracy)
- Multi-agent prompt for stain differentiation

### Image Compression
- Automatic compression to 400KB max
- 640px width for optimal processing speed
- Maintains accuracy while reducing upload time

### Offline-First Design
- Local data storage with AsyncStorage
- Feedback stored locally
- Privacy-respecting (no tracking SDKs)

## API Architecture

The application uses tRPC for type-safe API communication:

- **stain-analysis**: Stain identification endpoints
- **settings**: User preferences
- **feedback**: Accuracy feedback collection
- **databricks-uc**: Databricks ML integration
- **mulesoft**: OAuth authentication

## Integrations

- **Databricks ML**: Multimodal AI model for stain analysis
- **SurrealDB**: Data persistence
- **MuleSoft API**: OAuth authentication
- **Expo Services**: Build and deployment

## License

End User License Agreement (EULA) - See LICENSE.md

## Support

For issues and feature requests, please contact the Ecolab development team.
