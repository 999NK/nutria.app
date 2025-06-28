# NutrIA - Nutrition Tracking Application

## Overview

NutrIA is a comprehensive nutrition tracking mobile application built with React, TypeScript, and Node.js. The app helps users track their daily food intake, monitor nutritional goals, and provides AI-powered meal analysis and recipe suggestions. It features a Brazilian food database integration with USDA food data, personalized nutrition recommendations, and Progress Web App (PWA) capabilities for mobile installation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack React Query for server state and caching
- **Forms**: React Hook Form with Zod validation
- **Mobile-First Design**: Responsive design optimized for mobile devices
- **PWA Features**: Service worker, manifest.json, offline capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth integration with session management
- **API Design**: RESTful endpoints with comprehensive CRUD operations
- **External Services**: USDA Food Data Central API integration

### Build System
- **Build Tool**: Vite for fast development and optimized production builds
- **Mobile App**: Capacitor for native mobile app generation
- **Development**: Hot module replacement and TypeScript checking

## Key Components

### Database Schema
- **Users**: Profile data, nutrition goals, preferences
- **Foods**: Custom and USDA food database integration
- **Meals**: Daily meal tracking with timestamps
- **Meal Foods**: Junction table for meals and foods with quantities
- **Recipes**: Custom recipes with ingredients
- **Daily Nutrition**: Aggregated daily nutrition summaries
- **Sessions**: Session management for authentication

### Authentication System
- Replit Auth integration for secure user authentication
- Session-based authentication with PostgreSQL session store
- User profile completion flow with onboarding

### Food Database Integration
- USDA Food Data Central API integration for comprehensive food data
- Portuguese-English food translation for Brazilian users
- Custom food creation and management
- Advanced search functionality with debouncing

### Nutrition Tracking
- Nutritional day cycle (5 AM to 5 AM) for accurate daily tracking
- Real-time nutrition calculation and goal progress
- Comprehensive macronutrient and micronutrient tracking
- Visual progress indicators with custom progress rings

### AI Services (Planned)
- Meal recognition from descriptions
- Personalized recipe recommendations
- Nutrition goal optimization
- Smart meal suggestions based on eating patterns

## Data Flow

### User Journey
1. **Authentication**: Users log in via Replit Auth
2. **Onboarding**: New users complete profile setup with nutrition goals
3. **Daily Tracking**: Users add meals throughout the day
4. **Progress Monitoring**: Real-time tracking of nutrition goals and historical data
5. **Recommendations**: AI-powered suggestions for meals and recipes

### API Data Flow
- Frontend makes authenticated requests to Express.js API
- Drizzle ORM handles database operations with type safety
- External USDA API calls for food data enrichment
- React Query manages caching and synchronization

### Nutritional Day Logic
- Custom 5 AM to 5 AM cycle for accurate daily nutrition tracking
- Automatic day transition handling
- Historical data aggregation and reporting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection pooling
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe database operations
- **wouter**: Lightweight React routing
- **@radix-ui/react-***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **eslint**: Code linting
- **drizzle-kit**: Database migrations and management

### Mobile Integration
- **@capacitor/core**: Cross-platform mobile app framework
- **@capacitor/android**: Android platform integration
- **@capacitor/ios**: iOS platform integration

### External APIs
- **USDA Food Data Central**: Comprehensive food nutrition database
- **Replit Auth**: Authentication and user management

## Deployment Strategy

### Development Environment
- Replit development environment with hot reloading
- PostgreSQL database provisioning
- Environment variable management for API keys

### Production Deployment
- Vite build optimization for production
- Static asset serving with Express.js
- Session management with PostgreSQL
- Mobile app generation via Capacitor

### Mobile App Distribution
- PWA installation via browser (Add to Home Screen)
- Native APK generation through Capacitor and Android Studio
- iOS app packaging through Xcode (planned)

### Database Management
- Drizzle migrations for schema updates
- Automated backup strategies
- Performance optimization for nutrition queries

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 27, 2025. Initial setup