# Mobile App Development Guide

## Prerequisites

- Node.js 18+ installed
- npm package manager
- Expo CLI (`npm install -g @expo/cli`)
- For iOS development: macOS with Xcode
- For Android development: Android Studio with SDK

## Getting Started

### 1. Install Dependencies

From the project root:
```bash
npm install
```

Or specifically for the mobile app:
```bash
npm install --workspace=mobile
```

### 2. Environment Setup

1. Copy the environment template:
   ```bash
   cp apps/mobile/env.example apps/mobile/.env
   ```

2. Fill in your Supabase credentials in `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

### 3. Development Server

Start the development server:
```bash
# From project root
npm run mobile:dev

# Or from apps/mobile directory
npm run dev
```

This will start the Expo development server and show a QR code.

### 4. Running on Devices

#### iOS Simulator (macOS only)
```bash
npm run mobile:ios
```

#### Android Emulator
```bash
npm run mobile:android
```

#### Physical Device
1. Install Expo Go app from App Store/Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # API and data services
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── assets/                  # Images, fonts, etc.
├── __tests__/              # Test files
├── App.tsx                 # Root component
├── app.json                # Expo configuration
├── metro.config.js         # Metro bundler config
└── tsconfig.json           # TypeScript config
```

## Key Features Implemented

### ✅ Authentication
- Login/Register screens
- Supabase Auth integration
- Secure session management

### ✅ Navigation
- Tab-based navigation
- Stack navigation for sourcing flow
- TypeScript navigation types

### ✅ Camera Functionality
- Photo capture with Expo Camera
- Camera permissions handling
- Photo preview and confirmation

### ✅ Item Capture Form
- Title, description, location fields
- Form validation
- Photo attachment

### ✅ Real-time Data Sync
- Supabase real-time subscriptions
- Automatic UI updates
- Offline support foundation

## Development Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Start development server
npm run dev

# iOS development
npm run ios

# Android development
npm run android

# Web development (for testing)
npm run web
```

## Troubleshooting

### Common Issues

1. **Metro bundler cache issues**
   ```bash
   npx expo start --clear
   ```

2. **Node modules conflicts**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript errors**
   ```bash
   npm run type-check
   ```

4. **Environment variables not working**
   - Ensure `.env` file exists in `apps/mobile/`
   - Restart the development server after changing env vars
   - Use `EXPO_PUBLIC_` prefix for client-side variables

### Platform-specific Issues

#### iOS
- Requires macOS for development
- Xcode must be installed for simulator
- Check iOS simulator is running

#### Android
- Android Studio must be installed
- Android SDK and emulator configured
- Check emulator is running

## Code Quality

### TypeScript
- Strict mode enabled
- Path aliases configured (`@/` points to `src/`)
- Shared types from monorepo

### Linting
- ESLint with TypeScript support
- Expo-specific rules
- Consistent code formatting

### Testing
- Jest and React Native Testing Library setup
- Component and service testing
- Test coverage reporting

## Deployment

### Development Builds
```bash
# Create development build
expo build:android
expo build:ios
```

### Production Builds
- Configure app signing
- Update version in app.json
- Submit to app stores

## Integration with Web App

### Shared Data
- Same Supabase database
- Shared authentication system
- Real-time sync between platforms

### Shared Types
- Database types from `packages/shared-types`
- API interfaces
- Authentication types

## Next Steps

1. **Enhanced UI/UX**
   - Custom icons and branding
   - Improved styling
   - Loading states and animations

2. **Advanced Features**
   - Photo editing and filters
   - GPS location tagging
   - Barcode scanning

3. **Offline Support**
   - Local data caching
   - Sync queue for offline actions
   - Conflict resolution

4. **Testing**
   - Unit tests for all services
   - Integration tests for flows
   - E2E testing with Detox

5. **Performance**
   - Image optimization
   - Bundle size optimization
   - Performance monitoring