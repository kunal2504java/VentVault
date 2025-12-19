# VentVault - Testing Guide

## ✅ Pre-Launch Checklist

### 1. Backend Health Check

```bash
# Terminal 1: Start backend
cd backend
python -m app.main

# Terminal 2: Test health endpoint
curl http://localhost:8000/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "redis": "connected"
}
```

---

### 2. Frontend Connection

1. Start frontend: `cd frontend && pnpm dev`
2. Open http://localhost:3000
3. Look for **green "Backend Connected"** indicator in bottom-right corner

❌ If red "Backend Offline":
- Check backend is running on port 8000
- Verify `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Check browser console for errors

---

### 3. Text Venting Flow

**Test Case: Happy Path**

1. Go to http://localhost:3000
2. Click **"[Vent Out]"** button
3. Choose **"Write it out"**
4. Type: "I feel stressed about work"
5. Press Enter or click Send

**Expected behavior:**
- Loading spinner appears
- AI response streams word-by-word
- Response completes in < 2 seconds
- "Another vent" and "Continue" buttons appear

**Backend logs should show:**
```
⚡ Vent completed in 1.23s | Remaining: 1
```

---

### 4. Voice Venting Flow

**Test Case: Voice Recording**

1. From vent page, click **"Back"**
2. Choose **"Speak freely"**
3. Click microphone button
4. Wait 3-5 seconds (visualizer should animate)
5. Click stop button

**Expected behavior:**
- Recording indicator shows
- Visualizer bars animate
- AI response streams after stopping
- Response acknowledges voice input

---

### 5. Rate Limiting

**Test Case: Anonymous Limit**

1. Complete 2 text vents
2. Try a 3rd vent

**Expected behavior:**
- Error message: "Daily vent limit reached. Sign in for more."
- HTTP 429 status code

**Reset rate limit:**
```bash
redis-cli FLUSHALL
```

---

### 6. PII Scrubbing

**Test Case: Email Removal**

1. Create vent with: "Contact me at test@example.com"
2. Check backend logs (should NOT show email)
3. AI response should not reference email

**Test Case: Phone Removal**

1. Create vent with: "Call me at 555-123-4567"
2. Backend should scrub phone number

---

### 7. Performance Testing

**Test Case: Latency**

Create 10 vents and measure:
- Time to first token (should be < 600ms)
- Total response time (should be < 2s)

**Backend logs show timing:**
```
⚡ Vent completed in 1.23s | Remaining: 1
```

---

### 8. Error Handling

**Test Case: Backend Offline**

1. Stop backend server
2. Try to create vent
3. Should show error message
4. "Backend Offline" indicator should be red

**Test Case: Empty Vent**

1. Try to submit empty text
2. Submit button should be disabled

**Test Case: Network Error**

1. Disconnect internet
2. Try to create vent
3. Should show connection error

---

### 9. UI/UX Testing

**Test Case: Responsive Design**

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

**Test Case: Day/Night Mode**

- [ ] Changes automatically based on time
- [ ] Colors adapt correctly
- [ ] Particles adjust

**Test Case: Animations**

- [ ] Particle system loads
- [ ] Hover effects work
- [ ] Transitions smooth

---

### 10. Cross-Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

---

## 🐛 Common Issues

### Issue: "Backend Offline"

**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS settings in backend/app/main.py
# Should allow http://localhost:3000
```

### Issue: Rate limit not working

**Solution:**
```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check Redis connection in backend
# Look for "redis": "connected" in /health
```

### Issue: Slow responses

**Solution:**
- Check LLM API key is valid
- Verify internet connection
- Check backend logs for errors
- Try different LLM provider

### Issue: PII not scrubbed

**Solution:**
- Check `pii_scrubber.py` patterns
- Add custom patterns if needed
- Test with various PII formats

---

## 📊 Load Testing

### Simple Load Test

```bash
# Install Apache Bench
# Windows: Download from Apache website
# Mac: brew install ab
# Linux: sudo apt-get install apache2-utils

# Test 100 requests, 10 concurrent
ab -n 100 -c 10 -p vent.json -T application/json http://localhost:8000/api/vent
```

**vent.json:**
```json
{
  "mode": "text",
  "content": "I feel stressed"
}
```

### Expected Results

- Requests per second: > 50
- Mean response time: < 2000ms
- Failed requests: 0

---

## 🔍 Debugging

### Enable Verbose Logging

**Backend:**
```python
# In app/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```typescript
// In lib/api-client.ts
console.log("Streaming token:", token)
```

### Monitor Redis

```bash
# Watch Redis commands in real-time
redis-cli MONITOR

# Check rate limit keys
redis-cli KEYS "rate:*"

# Get specific key value
redis-cli GET "rate:anon:abc123"
```

### Check Network

**Browser DevTools:**
1. Open Network tab
2. Filter by "vent"
3. Check request/response
4. Verify SSE stream

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Rate limiting works
- [ ] PII scrubbing verified
- [ ] Error handling tested
- [ ] Performance meets targets
- [ ] CORS configured for production domain
- [ ] Environment variables set
- [ ] Redis secured with password
- [ ] API keys rotated
- [ ] Monitoring enabled

---

## 🎯 Success Criteria

Your VentVault is ready when:

✅ Backend health check passes
✅ Frontend connects successfully  
✅ Text venting works end-to-end
✅ Voice venting works end-to-end
✅ Rate limiting enforced
✅ PII scrubbed correctly
✅ Responses stream smoothly
✅ P95 latency < 2 seconds
✅ No errors in console
✅ Works on mobile

---

## 📝 Test Report Template

```markdown
## Test Session: [Date]

### Environment
- Backend: Running / Not Running
- Frontend: Running / Not Running
- Redis: Connected / Disconnected

### Test Results
- [ ] Health check: PASS / FAIL
- [ ] Text venting: PASS / FAIL
- [ ] Voice venting: PASS / FAIL
- [ ] Rate limiting: PASS / FAIL
- [ ] PII scrubbing: PASS / FAIL
- [ ] Performance: PASS / FAIL

### Issues Found
1. [Description]
2. [Description]

### Notes
[Any observations]
```

---

Happy testing! 🧪
