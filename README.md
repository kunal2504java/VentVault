# 🧠 VentVault

**Privacy-first emotional venting platform with AI support**

> Unload without being judged. Nothing is saved unless you choose.

---

## ✨ Features

- 🔒 **Privacy-by-design** - No content logging, PII scrubbing
- ⚡ **Real-time streaming** - AI responses stream token-by-token
- 🎭 **Anonymous-first** - No auth required for core experience
- 🎨 **Beautiful UI** - 3D particle effects, day/night mode
- 📊 **Mood insights** - Visualize emotional patterns (coming soon)
- 🎤 **Voice & text** - Express yourself however feels right

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  • 3D WebGL particles • Streaming UI • Responsive   │
└────────────────────┬────────────────────────────────┘
                     │ SSE Stream
                     ▼
┌─────────────────────────────────────────────────────┐
│                 Backend (FastAPI)                    │
│  • Rate limiting • PII scrubbing • LLM streaming    │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   ┌─────────┐              ┌──────────┐
   │  Redis  │              │   LLM    │
   │  Cache  │              │ Provider │
   └─────────┘              └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and pnpm
- **Python 3.11+**
- **Redis** (local or cloud)
- **OpenAI or Anthropic API key**

### One-Command Setup (Windows)

```bash
# Run the setup script
start-dev.bat
```

### Manual Setup

See **[SETUP.md](./SETUP.md)** for detailed instructions.

**TL;DR:**

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Add API key to .env
python -m app.main

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev
```

---

## 📁 Project Structure

```
ventvault/
├── frontend/              # Next.js 15 + React 19
│   ├── app/
│   │   ├── page.tsx      # Landing page
│   │   ├── vent/         # Venting interface
│   │   └── mood-map/     # Mood insights
│   ├── components/
│   │   ├── gl/           # 3D particle system
│   │   └── ui/           # Reusable components
│   └── lib/
│       └── api-client.ts # Backend integration
│
├── backend/               # FastAPI + Python
│   ├── app/
│   │   ├── main.py       # API routes
│   │   ├── llm_service.py    # Streaming LLM
│   │   ├── rate_limiter.py   # Redis rate limiting
│   │   └── pii_scrubber.py   # Privacy protection
│   └── requirements.txt
│
├── SETUP.md              # Detailed setup guide
└── README.md             # This file
```

---

## 🎯 Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| P95 latency | < 2s | ✅ |
| Time-to-first-token | < 600ms | ✅ |
| API logic | < 100ms | ✅ |

---

## 🔐 Privacy Features

- ✅ **No content storage** - Vents never touch the database
- ✅ **PII scrubbing** - Emails, phones, URLs automatically removed
- ✅ **Anonymous sessions** - Device hashing, no tracking
- ✅ **Metadata only** - Only aggregated patterns stored
- ✅ **Instant deletion** - One-click data removal

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **3D:** Three.js, React Three Fiber
- **Components:** Radix UI, shadcn/ui

### Backend
- **Framework:** FastAPI (Python)
- **LLM:** OpenAI GPT-4o-mini / Anthropic Claude Haiku
- **Cache:** Redis
- **Streaming:** Server-Sent Events

---

## 📊 API Endpoints

### `POST /api/vent`

Stream AI response for a vent.

**Request:**
```json
{
  "mode": "text",
  "content": "I feel overwhelmed..."
}
```

**Response:** Server-sent events stream

**Rate Limits:**
- Anonymous: 2 vents/day
- Signed-in: 10 vents/day

See full API docs at: http://localhost:8000/docs

---

## 🗺️ Roadmap

### ✅ Phase 1 (Current)
- [x] Core venting interface
- [x] Streaming AI responses
- [x] Rate limiting
- [x] PII scrubbing
- [x] 3D particle effects

### 🚧 Phase 2 (In Progress)
- [ ] Background emotion classification
- [ ] Mood map generation
- [ ] User authentication
- [ ] Save & export vents

### 🔮 Phase 3 (Planned)
- [ ] Premium features
- [ ] Mobile app
- [ ] Community features
- [ ] Advanced analytics

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
pnpm test

# Load testing
cd backend
locust -f tests/load_test.py
```

---

## 🚢 Deployment

### Backend (Fly.io / Railway)

```bash
cd backend
docker build -t ventvault-backend .
fly deploy
```

### Frontend (Vercel)

```bash
cd frontend
vercel
```

See deployment guides in `/docs` (coming soon)

---

## 🤝 Contributing

This is currently a private project. Contribution guidelines coming soon.

---

## 📄 License

Proprietary - VentVault © 2025

---

## 🆘 Support

- **Setup issues?** See [SETUP.md](./SETUP.md)
- **Backend docs:** http://localhost:8000/docs
- **Architecture:** See `backend/README.md`

---

## 🎉 Get Started

```bash
# Clone and setup
git clone <repo-url>
cd ventvault

# Follow SETUP.md or run:
start-dev.bat  # Windows
# or
./start-dev.sh  # Mac/Linux
```

**Then visit:** http://localhost:3000

---

Made with 🧠 for mental wellness
