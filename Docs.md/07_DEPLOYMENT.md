# 07 - DEPLOYMENT GUIDE
## Production Deployment (Vercel + Railway + Supabase)

> **Stack**: Frontend (Vercel), Backend (Railway), Database (Supabase)

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌──────────────────────────────────────────────────────────┐
│                        USERS                              │
└────────────┬─────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│              VERCEL EDGE NETWORK                            │
│  ┌──────────────────────────────────────────────────┐     │
│  │  Next.js 14 App (Static + SSR)                   │     │
│  │  - Landing Page (Static)                         │     │
│  │  - Claim Form (Client-side)                      │     │
│  │  - Admin Dashboard (SSR)                         │     │
│  │                                                   │     │
│  │  CDN: Cloudflare                                 │     │
│  │  Region: Auto (closest to user)                  │     │
│  └──────────────────────────────────────────────────┘     │
└────────────┬───────────────────────────────────────────────┘
             │ HTTPS
             ▼
┌────────────────────────────────────────────────────────────┐
│                   RAILWAY                                   │
│  ┌──────────────────────────────────────────────────┐     │
│  │  FastAPI Backend                                 │     │
│  │  - Python 3.11                                   │     │
│  │  - Uvicorn ASGI server                           │     │
│  │  - Auto-scaling (0-5 instances)                  │     │
│  │                                                   │     │
│  │  Health Check: /health                           │     │
│  │  Region: us-west1                                │     │
│  └──────────────────────────────────────────────────┘     │
└────────────┬───────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────┐
│                   SUPABASE                                  │
│  ┌─────────────────────┐  ┌──────────────────────┐        │
│  │  PostgreSQL DB       │  │  Storage (S3)        │        │
│  │  - 500MB free        │  │  - 1GB free          │        │
│  │  - Auto backups      │  │  - CDN-backed        │        │
│  └─────────────────────┘  └──────────────────────┘        │
│  Region: ap-southeast-1 (Singapore)                        │
└────────────────────────────────────────────────────────────┘

External APIs:
- Gemini 2.0 Flash (Free tier: 1500 RPD)
```

---

## 🚀 DEPLOYMENT STEPS

### 1. SUPABASE (Already Done)

**If not done:**
```bash
# 1. Create project: https://supabase.com/dashboard
# 2. Run schema from 05_DATABASE_SCHEMA.md
# 3. Create storage bucket
# 4. Note connection details
```

**Verify:**
```bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Or via Python
python -c "from supabase import create_client; print('✓ Connected')"
```

---

### 2. RAILWAY (Backend)

#### Step 1: Setup Account
```bash
# Visit: https://railway.app
# Sign up with GitHub
# Free tier: $5 credit/month, 500 hours
```

#### Step 2: Deploy Backend
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
cd claimguard-backend
railway init

# Create service
railway up

# Deploy will auto-detect Python and install from requirements.txt
```

#### Step 3: Configure Environment Variables

**Via Railway Dashboard:**
```
Settings > Variables > Add Variable

GEMINI_API_KEY=AIzaSy...
DATABASE_URL=postgresql+asyncpg://postgres:...@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...
SUPABASE_BUCKET=claim-images
ALLOWED_ORIGINS=["https://your-frontend.vercel.app"]
```

#### Step 4: Configure Build

**Create `railway.toml`:**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Or use `Procfile`:**
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

#### Step 5: Get Deployment URL
```bash
# After deployment
railway domain

# Example output:
# claimguard-backend-production.up.railway.app
```

#### Step 6: Test Backend
```bash
# Health check
curl https://claimguard-backend-production.up.railway.app/health

# API docs
# Visit: https://claimguard-backend-production.up.railway.app/docs
```

---

### 3. VERCEL (Frontend)

#### Step 1: Setup Account
```bash
# Visit: https://vercel.com
# Sign up with GitHub
# Free tier: Unlimited deployments
```

#### Step 2: Install CLI
```bash
npm i -g vercel
```

#### Step 3: Deploy
```bash
cd claimguard-frontend

# First deployment (interactive)
vercel

# Follow prompts:
# ? Set up and deploy "claimguard-frontend"? Y
# ? Which scope? [Your account]
# ? Link to existing project? N
# ? What's your project's name? claimguard-ai
# ? In which directory is your code located? ./
# ? Want to modify settings? N
```

#### Step 4: Configure Environment Variables

**Via Vercel Dashboard:**
```
Project Settings > Environment Variables

NEXT_PUBLIC_API_URL=https://claimguard-backend-production.up.railway.app

# Or via CLI:
vercel env add NEXT_PUBLIC_API_URL production
# Paste: https://claimguard-backend-production.up.railway.app
```

#### Step 5: Production Deployment
```bash
# Deploy to production
vercel --prod

# Get URL
# Example: https://claimguard-ai.vercel.app
```

#### Step 6: Custom Domain (Optional)
```bash
# Via Dashboard: Settings > Domains
# Add: claimguard.ai (if you own it)

# Or via CLI:
vercel domains add claimguard.ai
```

---

## 🔧 POST-DEPLOYMENT CONFIGURATION

### Update CORS (Backend)

**Edit `app/config.py`:**
```python
class Settings(BaseSettings):
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "https://claimguard-ai.vercel.app",  # Add production URL
        "https://claimguard-ai-*.vercel.app" # Preview deployments
    ]
```

**Redeploy:**
```bash
railway up
```

### Enable HTTPS Only

**Vercel (automatic):**
- All Vercel deployments are HTTPS by default
- HTTP requests auto-redirect to HTTPS

**Railway:**
```bash
# Railway also provides HTTPS by default
# No configuration needed
```

---

## 📊 MONITORING & LOGS

### Railway Logs
```bash
# View logs in real-time
railway logs

# Or via dashboard:
# Project > Deployments > [Latest] > Logs
```

### Vercel Logs
```bash
# View logs
vercel logs

# Or via dashboard:
# Project > Deployments > [Latest] > Logs
```

### Supabase Logs
```bash
# Dashboard > Database > Logs
# View query performance, errors
```

---

## 🔍 DEBUGGING PRODUCTION ISSUES

### Backend Not Responding

**Check Railway logs:**
```bash
railway logs --tail 100
```

**Common issues:**
- ❌ Missing environment variable → Add in Railway dashboard
- ❌ Port binding error → Ensure using `$PORT` variable
- ❌ Database connection → Verify `DATABASE_URL`

### Frontend API Errors

**Check browser console:**
- ❌ CORS error → Update `ALLOWED_ORIGINS` in backend
- ❌ 404 Not Found → Verify `NEXT_PUBLIC_API_URL`
- ❌ Network error → Check Railway deployment status

### Gemini API Errors

**Rate limit exceeded:**
```python
# backend/app/services/damage_assessment.py
# Add caching layer

from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def get_cached_analysis(image_hash: str):
    # Return cached result if exists
    pass
```

**Test API key:**
```bash
curl https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-exp:generateContent \
  -H 'Content-Type: application/json' \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## 🧪 SMOKE TESTING

### Automated Test Script
```bash
#!/bin/bash
# test-production.sh

API_URL="https://claimguard-backend-production.up.railway.app"
FRONTEND_URL="https://claimguard-ai.vercel.app"

# Test 1: Backend health
echo "Testing backend health..."
curl -f "$API_URL/health" || exit 1

# Test 2: Frontend loads
echo "Testing frontend..."
curl -f "$FRONTEND_URL" || exit 1

# Test 3: API docs accessible
echo "Testing API docs..."
curl -f "$API_URL/docs" || exit 1

echo "✓ All smoke tests passed!"
```

### Manual Test Checklist
- [ ] Landing page loads
- [ ] Claim form accessible
- [ ] Image upload works
- [ ] Form validation works
- [ ] Claim submits successfully
- [ ] Processing animation shows
- [ ] Result displays correctly
- [ ] Admin dashboard loads
- [ ] Mobile layout works

---

## 📈 PERFORMANCE OPTIMIZATION

### Frontend (Vercel)

**Enable Caching:**
```typescript
// next.config.js
module.exports = {
  images: {
    domains: ['xxx.supabase.co'], // Supabase storage
  },
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
```

### Backend (Railway)

**Add Redis Caching (if needed):**
```bash
# Add Redis to Railway
railway add redis

# Update code
from redis import asyncio as aioredis

redis = aioredis.from_url(os.getenv("REDIS_URL"))
```

### Database (Supabase)

**Add Indexes:**
```sql
-- Already done in schema, but verify:
EXPLAIN ANALYZE 
SELECT * FROM claims WHERE policy_number = 'HIG-MOT-2024-001';

-- Should use index, not sequential scan
```

---

## 💰 COST BREAKDOWN (Free Tier)

```
┌────────────────────────────────────────────────────────┐
│ SERVICE      │ FREE TIER           │ COST IF EXCEEDED │
├────────────────────────────────────────────────────────┤
│ Vercel       │ 100GB bandwidth     │ $20/100GB        │
│              │ Unlimited deploys   │                  │
├────────────────────────────────────────────────────────┤
│ Railway      │ $5 credit/month     │ $0.000231/min    │
│              │ ~500 hours          │                  │
├────────────────────────────────────────────────────────┤
│ Supabase     │ 500MB database      │ $25/month (Pro)  │
│              │ 1GB storage         │                  │
│              │ 2GB bandwidth       │                  │
├────────────────────────────────────────────────────────┤
│ Gemini       │ 1500 requests/day   │ N/A (hard limit) │
│              │ 15 requests/min     │                  │
├────────────────────────────────────────────────────────┤
│ TOTAL        │ $0/month            │ ~$50/month       │
└────────────────────────────────────────────────────────┘

For hackathon demo: 100% free ✓
```

---

## 🔐 SECURITY CHECKLIST

- [ ] All API keys in environment variables (not committed)
- [ ] HTTPS enforced on all services
- [ ] CORS properly configured
- [ ] Supabase RLS enabled (if using auth)
- [ ] Input validation on all endpoints
- [ ] File upload size limits enforced
- [ ] Rate limiting configured
- [ ] Error messages don't leak secrets

---

## 🎯 FINAL DEPLOYMENT CHECKLIST

### Before Demo Day
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] Database seeded with demo data
- [ ] Test end-to-end flow
- [ ] Mobile responsive verified
- [ ] Error handling tested
- [ ] Backup video recorded
- [ ] Custom domain configured (optional)

### Demo Day Morning
- [ ] Test production URL
- [ ] Verify Gemini API quota
- [ ] Check Railway/Vercel status
- [ ] Clear browser cache
- [ ] Login to demo account
- [ ] Have backup screenshots ready

---

**Status**: Deployment guide complete ✅  
**You're ready to ship!** 🚀
