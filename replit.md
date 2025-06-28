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

## Current Status
**CRITICAL ISSUE**: Preview not synchronizing with code changes despite:
- Server restart attempts
- Cache clearing (node_modules/.vite, .vite)
- HTML meta cache-control headers
- Timestamp-based cache busting

**Working Features**:
- Server running correctly on port 5000
- All API endpoints functional
- Code changes saved and compiled
- Navigation properly configured with robot icon

**Next Steps**:
Need to resolve preview synchronization to show updated navigation labels and AI chat functionality.