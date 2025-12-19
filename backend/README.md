# VentVault Backend

Privacy-first, high-performance backend for emotional venting platform.

## 🎯 Architecture Principles

- **Stateless hot path** - No DB writes during vent
- **Streaming LLM** - Time-to-first-token optimized
- **Anonymous-first** - No auth required for core experience
- **Privacy-by-design** - No content logging, PII scrubbing

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Redis (local or cloud)
- OpenAI or Anthropic API key

### Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your API keys
```

### Run Development Server

```bash
# Start Redis (if local)
redis-server

# Run FastAPI
python -m app.main
```

Server runs at: `http://localhost:8000`

API docs: `http://localhost:8000/docs`

## 📡 API Endpoints

### POST /api/vent

Core venting endpoint - streams LLM response.

**Request:**
```json
{
  "mode": "text",
  "content": "I feel overwhelmed and exhausted"
}
```

**Response:** Server-sent events stream

**Headers:**
- `X-Session-ID` - Anonymous session identifier
- `X-Remaining-Vents` - Vents remaining today

**Rate Limits:**
- Anonymous: 2 vents/day
- Signed-in: 10 vents/day

## 🔒 Privacy Features

- ✅ PII scrubbing (emails, phones, URLs)
- ✅ No content logging
- ✅ No raw text storage
- ✅ Anonymous device hashing
- ✅ Metadata-only persistence (future)

## ⚡ Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| P95 latency | < 2s | TBD |
| Time-to-first-token | < 600ms | TBD |
| API logic | < 100ms | TBD |

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **LLM:** OpenAI GPT-4o-mini / Anthropic Claude Haiku
- **Cache:** Redis
- **Async:** Native Python asyncio

## 📦 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + routes
│   ├── config.py            # Settings management
│   ├── models.py            # Pydantic models
│   ├── pii_scrubber.py      # PII removal
│   ├── rate_limiter.py      # Redis-based rate limiting
│   └── llm_service.py       # Streaming LLM client
├── requirements.txt
├── .env.example
└── README.md
```

## 🔮 Roadmap

### Phase 1 (Current)
- [x] Core vent API
- [x] PII scrubbing
- [x] Rate limiting
- [x] Streaming LLM

### Phase 2 (Next)
- [ ] Async background worker
- [ ] Emotion classification
- [ ] Metadata storage
- [ ] Mood map generation

### Phase 3 (Future)
- [ ] Auth integration
- [ ] User accounts
- [ ] Premium features
- [ ] Analytics dashboard

## 🧪 Testing

```bash
# Run tests (when added)
pytest

# Load testing
# locust -f tests/load_test.py
```

## 🚢 Deployment

### Docker

```bash
docker build -t ventvault-backend .
docker run -p 8000:8000 ventvault-backend
```

### Fly.io / Railway / AWS

See deployment guides in `/docs` (coming soon)

## 📊 Monitoring

Key metrics to track:
- Request latency (P50, P95, P99)
- LLM time-to-first-token
- Rate limit hits
- Error rates
- Cost per vent

## 🤝 Contributing

This is a focused V1 implementation. See `IMPLEMENTATION_PLAN.md` for full architecture.

## 📄 License

Proprietary - VentVault
