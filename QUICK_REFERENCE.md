# VentVault - Quick Reference Card

## 🚀 Start Everything

```bash
# Windows
start-dev.bat

# Mac/Linux
./start-dev.sh
```

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

---

## 📦 Commands

### Backend

```bash
cd backend

# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Run server
python -m app.main

# Install new package
pip install package-name
pip freeze > requirements.txt
```

### Frontend

```bash
cd frontend

# Run dev server
pnpm dev

# Build for production
pnpm build

# Install new package
pnpm add package-name
```

### Redis

```bash
# Start Redis
redis-server

# Check if running
redis-cli ping  # Should return PONG

# Clear all data
redis-cli FLUSHALL

# Monitor commands
redis-cli MONITOR

# Check rate limits
redis-cli KEYS "rate:*"
```

---

## 🐛 Quick Fixes

### Backend won't start

```bash
# Check Redis
redis-cli ping

# Check API key in .env
cat backend/.env

# Reinstall dependencies
pip install -r backend/requirements.txt
```

### Frontend won't connect

```bash
# Check backend is running
curl http://localhost:8000/health

# Check env file
cat frontend/.env.local

# Clear Next.js cache
rm -rf frontend/.next
```

### Rate limit issues

```bash
# Reset rate limits
redis-cli FLUSHALL

# Or change limits in backend/.env
ANON_DAILY_LIMIT=10
```

---

## 📝 Environment Variables

### Backend (`.env`)

```env
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
ANON_DAILY_LIMIT=2
SIGNED_IN_DAILY_LIMIT=10
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Test vent endpoint
curl -X POST http://localhost:8000/api/vent \
  -H "Content-Type: application/json" \
  -d '{"mode":"text","content":"test"}'

# Check Redis keys
redis-cli KEYS "*"

# Monitor backend logs
# Watch terminal running python -m app.main
```

---

## 📊 Performance Monitoring

Watch backend terminal for:

```
⚡ Vent completed in 1.23s | Remaining: 1
```

Targets:
- Total: < 2s
- First token: < 600ms
- API logic: < 100ms

---

## 🔐 Security Checklist

- [ ] API keys in `.env` (not committed)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] PII scrubbing active
- [ ] Redis password set (production)

---

## 📁 Key Files

```
backend/
├── app/main.py           # API routes
├── app/llm_service.py    # LLM streaming
├── app/rate_limiter.py   # Rate limiting
└── .env                  # Config (not committed)

frontend/
├── app/vent/page.tsx     # Vent interface
├── lib/api-client.ts     # Backend client
└── .env.local            # Config (not committed)
```

---

## 🆘 Emergency Commands

```bash
# Kill all Python processes
pkill python

# Kill all Node processes
pkill node

# Stop Redis
redis-cli shutdown

# Clear everything and restart
redis-cli FLUSHALL
# Then restart backend and frontend
```

---

## 📞 Support

- Setup: See `SETUP.md`
- Testing: See `TESTING.md`
- Architecture: See `backend/README.md`
- Full docs: See `README.md`

---

**Pro tip:** Keep this file open while developing! 🚀
