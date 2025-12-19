# VentVault - Complete Setup Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+
- Redis (local or cloud)
- OpenAI or Anthropic API key

---

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install packages
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
copy .env.example .env  # Windows
cp .env.example .env    # Mac/Linux

# Edit .env and add your API key
```

**Required in `.env`:**
```env
OPENAI_API_KEY=sk-your-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-key-here

REDIS_URL=redis://localhost:6379
```

### 3. Start Redis

**Option A: Local Redis**
```bash
# Windows (with Chocolatey)
choco install redis-64
redis-server

# Mac
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis
```

**Option B: Cloud Redis (Upstash)**
1. Go to https://upstash.com
2. Create free Redis database
3. Copy connection URL to `.env`

### 4. Run Backend

```bash
cd backend
python -m app.main
```

Backend runs at: **http://localhost:8000**

API docs: **http://localhost:8000/docs**

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
pnpm install
```

### 2. Configure Environment

```bash
# Copy example env file
copy .env.local.example .env.local  # Windows
cp .env.local.example .env.local    # Mac/Linux
```

**`.env.local` should contain:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Run Frontend

```bash
pnpm dev
```

Frontend runs at: **http://localhost:3000**

---

## ✅ Verify Setup

### 1. Check Backend Health

Open: http://localhost:8000/health

Should see:
```json
{
  "status": "healthy",
  "redis": "connected"
}
```

### 2. Test Frontend Connection

1. Go to http://localhost:3000
2. Click "[Vent Out]" button
3. Look for green "Backend Connected" indicator in bottom-right

### 3. Test Venting

1. Choose "Write it out" or "Speak freely"
2. Type or record a vent
3. Watch AI response stream in real-time
4. Check backend terminal for latency logs

---

## 🐛 Troubleshooting

### Backend won't start

**Error: `redis.exceptions.ConnectionError`**
- Make sure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_URL` in `.env`

**Error: `openai.AuthenticationError`**
- Verify your API key in `.env`
- Make sure no extra spaces or quotes

### Frontend can't connect

**"Backend Offline" indicator**
- Check backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

**CORS errors**
- Backend `main.py` has CORS middleware
- Default allows `http://localhost:3000`
- Update if using different port

### Rate limit issues

**"Daily vent limit reached"**
- Default: 2 vents/day for anonymous users
- Clear Redis: `redis-cli FLUSHALL`
- Or change limits in `backend/.env`

---

## 📊 Monitoring

### Backend Logs

Watch terminal for:
```
⚡ Vent completed in 1.23s | Remaining: 1
```

### Performance Targets

- Total latency: < 2 seconds
- Time to first token: < 600ms
- API logic: < 100ms

---

## 🚢 Production Deployment

### Backend (Fly.io / Railway)

```bash
cd backend

# Build Docker image
docker build -t ventvault-backend .

# Deploy to Fly.io
fly launch
fly deploy
```

### Frontend (Vercel)

```bash
cd frontend

# Deploy to Vercel
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL
# Enter your production backend URL
```

---

## 🔐 Security Checklist

Before going live:

- [ ] Change CORS origins in `backend/app/main.py`
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only
- [ ] Set up rate limiting alerts
- [ ] Configure Redis password
- [ ] Review PII scrubbing patterns

---

## 📚 Next Steps

1. **Test the flow** - Create a vent and verify streaming works
2. **Check rate limits** - Try exceeding daily limit
3. **Monitor latency** - Watch backend logs for performance
4. **Add auth** - Implement Clerk/Auth.js for signed-in users
5. **Background jobs** - Add emotion classification worker

---

## 🆘 Need Help?

- Backend API docs: http://localhost:8000/docs
- Check `backend/README.md` for architecture details
- Review implementation plan in root directory

---

## 🎉 You're Ready!

Both frontend and backend should now be running and connected. Try creating your first vent!
