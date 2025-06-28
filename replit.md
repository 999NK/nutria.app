# NutrIA - Nutrition Tracking Application

## Overview

NutrIA is a mobile-first nutrition tracking application that uses AI to simplify meal logging and nutritional analysis. The app provides Brazilian users with intelligent food recognition, personalized recommendations, and comprehensive progress tracking capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI with Tailwind CSS for design system
- **State Management**: TanStack Query (React Query) for server state
- **Mobile-First**: Progressive Web App (PWA) with Capacitor for native mobile capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESNext modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with session-based authentication
- **API Design**: RESTful endpoints with consistent error handling

### Database Design
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Connection Pooling**: Neon serverless with WebSocket support

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile completion flow

### Food Data Management
- **User Foods**: Custom foods created by users stored locally
- **USDA Integration**: External API integration for comprehensive food database
- **Search**: Debounced search with both user and USDA food sources
- **Caching**: React Query for efficient data fetching and caching

### Nutritional Day Cycle
- **Custom Cycle**: 5 AM to 5 AM nutritional day (not midnight to midnight)
- **Meal Tracking**: Breakfast, lunch, dinner, and snack categorization
- **Real-time Updates**: Automatic day transitions with data refresh

### AI Services (Planned)
- **Meal Recognition**: DeepSeek AI integration for food photo analysis
- **Recipe Suggestions**: Personalized recommendations based on nutrition goals
- **Chat Assistant**: Nutritional advice and meal planning assistance

### PWA Features
- **Offline Support**: Service worker for cached app shell
- **Installation**: Web app manifest for native-like installation
- **Performance**: Optimized loading with Vite build system

## Data Flow

### User Onboarding
1. Replit authentication flow
2. Profile completion with goals setting
3. Automatic nutrition targets calculation based on user metrics

### Daily Usage
1. User searches for foods (debounced queries to both local and USDA APIs)
2. Food selection with quantity and unit conversion
3. Meal logging with automatic nutritional calculations
4. Real-time progress tracking against daily goals
5. AI chat for nutritional guidance and recommendations

### Progress Tracking
1. Daily, weekly, and monthly aggregation
2. Visual charts and progress rings
3. Goal achievement metrics
4. PDF report generation

## External Dependencies

### Core Infrastructure
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Replit Identity Provider
- **Hosting**: Replit deployment platform

### API Integrations
- **USDA FoodData Central**: Food nutrition database
- **DeepSeek AI**: Planned AI meal recognition and chat services

### Frontend Libraries
- **UI**: Radix UI primitives with Tailwind CSS
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React and Font Awesome

### Development Tools
- **Build**: Vite with TypeScript
- **Linting**: ESLint with TypeScript support
- **Database**: Drizzle ORM with PostgreSQL driver

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local PostgreSQL or Neon development database
- **Environment Variables**: `.env` file for local configuration

### Production Deployment
- **Platform**: Replit hosting with automatic deployments
- **Database**: Neon PostgreSQL production instance
- **Build Process**: Vite production build with static asset optimization
- **Mobile**: Capacitor for native app compilation to APK/IPA

### Environment Configuration
- **Database URL**: PostgreSQL connection string
- **Session Secret**: Secure session encryption key
- **USDA API Key**: Food database API access
- **Replit Auth**: OIDC configuration for authentication

Changelog:
- June 28, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.