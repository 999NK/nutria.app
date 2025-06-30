# NutrIA - Nutrition Tracking Application

## Project Overview
A comprehensive nutrition tracking mobile application called "NutrIA" for Brazilian users, featuring enhanced USDA food database integration with Portuguese-to-English translation, manual meal tracking with Brazilian units, automatic nutrient goal calculation, 5AM-5AM nutritional day cycle, mobile PWA functionality, AI-powered recipe generation capabilities, personalized recipe recommendations based on nutrition goals, and chatbot interface for enhanced user interaction.

## User Preferences
- Language: Portuguese (Brazilian)
- Communication: Direct and solution-focused
- Interface: Mobile-first design with intuitive navigation
- Features: AI-powered nutrition assistance and recipe generation

## Recent Changes
**2025-06-30 21:45**
- ✓ Fixed notification duplicates with per-day per-user scheduling system
- ✓ Optimized React Query caching (5min staleTime, no window refocus)
- ✓ Added loading skeleton states for better UX
- ✓ Enhanced sidebar navigation with active page indicators and hover effects
- ✓ Improved floating action button with scale animations
- ✓ Corrected responsive breakpoints for consistent tablet experience
- ✓ Optimized Progress page queries (removed excessive refetch intervals)
- ✓ Enhanced dark mode contrast for better accessibility
- ✓ Performance improvements across all major components

**2025-06-30 06:40**
- ✓ Made app fully responsive for tablet screens (640px-1023px)
- ✓ Tablets now use desktop layout with sidebar instead of mobile layout
- ✓ Created specific input positioning for tablets in AI Chat
- ✓ Adjusted breakpoints: mobile (<640px), tablet (640px-1023px), desktop (≥1024px)
- ✓ Headers and spacing optimized for all screen sizes

**2025-06-30 06:19**
- ✓ Resolved Babel parser syntax error causing app startup failure
- ✓ Fixed server startup issues - application now running successfully on port 5000
- ✓ All API endpoints responding correctly with proper authentication
- ✓ Database connections stable and daily notifications working

**Previous Updates**
- ✓ Fixed React child rendering error in workout plans (object with keys {name, reps, rest, sets})
- ✓ Implemented proper type checking for exercise objects vs strings in workout display
- ✓ Corrected desktop sidebar to fill full vertical height with proper flex layout structure
- ✓ Enhanced full-height layout with container flex structure and tab content optimization
- ✓ Added exercise details display (reps, sets, duration) for comprehensive workout info
- ✓ Fixed "Meu Plano" page errors with proper authentication handling and error boundaries
- ✓ Replaced half-donut chart with green circular progress ring matching user's reference image
- ✓ Implemented exact Dashboard macronutrient visualization (7840 kcal display style)
- ✓ Added dark theme card background with white text for nutrition progress
- ✓ Enhanced horizontal progress bars for protein, carbohydrates, and fat with proper colors
- ✓ Completely redesigned "Meu Plano" page with professional UX design for desktop and mobile
- ✓ Implemented responsive 3-column grid layout (XL screens) with sidebar progress tracking

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