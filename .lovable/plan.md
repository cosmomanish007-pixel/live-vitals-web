

# AURA-STETH AI — Medical Monitoring Web App

## Overview
A mobile-first, dark-themed medical monitoring web app that receives real-time vital signs from an ESP32 device via Supabase. Includes user authentication, live monitoring dashboard, and session history.

---

## 1. Supabase Setup & Database

### Connect Supabase
- Connect to the provided Supabase instance (URL + anon key embedded in client code — these are publishable keys)

### Database Tables (via migrations)
- **profiles** — auto-created on signup (name, avatar, etc.)
- **sessions** — id, user_id, user_name, age, gender, mode, state, created_at
- **statuses** — id, session_id, message, created_at
- **vitals** — id, session_id, temp, hr, spo2, audio, status, created_at

### Security
- RLS enabled on all tables
- Users can only access their own sessions/data
- Realtime subscriptions enabled on sessions, statuses, and vitals tables

---

## 2. Authentication

- Email/password login and signup
- Auth-protected routes — redirect to login if not authenticated
- Simple, clean auth pages matching the dark medical theme

---

## 3. App Flow & Screens

### Splash Screen
- Dark medical-themed landing with animated pulse/heartbeat effect
- App name "AURA-STETH AI" with subtitle "Intelligent Real-Time Health Monitoring"
- "Get Started" button → navigates to login (or dashboard if already logged in)

### User Details Form (New Session)
- Fields: Full Name, Age, Gender, Mode (Self / Assisted)
- On submit: creates a new session in Supabase, generates session_id, navigates to monitoring dashboard

### Monitoring Dashboard
- Displays patient details and connection status badge (Waiting → Connected → Monitoring Live → Completed → Error)
- "Start Monitoring" button updates session state to "STARTED" in Supabase
- **Real-time monitoring steps** driven entirely by Supabase realtime updates (no hardcoded timers):
  1. System Initialised
  2. Measuring Skin Temperature (~30s)
  3. Auscultation Started (~30s)
  4. Measuring HR & SpO₂ (~30s)
  5. Final Analysis
- Each step: highlighted when active, countdown synced from backend timestamps, checkmark when complete, smooth animated transitions

### Final Report Screen
- Vital sign cards: Skin Temperature, Heart Rate, SpO₂, Audio Peak
- Overall health status indicator: GREEN (Normal), YELLOW (Attention Needed), RED (Alert)
- "Start New Session" button — resets app state and navigates back to user details form

### Session History
- List of past monitoring sessions with date, patient name, and health status
- Tap to view the full final report of any past session

---

## 4. Custom Hook: `useWifiSession()`

A central hook that manages all session logic and exposes:
- `sessionState` — current session status
- `statusMessage` — latest status update
- `statusHistory` — all status messages for the session
- `vitalData` — final vitals data
- `error` — any error state
- `startSession()` — creates and starts a new session
- `resetSession()` — clears state for a new session

Uses Supabase Realtime subscriptions to listen for changes on statuses and vitals tables.

---

## 5. Design & UX

- **Dark medical UI** with deep navy/charcoal backgrounds
- **Blue/cyan accent colors** for highlights, badges, and interactive elements
- **Large, readable vital sign displays** — clear typography for medical data
- **Smooth animations** — fade-ins, step transitions, pulse effects
- **Mobile-first layout** — touch-optimized buttons, responsive grid, works on phones, tablets, and desktop
- **PWA-ready** structure

