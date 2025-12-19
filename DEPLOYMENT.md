# VentVault - Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Performance targets met
- [ ] Security review completed
- [ ] Environment variables documented
- [ ] Monitoring configured
- [ ] Backup strategy defined

---

## 🔧 Backend Deployment (Fly.io)

### 1. Install Fly CLI

```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

### 2. Login to Fly

```bash
fly auth login
```

### 3. Create Fly App

```bash
cd backend
fly launch

# Follow prompts:
# - App name: ventvault-api
# - Region: Choose closest to users
# - PostgreSQL: No (we use Redis)
# - Deploy now: No (configure first)
```

### 4. Add Redis

```bash
# Option A: Fly Redis (recommended)
fly redis create

# Option B: Upstash Redis
# 1. Go to https://upstash.com
# 2. Create database
# 3. Copy connection URL
```

### 5. Set Environment Variables

```bash
fly secrets set OPENAI_API_KEY=sk-your-key-here
fly secrets set REDIS_URL=redis://your-redis-url
fly secrets set ENVIRONMENT=production
fly secrets set ANON_DAILY_LIMIT=2
fly secrets set SIGNED_IN_DAILY_LIMIT=10
```

### 6. Deploy

```bash
fly deploy
```

### 7. Verify

```bash
# Check status
fly status

# View logs
fly logs

# Test health endpoint
curl https://ventvault-api.fly.dev/health
```

---

## 🌐 Frontend Deployment (Vercel)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
cd frontend
vercel
```

### 4. Set Environment Variables

```bash
# Production API URL
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://ventvault-api.fly.dev
```

### 5. Deploy to Production

```bash
vercel --prod
```

### 6. Configure Custom Domain (Optional)

```bash
vercel domains add ventvault.com
```

---

## 🔐 Security Configuration

### Backend (Fly.io)

**Update CORS in `backend/app/main.py`:**

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ventvault.vercel.app",
        "https://ventvault.com",  # If using custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Redeploy:**
```bash
fly deploy
```

### Redis Security

**Fly Redis:**
```bash
# Already secured by default
# Connection URL includes password
```

**Upstash Redis:**
```bash
# Enable TLS
# Use connection string with password
```

---

## 📊 Monitoring Setup

### Fly.io Monitoring

```bash
# View metrics
fly dashboard

# Set up alerts
fly alerts create
```

### Vercel Monitoring

```bash
# View analytics
vercel analytics

# Set up alerts in Vercel dashboard
```

### Custom Monitoring (Optional)

**Sentry for Error Tracking:**

```bash
# Backend
pip install sentry-sdk[fastapi]

# Frontend
pnpm add @sentry/nextjs
```

**Add to backend:**
```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
)
```

---

## 🧪 Post-Deployment Testing

### 1. Health Check

```bash
curl https://ventvault-api.fly.dev/health
```

**Expected:**
```json
{
  "status": "healthy",
  "redis": "connected"
}
```

### 2. Test Vent Flow

1. Go to https://ventvault.vercel.app
2. Click "[Vent Out]"
3. Create a test vent
4. Verify streaming works
5. Check rate limiting

### 3. Load Testing

```bash
# Install k6
brew install k6  # Mac
choco install k6  # Windows

# Run load test
k6 run load-test.js
```

**load-test.js:**
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let payload = JSON.stringify({
    mode: 'text',
    content: 'Test vent for load testing'
  });

  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let res = http.post('https://ventvault-api.fly.dev/api/vent', payload, params);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}
```

---

## 📈 Scaling Configuration

### Backend Scaling (Fly.io)

**Auto-scaling:**
```bash
# Edit fly.toml
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  max_machines_running = 10
```

**Manual scaling:**
```bash
# Scale up
fly scale count 3

# Scale VM size
fly scale vm shared-cpu-2x
```

### Frontend Scaling (Vercel)

- Automatic by default
- CDN edge caching
- No configuration needed

---

## 💰 Cost Optimization

### Fly.io

**Free tier includes:**
- 3 shared-cpu-1x VMs
- 160GB bandwidth

**Optimize:**
```bash
# Use smallest VM that meets performance
fly scale vm shared-cpu-1x

# Auto-stop when idle
auto_stop_machines = true
```

### Vercel

**Free tier includes:**
- 100GB bandwidth
- Unlimited deployments

**Optimize:**
- Enable edge caching
- Optimize images
- Use ISR for static pages

### LLM Costs

**OpenAI GPT-4o-mini:**
- Input: $0.15 / 1M tokens
- Output: $0.60 / 1M tokens
- ~$0.001 per vent

**Anthropic Claude Haiku:**
- Input: $0.25 / 1M tokens
- Output: $1.25 / 1M tokens
- ~$0.002 per vent

**Optimization:**
- Cache system prompts
- Limit max_tokens
- Use cheaper models for simple vents

---

## 🔄 CI/CD Setup

### GitHub Actions (Optional)

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
```

---

## 🚨 Rollback Procedure

### Backend Rollback

```bash
# List deployments
fly releases

# Rollback to previous
fly releases rollback <version>
```

### Frontend Rollback

```bash
# List deployments
vercel ls

# Rollback in Vercel dashboard
# Or redeploy previous commit
```

---

## 📊 Monitoring Dashboards

### Key Metrics to Track

**Backend:**
- Request latency (P50, P95, P99)
- Error rate
- LLM response time
- Rate limit hits
- Redis connection status

**Frontend:**
- Page load time
- Core Web Vitals
- Error rate
- User sessions

**Business:**
- Daily active users
- Vents per day
- Conversion to sign-in
- Cost per vent

---

## 🔔 Alerting Setup

### Critical Alerts

```bash
# Backend down
fly alerts create --check-type http --threshold 3

# High error rate
# Configure in monitoring tool

# High latency
# Configure in monitoring tool
```

### Alert Channels

- Email
- Slack
- PagerDuty (for critical)

---

## 📝 Deployment Checklist

### Before Deploy

- [ ] Tests passing
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Redis secured
- [ ] Monitoring enabled
- [ ] Alerts configured

### After Deploy

- [ ] Health check passes
- [ ] Test vent flow works
- [ ] Rate limiting works
- [ ] PII scrubbing works
- [ ] Performance meets targets
- [ ] Monitoring shows data
- [ ] Alerts are working

### Post-Launch

- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Review performance
- [ ] Optimize costs
- [ ] Gather user feedback

---

## 🆘 Troubleshooting

### Backend won't deploy

```bash
# Check logs
fly logs

# SSH into machine
fly ssh console

# Check environment
fly secrets list
```

### Frontend build fails

```bash
# Check build logs
vercel logs

# Test build locally
cd frontend
pnpm build
```

### High latency

```bash
# Check LLM response time
fly logs | grep "Vent completed"

# Scale up if needed
fly scale count 2
```

---

## 📚 Additional Resources

- [Fly.io Docs](https://fly.io/docs/)
- [Vercel Docs](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✅ Production Readiness

Your VentVault is production-ready when:

✅ Backend deployed and healthy
✅ Frontend deployed and accessible
✅ CORS configured correctly
✅ Environment variables set
✅ Redis secured
✅ Monitoring enabled
✅ Alerts configured
✅ Load testing passed
✅ Rollback procedure tested
✅ Documentation updated

---

**Next:** Monitor, optimize, and scale! 🚀
