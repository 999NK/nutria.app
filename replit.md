# NutrIA - Nutrition Tracking Application

## Project Overview
A comprehensive nutrition tracking mobile application called "NutrIA" for Brazilian users, featuring enhanced USDA food database integration with Portuguese-to-English translation, manual meal tracking with Brazilian units, automatic nutrient goal calculation, 5AM-5AM nutritional day cycle, mobile PWA functionality, AI-powered recipe generation capabilities, personalized recipe recommendations based on nutrition goals, and chatbot interface for enhanced user interaction.

## User Preferences
- Language: Portuguese (Brazilian)
- Communication: Direct and solution-focused
- Interface: Mobile-first design with intuitive navigation
- Features: AI-powered nutrition assistance and recipe generation

## Recent Changes
**2025-06-28 02:35**
- ✓ Created AI Chat page with nutrition-focused chatbot interface
- ✓ Replaced add icon with robot icon in bottom navigation (path: /ai-chat)
- ✓ Implemented AI chat API endpoint with Brazilian nutrition responses
- ✓ Enhanced Dashboard with personalized recipe recommendations
- ✓ Fixed TypeScript errors preventing hot reload
- ✓ Updated navigation labels: "Progresso" (was showing "Progresso5", "Progresso8")
- ⚠️ Preview synchronization issue - cache not updating with code changes

## Recent Debug Fixes
**2025-06-28 02:45**
- ✓ Fixed duplicate notification scheduling (was triggering multiple times per session)
- ✓ Optimized React Query caching to reduce unnecessary API calls
- ✓ Added session-based notification scheduling to prevent duplicates
- ✓ Implemented proper staleTime and refetch controls for auth queries
- ✓ Corrected TypeScript errors in Dashboard component
- ✓ Aggressive cache clearing implementation

**Current Status**:
- Server running correctly on port 5000
- API calls optimized with proper caching
- Notification scheduling fixed (single execution per session)
- Navigation fully functional with robot icon
- All TypeScript errors resolved