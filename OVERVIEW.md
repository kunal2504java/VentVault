# VentVault Overview

## What This Project Is

VentVault is a privacy-first emotional venting platform. It gives users a place to speak or type what they are feeling, receive a calm AI response, and reflect on emotional patterns over time without storing the raw content of their vents.

The product is designed around a simple idea:

- let people unload without feeling judged
- keep the experience anonymous by default
- store patterns, not private messages

## Core User Experience

The app has three main layers of experience:

### 1. Venting

Users can go to the `/vent` page and choose to:

- type a vent
- speak a vent

The backend processes the message, scrubs common PII, checks rate limits, sends the content to an LLM, and streams the response back token-by-token so the reply appears live in the UI.

### 2. Continued Conversation

After the first response, users can continue the exchange in a chat-style flow. The current frontend builds this continuation by combining prior messages into a single text context and sending that back to the same vent endpoint.

### 3. Reflection Pages

The app also includes pages that turn anonymous usage patterns into softer reflective views:

- `/showing-up`: a presence/check-in view based on recent session activity
- `/mood-map`: a derived emotional summary based on stored analytics, not raw vent text

## Privacy Model

Privacy is a core part of the implementation, not just marketing copy.

- raw vent content is not stored in the database
- PII scrubbing runs before analytics are recorded
- anonymous user identity is derived from hashed request fingerprints
- consent is tracked for optional data collection like location
- users can export or delete their stored data

What does get stored:

- anonymous session records
- word counts
- rough emotion category
- emotion intensity
- response latency
- consent state
- optional city-level location if consent is granted

What does not get stored:

- raw vent text
- raw voice recordings
- precise location

## High-Level Architecture

The repository is split into two apps.

### Frontend

Located in `frontend/`.

Built with:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Clerk authentication
- Three.js / React Three Fiber for the visual particle system

Frontend responsibilities:

- landing page and navigation
- venting UI
- voice transcript capture in the browser
- streaming response rendering
- consent and privacy settings UI
- reflection pages like Mood Map and Showing Up

### Backend

Located in `backend/`.

Built with:

- FastAPI
- PostgreSQL
- SQLAlchemy async
- Redis
- OpenAI / Anthropic / Google Gemini provider support

Backend responsibilities:

- vent API
- streaming LLM responses
- rate limiting
- PII scrubbing
- anonymous analytics
- consent management
- location lookup with consent
- Clerk token verification
- GDPR-style export/delete endpoints

## Main Backend Flow

The main backend route is `POST /api/vent`.

At a high level it does this:

1. identify the client and auth state
2. apply rate limiting
3. scrub PII from submitted content
4. get or create an anonymous user
5. create or reuse a vent session
6. stream the AI response back to the frontend
7. record derived analytics after the response completes

## Main Pages

- `/`: landing page and entry point
- `/vent`: main product experience
- `/about`: product philosophy and framing
- `/listening-space`: voice-first concept page / future direction
- `/showing-up`: pattern-based presence summary
- `/mood-map`: heuristic emotional pattern view

## Current Product Direction

VentVault is already beyond a simple chatbot. The codebase currently supports:

- anonymous and signed-in usage paths
- consent-aware data handling
- session-level analytics
- mood and presence reflection pages
- voice-input support
- streaming LLM responses

There are also signs of future expansion already present in the code:

- premium user tiers
- deeper auth integration
- stronger voice workflows
- richer analytics and mood classification

## Important Notes About The Current State

- The codebase is more advanced than some of the existing README files suggest.
- The frontend currently ignores TypeScript and ESLint errors during production builds.
- The frontend has AssemblyAI-related code, but the current live voice path mainly uses browser speech recognition.
- The backend supports structured conversation history in its models, but the frontend currently flattens continued conversations into plain text.

## In One Sentence

VentVault is a privacy-focused web app where people can vent through text or voice, receive streamed AI support, and later view anonymous emotional patterns without storing the actual content of what they said.
