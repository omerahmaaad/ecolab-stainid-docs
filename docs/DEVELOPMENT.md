# Development Guide

## Development Environment Setup

### Prerequisites

- **Node.js**: v18 or higher (use nvm for version management)
- **Bun**: Package manager (`npm install -g bun`)
- **Xcode**: For iOS development (macOS only)
- **Android Studio**: For Android development
- **Git**: Version control

### IDE Setup

**Recommended**: VS Code with extensions:
- ESLint
- Prettier
- TypeScript
- React Native Tools
- Expo Tools

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd Ecolab_v8

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your values
```

---

## Development Workflow

### Starting Development Server

```bash
# Standard start (with tunnel for device testing)
bun run start

# Web preview (fastest iteration)
bun run start-web

# Web with debug logging
bun run start-web-dev
```

### Running on Devices

```bash
# iOS Simulator
# Press 'i' after bun run start

# Android Emulator
# Press 'a' after bun run start

# Physical device
# Scan QR code with Expo Go app
```

### Code Quality

```bash
# Run linter
bun run lint

# Fix lint errors automatically
bun run lint --fix

# Type checking
bun run tsc --noEmit
```

---

## Project Structure Deep Dive

### `/app` - Screen Components

Expo Router uses file-based routing:

```
app/
├── _layout.tsx      # Root layout (providers, auth gate)
├── index.tsx        # / (home screen)
├── login.tsx        # /login
├── camera.tsx       # /camera
├── analysis.tsx     # /analysis
├── gallery.tsx      # /gallery
├── statistics.tsx   # /statistics
├── settings.tsx     # /settings
├── models.tsx       # /models
└── api/
    └── [...route].ts # API catch-all route
```

### `/backend` - Server Code

```
backend/
├── hono.ts              # Server initialization
├── db.ts                # SurrealDB client
└── trpc/
    ├── app-router.ts    # Combined router
    ├── create-context.ts # Request context
    └── routes/
        ├── stain-analysis.ts
        ├── settings.ts
        ├── feedback.ts
        ├── databricks-uc.ts
        └── mulesoft.ts
```

### `/hooks` - React Contexts

```
hooks/
├── auth-context.tsx     # Authentication state
├── stain-context.tsx    # Image & model state
└── language-context.tsx # i18n state
```

### `/utils` - Utilities

```
utils/
├── vision-ai.ts         # AI analysis wrapper
├── stain-data.ts        # Stain metadata
├── token-manager.ts     # OAuth tokens
├── feedback-storage.ts  # Local storage
├── feedback-helpers.ts  # Feedback utilities
├── image-utils.ts       # Image processing
├── learning-engine.ts   # ML weights
├── oauth-config.ts      # OAuth config
├── databricks-uc.ts     # Databricks client
├── mulesoft-api.ts      # MuleSoft client
└── camera-autofocus.ts  # Camera utilities
```

---

## Adding New Features

### Adding a New Screen

1. Create file in `/app`:

```typescript
// app/new-screen.tsx
import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/auth-context';

export default function NewScreen() {
  const { user } = useAuth();

  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}
```

2. Add navigation from home screen:

```typescript
// In app/index.tsx
<TouchableOpacity onPress={() => router.push('/new-screen')}>
  <Text>Go to New Screen</Text>
</TouchableOpacity>
```

### Adding a New API Endpoint

1. Create route file:

```typescript
// backend/trpc/routes/new-feature.ts
import { router, publicProcedure } from '../app-router';
import { z } from 'zod';

export const newFeatureRouter = router({
  getData: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      // Implementation
      return { data: 'result' };
    }),

  saveData: publicProcedure
    .input(z.object({ value: z.string() }))
    .mutation(async ({ input }) => {
      // Implementation
      return { success: true };
    }),
});
```

2. Add to app router:

```typescript
// backend/trpc/app-router.ts
import { newFeatureRouter } from './routes/new-feature';

export const appRouter = router({
  // ... existing routes
  newFeature: newFeatureRouter,
});
```

3. Use in frontend:

```typescript
// In a component
const { data } = trpc.newFeature.getData.useQuery({ id: '123' });
const mutation = trpc.newFeature.saveData.useMutation();
```

### Adding Translations

1. Add keys to English:

```typescript
// locales/en.ts
export default {
  // ... existing
  newFeature: {
    title: 'New Feature',
    description: 'This is a new feature',
  },
};
```

2. Add keys to Spanish:

```typescript
// locales/es.ts
export default {
  // ... existing
  newFeature: {
    title: 'Nueva Función',
    description: 'Esta es una nueva función',
  },
};
```

3. Use in components:

```typescript
import { useLanguage } from '@/hooks/language-context';

function Component() {
  const { t } = useLanguage();
  return <Text>{t('newFeature.title')}</Text>;
}
```

---

## Testing

### Manual Testing Checklist

- [ ] Login with admin credentials
- [ ] Login with tester credentials
- [ ] Enable biometric authentication
- [ ] Capture stain images
- [ ] View analysis results
- [ ] Submit feedback
- [ ] Browse gallery
- [ ] View statistics
- [ ] Change language
- [ ] Test connection
- [ ] Logout

### Device Testing

Test on multiple devices:
- iOS Simulator (various iPhone models)
- Android Emulator (various screen sizes)
- Physical iOS device
- Physical Android device

---

## Building & Deployment

### Development Build

```bash
# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview Build

```bash
# Create preview build for testing
eas build --profile preview --platform all
```

### Production Build

```bash
# Create production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### App Store Submission

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

---

## Environment Configuration

### EAS Build Profiles

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

### Environment Variables

Required for all environments:
```
EXPO_PUBLIC_RORK_API_BASE_URL
EXPO_PUBLIC_RORK_DB_ENDPOINT
EXPO_PUBLIC_RORK_DB_NAMESPACE
EXPO_PUBLIC_RORK_DB_TOKEN
```

Additional for production:
```
OAUTH_CLIENT_ID
OAUTH_CLIENT_SECRET
```

---

## Debugging

### React Native Debugger

1. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
2. Select "Debug Remote JS"
3. Open Chrome DevTools

### Console Logging

```typescript
// Debug logging
console.log('Debug:', data);

// For production, use conditional logging
if (__DEV__) {
  console.log('Development only log');
}
```

### Network Debugging

Use React Native Debugger or Flipper to inspect:
- API requests/responses
- Network timing
- Request headers

---

## Common Issues

### Metro Bundler Issues

```bash
# Clear Metro cache
bun run start --clear

# Reset completely
rm -rf node_modules
bun install
bun run start --clear
```

### TypeScript Errors

```bash
# Check types
bun run tsc --noEmit

# Regenerate types
rm -rf node_modules/.cache
bun install
```

### Build Failures

```bash
# Clean Expo cache
expo start -c

# For EAS builds
eas build --clear-cache
```
