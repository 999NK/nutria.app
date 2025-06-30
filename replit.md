# NutrIA - Nutrition Tracking Application

## Project Overview
A comprehensive nutrition tracking mobile application called "NutrIA" for Brazilian users, featuring enhanced USDA food database integration with Portuguese-to-English translation, manual meal tracking with Brazilian units, automatic nutrient goal calculation, 5AM-5AM nutritional day cycle, mobile PWA functionality, AI-powered recipe generation capabilities, personalized recipe recommendations based on nutrition goals, and chatbot interface for enhanced user interaction.

## User Preferences
- Language: Portuguese (Brazilian)
- Communication: Direct and solution-focused
- Interface: Mobile-first design with intuitive navigation
- Features: AI-powered nutrition assistance and recipe generation

## Recent Changes
**2025-06-30 05:45**
- ✓ Completely redesigned "Meu Plano" page with professional UX design for desktop and mobile
- ✓ Implemented responsive 3-column grid layout (XL screens) with sidebar progress tracking
- ✓ Enhanced plan details with color-coded macro cards and meal/workout previews
- ✓ Added sophisticated daily progress tracking with visual feedback and summary progress bar
- ✓ Created comprehensive macronutrient chart in Progress page matching user's reference image
- ✓ Implemented circular calorie display with animated progress ring and remaining calories
- ✓ Added horizontal progress bars for protein, carbohydrates, and fat with real-time data
- ✓ Enhanced plan visualization with proper meal type names and workout schedules
- ✓ Improved mobile responsiveness across all plan management features
- ✓ Maintained user characteristics integration for personalized AI plan generation

## Recent Debug Fixes
**2025-06-28 02:45**
- ✓ Fixed duplicate notification scheduling (was triggering multiple times per session)
- ✓ Optimized React Query caching to reduce unnecessary API calls
- ✓ Added session-based notification scheduling to prevent duplicates
- ✓ Implemented proper staleTime and refetch controls for auth queries
- ✓ Corrected TypeScript errors in Dashboard component
- ✓ Aggressive cache clearing implementation

**Current Status**:
- ✓ Server running correctly on port 5000
- ✓ API calls optimized with proper caching
- ✓ Notification scheduling fixed (single execution per session)
- ✓ Navigation fully functional with robot icon
- ✓ All TypeScript errors resolved
- ✓ AI Chat greeting responses fixed (no more medical disclaimers for "boa tarde")
- ✓ Gemini API integration implemented (replaced automatic responses with real AI)
- ✓ Fixed model endpoint to use gemini-1.5-flash (working model)
- ✓ Corrected chat message duplication issue (single message display)
- ✓ Implemented chat memory system to maintain conversation context
- ✓ Added user-specific chat history storage (last 20 messages)
- ✓ Restructured bot introduction into 6 separate sequential messages
- ✓ Implemented exact message flow: intro → common questions header → 3 questions → call to action