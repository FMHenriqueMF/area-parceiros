# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` or `pnpm dev`
- **Build for production**: `npm run build` (runs TypeScript compilation then Vite build)
- **Lint code**: `npm run lint` (ESLint with TypeScript support)
- **Preview build**: `npm run preview`
- **Populate database**: `node populate-db.js` (to load initial service data)

## Project Architecture

This is a React + TypeScript + Vite application for a partner/technician service management platform with Firebase integration.

### Core Architectural Patterns

- **Authentication Flow**: Centralized in `src/context/AuthContext.jsx` with Firebase Auth integration
- **State Management**: Context-based architecture with AuthContext managing user state, service locks, and version control
- **Routing**: React Router with protected routes and nested layouts
- **Real-time Updates**: Firestore listeners for service status, user data, and app versioning

### Key Architectural Components

**Main Application Structure**:
- `src/App.jsx`: Root routing with protected routes and app update logic
- `src/main.jsx`: Application entry point with AuthProvider wrapper
- `src/components/MainLayout.jsx`: Layout wrapper with navigation components

**Authentication & Security**:
- Firebase authentication with persistent sessions
- App versioning system with forced updates via `CURRENT_APP_VERSION`
- Legal terms acceptance tracking with version control
- Service-based app locking (users locked during active services)

**Real-time Service Management**:
- Firestore listeners for active services (status: 'deslocamento', 'cheguei', 'aguardandopagamento')
- Scoring system with automatic recalculation triggers
- Push notification integration for service updates

### Scoring and Banning System

**Scoring Algorithm** (`src/utils/scoreManager.js`):
- **Probationary Period**: First 20 services with special rules
- **3-Strike System**: Permanent ban after 3 suspensions
- **Severe Infractions**: 2+ score-1 ratings during probation = immediate ban
- **Final Calculation**: Average of 3 categories (quality, reliability, warranty) after probation
- **History Limit**: Maximum 100 entries per scoring category

**Ban Logic**:
- Score ≤ 3.0 triggers 7-day suspension
- Third suspension results in permanent ban
- Manual unban process via WhatsApp

### Service Carousel Flow

**Carousel Components** (`src/components/carousel/`):
- **PageServiceSummary**: Service item confirmation
- **PagePhotos/TecPhotos**: Before/after photo uploads with optimized parallel upload
- **PagePayment/TecPayment**: Payment processing with Firebase-first verification logic
- **PageConfirmItems**: Final item confirmation

### Photo Upload System

**PhotoUploader Component** (`src/components/PhotoUploader.jsx`):
- **Parallel Upload**: Multiple photos upload simultaneously for better performance
- **Image Compression**: Automatic compression to 1200px width with 80% quality
- **Retry Logic**: 3 attempts per photo with progressive delay
- **Error Handling**: Individual photo failure handling, continues with successful uploads
- **Validation**: File type and size validation (max 10MB per photo)

### Payment Verification System

**TecPayment Component** (`src/components/carousel/TecPayment.jsx`):
- **Firebase-First Logic**: Checks Firebase before calling external APIs
- **Retry Mechanism**: Automatic retry with exponential backoff
- **Timeout Optimization**: 15-20 second timeouts with proper cleanup
- **Memory Leak Prevention**: useRef for timeout management instead of useState

### Logging and Audit System

**Logger** (`src/utils/logger.js`):
- Records activities in each user's `auditoria` subcollection
- Auto timestamps with `serverTimestamp()`
- Structure: `{ timestamp, acao, detalhes }`

### File Organization

- `/components`: Reusable UI components (modals, navigation, cards)
- `/pages`: Route-specific components
- `/context`: React context providers (mainly AuthContext)
- `/utils`: Utility functions (scoring, logging, notifications, permissions)
- `/icones`: Service-specific icons for different furniture types
- `/assets`: Static assets and animations

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Build Tool**: Vite with React plugin
- **Backend**: Firebase (Auth, Firestore, Analytics, Cloud Messaging)
- **Maps**: Google Maps API integration
- **Routing**: React Router v7
- **Icons**: React Icons, custom SVG icons
- **Animations**: Lottie React for success/payment animations
- **Notifications**: React Toastify + Firebase Cloud Messaging

### Firebase Configuration

Firebase config uses environment variables (Vite format):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### Styling Approach

Tailwind CSS with custom brand colors:
- `brand-blue`: #004aad
- `brand-yellow`: #ffde59
- `accent-amber`: #f59e0b
- `go-green`: #4ade80
- `status-orange`: #f97316

### Development Practices

- TypeScript enabled with strict mode
- ESLint configured for React/TypeScript
- Component files use `.jsx` extension even with TypeScript
- Firebase Firestore uses persistent local cache
- Real-time listeners properly cleaned up in useEffect returns
- Version control system for app updates and legal terms

### Service Management Features

- Real-time service tracking with status updates
- Technician scoring system with automatic recalculation
- Client-technician matching and service acceptance flow
- Payment processing integration
- Photo uploads for service completion
- Map-based client location display

### Newsletter System

**NewsletterBadge Component** (`src/components/NewsletterBadge.jsx`):
- **Badge Positioning**: Fixed top-right position with discrete notification
- **Version Control**: Tracks user-seen versions in Firebase (`newsletter_version` field)
- **Modal on Demand**: Click-to-open modal with update details
- **Configuration**: Centralized in `src/utils/newsUpdates.js`

**Newsletter Configuration** (`src/utils/newsUpdates.js`):
- **Version Management**: Increment `CURRENT_NEWSLETTER_VERSION` to show new updates
- **Update Structure**: Supports major/minor/fix/security update types
- **Icon Integration**: Uses react-icons/fi with color coding
- **Dual Audience**: Content written for both technicians and partners

### Core Business Logic

- **App Locking**: Users locked during active services until completion
- **Scoring System**: Complex algorithm with probationary periods and severe infraction tracking
- **Version Management**: Forced app updates when `CURRENT_APP_VERSION` is incremented
- **Onboarding Flow**: Multi-step onboarding with legal acceptance and completion tracking
- **Push Notifications**: Full FCM integration including VAPID key and device tokens
- **Newsletter Updates**: User-specific update tracking with badge notification system

### Performance Optimizations

- **Photo Upload**: Parallel processing with compression and retry logic
- **Payment Verification**: Firebase-first approach reduces API calls
- **Memory Management**: Proper cleanup of timeouts and listeners
- **Cache Strategy**: Persistent Firestore cache for offline functionality