# VentVault Agent Notes

This file is a working memory for future coding sessions in this repo. It is based on the current code, not just the repo docs.

## Repo Shape

- `frontend/`: Next.js 15 App Router app, React 19, Tailwind 4, Clerk, Radix/shadcn-style components, WebGL particle background.
- `backend/`: FastAPI app with async SQLAlchemy, PostgreSQL, Redis rate limiting, streaming LLM responses, privacy/consent/location services.
- Root docs exist, but some of them are stale relative to the code.

## What The Product Does

VentVault is a privacy-first emotional venting app.

- Landing page funnels users into `/vent`.
- Core experience is anonymous venting with streamed AI replies.
- Voice input is supported in the frontend through browser speech recognition; the backend also exposes an AssemblyAI token endpoint for real-time transcription.
- The backend stores anonymous analytics and consent/location data, but it does not store raw vent content.
- There are reflection pages built from aggregated patterns:
  - `/showing-up`
  - `/mood-map`

## Actual Tech Stack

### Frontend

- Next.js `15.2.4`
- React `19`
- TypeScript
- Tailwind CSS 4
- Clerk auth
- Three.js + `@react-three/fiber` + custom shaders

### Backend

- FastAPI
- SQLAlchemy async + `asyncpg`
- PostgreSQL
- Redis
- LLM providers supported in code:
  - OpenAI
  - Anthropic
  - Google Gemini
- PyJWT for Clerk JWT verification
- `httpx` for external HTTP calls

## Important Reality Check

Some docs are outdated. Prefer code over README-level claims.

- Root/backend READMEs still describe a simpler backend than what exists now.
- Docs mention lower rate limits, but current code defaults are:
  - anonymous: `10/day`
  - signed-in: `25/day`
  - premium: `100/day`
- Root README suggests OpenAI/Anthropic only, but code defaults to `google` in `backend/app/config.py`.
- Frontend `next.config.ts` ignores both ESLint and TypeScript build errors.

## Run Commands

### Frontend

- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Start: `pnpm start`

### Backend

- Create venv and install: `pip install -r requirements.txt`
- Dev server: `python -m app.main`
- Init DB tables: `python scripts/init_db.py`
- View DB summary: `python scripts/view_data.py`

### Convenience

- Windows startup script: `start-dev.bat`
  - starts Redis
  - starts backend
  - starts frontend

## Environment / Config

Backend config is defined in `backend/app/config.py` and loaded from `.env`.

### LLM

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `LLM_PROVIDER` = `openai | anthropic | google`
- `LLM_MODEL_OPENAI`
- `LLM_MODEL_ANTHROPIC`
- `LLM_MODEL_GOOGLE`
- `MAX_OUTPUT_TOKENS`
- `LLM_TEMPERATURE`
- `LLM_TIMEOUT`

### Database / Redis

- `DATABASE_URL`
- `DB_POOL_SIZE`
- `DB_MAX_OVERFLOW`
- `REDIS_URL`
- `REDIS_POOL_SIZE`
- `REDIS_TIMEOUT`

### Rate Limits

- `ANON_DAILY_LIMIT`
- `SIGNED_IN_DAILY_LIMIT`
- `PREMIUM_DAILY_LIMIT`

### App / Infra

- `ENVIRONMENT` = `development | staging | production`
- `DEBUG`
- `CORS_ORIGINS`
- `LOG_LEVEL`

### Clerk

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_FRONTEND_API`

### Voice

- `ASSEMBLYAI_API_KEY`

### Frontend

- `NEXT_PUBLIC_API_URL`

## Frontend Map

### Global Layout

- `frontend/app/layout.tsx`
  - wraps app in `ClerkProvider`
  - mounts `Header`
  - mounts `ParticleProvider`

### Main Routes

- `/` -> `frontend/app/page.tsx`
  - just renders `Hero`
- `/vent` -> `frontend/app/vent/page.tsx`
  - main product flow
- `/about` -> static content page
- `/listening-space` -> static/coming-soon voice-first concept page
- `/showing-up` -> pattern-based presence view
- `/mood-map` -> pattern-based emotional map

### Header / Nav

- `frontend/components/header.tsx`
- Uses Clerk components:
  - `SignInButton`
  - `SignUpButton`
  - `UserButton`
- Includes links to app pages and some homepage anchor targets.

### Visual System

- `frontend/components/gl/*`
- `frontend/lib/particle-context.tsx`
- Two particle presets:
  - `LANDING_DEFAULTS`
  - `APP_DEFAULTS`

## Frontend Core Flow

Main file: `frontend/app/vent/page.tsx`

### Mode Selection

Users pick:

- text vent
- voice vent

### Text Vent Flow

1. User types into `ChatInput`.
2. `handleRelease()` dynamically imports `streamVent` from `frontend/lib/api-client.ts`.
3. Frontend calls `POST /api/vent`.
4. Response is streamed token-by-token over SSE.
5. Final metadata comes back through headers:
   - `X-Session-ID`
   - `X-User-ID`
   - `X-Remaining-Vents`

### Voice Vent Flow

- `frontend/components/ui/ai-voice-input.tsx`
- Current implementation primarily uses browser `SpeechRecognition` / `webkitSpeechRecognition`.
- It requests microphone access, visualizes audio, and accumulates transcript text locally in the client.
- The transcript is sent to the same `/api/vent` endpoint with `mode: "voice"`.
- The component includes code for AssemblyAI websocket usage, but `startRecording()` currently starts browser recognition directly and does not actually call `startAssemblyAI()`.
- The backend still exposes `/api/assembly/token`, which is ready if the frontend is later switched to AssemblyAI streaming.

### Chat Continuation Behavior

After the first vent/reply:

- clicking `Continue` enters chat mode
- previous exchange is copied into local `messages`
- subsequent sends stringify the whole conversation into one `content` string:
  - `"User: ...\n\nVentVault: ..."`

Important:

- the backend model supports structured `history`
- current frontend does not use that `history` field
- if improving conversation quality, this is an obvious place to refactor

### Privacy / Consent UI

- `frontend/components/consent-banner.tsx`
- `frontend/components/privacy-settings.tsx`
- `frontend/lib/consent-api.ts`

Capabilities:

- fetch consent state
- update consent state
- export user data
- delete all user data
- store a local consent snapshot in `localStorage`

Notable detail:

- banner defaults `analytics: true` in UI state, but users can reject it

### Backend Connectivity

- `frontend/components/backend-status.tsx`
- polls `/health` every 30s

## Frontend API Client

Main file: `frontend/lib/api-client.ts`

Responsibilities:

- posts vent requests
- reads SSE chunks manually from `fetch()`
- stores session ID in `sessionStorage`
- stores anonymous user ID in `localStorage`
- includes Clerk bearer token if available
- exposes helpers for:
  - `checkHealth()`
  - `getPresenceData()`
  - `getMoodMapData()`
  - `getAssemblyToken()`

Auth bridge:

- `frontend/hooks/use-auth-api.ts`
- plugs Clerk `getToken()` into the API client through `setAuthTokenGetter()`

## Backend Map

Main file: `backend/app/main.py`

Startup lifecycle initializes:

- PostgreSQL
- Redis
- rate limiter
- LLM service
- analytics service
- location service
- consent service
- Clerk auth service

### Middleware

- CORS
- GZip

### Exception Handling

- FastAPI `HTTPException` converted into `ErrorResponse`
- uncaught exceptions return generic 500 payload

## Backend API Surface

### Health / Meta

- `GET /`
- `GET /health`
- `GET /api/usage`

### Core Venting

- `POST /api/vent`

Behavior:

1. identify client IP and user-agent
2. optionally verify Clerk auth from `Authorization` header
3. check Redis rate limit
4. scrub PII from vent content
5. get or create anonymous user
6. get or create a vent session using `X-Session-ID`
7. stream LLM response as `text/event-stream`
8. after completion, record analytics asynchronously using a fresh DB session

Important response headers:

- `X-Session-ID`
- `X-User-ID`
- `X-Remaining-Vents`
- `X-Reset-Seconds`

### Consent / Privacy

- `GET /api/consent`
- `POST /api/consent`
- `GET /api/user/data`
- `DELETE /api/user/data`

### Location

- `GET /api/location`

### Analytics / Derived Views

- `GET /api/analytics/aggregate`
- `GET /api/presence`
- `GET /api/mood-map`

### Voice

- `GET /api/assembly/token`

## Backend Models

### Request / Response Models

Defined in `backend/app/models.py`.

Most important:

- `VentRequest`
  - `mode`
  - `content`
  - optional `history`
- `HealthResponse`
- `UsageResponse`
- `ConsentRequest`
- `ConsentResponse`
- `LocationResponse`
- `AnalyticsResponse`
- `DataExportResponse`

## Database Schema

Defined in `backend/app/db_models.py`.

### Core Tables

- `anonymous_users`
  - one-way fingerprint hash of IP + user-agent
- `user_consents`
  - GDPR/CCPA-style consent records
- `user_locations`
  - city-level location only, stored with consent
- `vent_sessions`
  - session grouping, no raw text
- `vent_analytics`
  - derived analytics only, no raw text
- `aggregate_analytics`
  - pre-aggregated stats table

### Important Privacy Property

The system analyzes vent content transiently, but does not persist raw vent text in the database.

Stored analytics include things like:

- word count
- emotion category
- emotion intensity
- latency
- mode
- whether PII was detected
- whether the vent was a continued conversation

## Services

### `LLMService`

File: `backend/app/llm_service.py`

- supports OpenAI, Anthropic, and Google Gemini
- streams provider output chunk-by-chunk
- has a large opinionated system prompt focused on warm, grounded, non-clinical support
- fallback response is returned if provider fails

Default provider in code:

- `google`

### `RateLimiter`

File: `backend/app/rate_limiter.py`

- Redis-based
- anonymous users keyed by device hash of IP + user-agent
- authenticated users keyed by user ID and tier
- returns remaining quota + reset TTL
- gracefully allows requests if Redis fails

### `PIIScrubber`

File: `backend/app/pii_scrubber.py`

Scrubs:

- emails
- phone numbers
- URLs
- SSNs
- credit cards
- IP addresses
- DOB-style dates

### `AnalyticsService`

File: `backend/app/analytics_service.py`

- fingerprints anonymous users
- creates sessions
- does basic keyword-based emotion detection
- stores per-vent derived analytics
- computes aggregate stats

Important:

- emotion classification is keyword-based, not model-based

### `ConsentService`

File: `backend/app/consent_service.py`

- reads/updates consent records
- exports all stored user data
- deletes all user data for a user

### `LocationService`

File: `backend/app/location_service.py`

- only stores city-level location
- requires explicit consent
- uses:
  - primary: `ip-api.com`
  - fallback: `ipapi.co`
- skips localhost/private IPs

### `ClerkAuthService`

File: `backend/app/auth_service.py`

- verifies Clerk JWTs with JWKS when `CLERK_FRONTEND_API` is configured
- otherwise falls back to decoding without signature verification

Important:

- that fallback is only suitable for development

## Derived Data Pages

### Showing Up

Backend:

- `GET /api/presence`

Frontend:

- `frontend/app/showing-up/page.tsx`

Returns:

- number of distinct check-in days over the last 30 days
- boolean 30-day check-in pattern
- insight strings based on average check-in hour and gaps

### Mood Map

Backend:

- `GET /api/mood-map`

Frontend:

- `frontend/app/mood-map/page.tsx`

Returns:

- grouped emotion percentages
- release / positive-shift heuristics
- most active day/time
- an inferred emotional style label and description
- most felt emotion

Important:

- this is heuristic/derived output based on stored analytics, not memory of vent text

## Known Implementation Caveats

### Docs Drift

- Docs understate backend scope and use stale limits/provider assumptions.

### Type/Lint Guardrails Disabled In Production Builds

- `frontend/next.config.ts` sets:
  - `ignoreDuringBuilds: true`
  - `ignoreBuildErrors: true`

This means broken frontend code may still build.

### Conversation Context Is Flattened

- frontend chat continuation sends a composed plain-text transcript in `content`
- backend `VentRequest.history` is currently unused by the frontend

### Voice Path Is Partially Wired

- backend AssemblyAI token route exists
- frontend `AIVoiceInput` contains AssemblyAI websocket code
- current live path still uses browser speech recognition

### Health Check SQL

- `/health` does `await conn.execute("SELECT 1")`
- depending on SQLAlchemy version/config, raw SQL strings can be fragile compared with `text("SELECT 1")`

### Anonymous User Identity

- both rate limiting and analytics rely on IP + user-agent derived identity
- this is privacy-preserving compared with accounts, but it is not a durable user identity system

### Auth State

- Clerk is integrated in frontend and partially in backend
- core product still works anonymously
- premium/signed-in tiers are mostly rate-limit/auth plumbing, not a fully differentiated product layer yet

## Best Files To Read First For Future Work

### Product Flow

- `frontend/app/vent/page.tsx`
- `frontend/lib/api-client.ts`
- `backend/app/main.py`

### Data / Privacy

- `backend/app/db_models.py`
- `backend/app/analytics_service.py`
- `backend/app/consent_service.py`
- `backend/app/location_service.py`
- `backend/app/pii_scrubber.py`

### Auth / Voice

- `frontend/hooks/use-auth-api.ts`
- `backend/app/auth_service.py`
- `frontend/components/ui/ai-voice-input.tsx`

### Visual / Brand Experience

- `frontend/components/hero.tsx`
- `frontend/components/header.tsx`
- `frontend/components/gl/*`
- `frontend/lib/particle-context.tsx`

## Practical Guidance For Future Agents

- Trust the code more than the READMEs.
- If changing chat quality, inspect `frontend/app/vent/page.tsx` and consider using structured `history`.
- If changing rate limits or auth tiers, update both backend config defaults and any user-facing copy/modals.
- If touching voice, decide whether to keep browser speech recognition or fully switch to AssemblyAI.
- If changing privacy behavior, verify both backend persistence rules and frontend privacy copy.
- If relying on frontend builds as proof of correctness, remember TS/ESLint errors are ignored at build time.
