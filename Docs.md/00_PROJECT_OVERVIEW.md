# 00 - PROJECT OVERVIEW
## ClaimGuard AI - Hackathon Edition

> **Mission**: Build an AI-powered insurance claims platform that approves legitimate claims in under 60 seconds using Gemini 2.0 Flash for vision analysis and fraud detection.

---

## 🎯 THE VISION

**Problem**: Insurance claims take 7-14 days to process. Fraud costs Nigerian insurers ₦50B+ annually.

**Solution**: Computer vision + behavioral analysis = instant, fraud-resistant claims processing.

**Demo Hook**: "Upload a photo of your car damage. Get approved in 45 seconds."

---

## 🏗️ THE MODERN STACK (2025)

### Frontend (Vercel-Native)
```json
{
  "framework": "Next.js 14.2+ (App Router)",
  "language": "TypeScript 5.3+",
  "ui": "Shadcn/UI (Radix Primitives)",
  "styling": "Tailwind CSS 3.4+",
  "forms": "React Hook Form + Zod",
  "state": "TanStack Query (server) + Zustand (client)",
  "animations": "Framer Motion",
  "deployment": "Vercel"
}
```

### Backend (AI-First)
```json
{
  "framework": "FastAPI 0.109+ (Async)",
  "language": "Python 3.11+",
  "ai": "Gemini 2.0 Flash (Free Tier - 1500 RPD)",
  "database": "PostgreSQL (Supabase Free Tier)",
  "orm": "SQLAlchemy 2.0 (Async)",
  "validation": "Pydantic V2",
  "storage": "Supabase Storage (Free 1GB)",
  "deployment": "Railway (Free Tier)"
}
```

---

## 🔑 GEMINI API SETUP (FREE TIER)

### Get Your API Key
```bash
# Visit: https://aistudio.google.com/app/apikey
# Create new API key
# Free tier limits:
# - 15 requests per minute
# - 1,500 requests per day
# - 1 million tokens per day
```

### Environment Variables
```bash
# .env.local (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000

# .env (Backend)
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@localhost:5432/claimguard
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

### Rate Limit Strategy (Hackathon)
```python
# We have 15 RPM, so we'll:
# 1. Cache identical images (hash-based)
# 2. Use async processing (parallel fraud checks)
# 3. Mock responses for demo mode
```

---

## 📐 SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      USER (Mobile/Web)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS 14 (Vercel Edge)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Claim Form   │  │ Processing   │  │   Result     │      │
│  │ (Zod + RHF)  │  │ Animation    │  │   Display    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              FASTAPI (Railway)                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/v1/claims/submit                          │  │
│  │    ├─ Image Upload to Supabase                       │  │
│  │    ├─ Trigger Parallel Processing                    │  │
│  │    └─ Return claim_id                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI PROCESSING PIPELINE (Async)                      │  │
│  │                                                        │  │
│  │  ┌─────────────────┐    ┌──────────────────┐         │  │
│  │  │ Gemini Vision   │───▶│ Damage Analysis  │         │  │
│  │  │ (GPT-4o level)  │    │ (Type, Cost)     │         │  │
│  │  └─────────────────┘    └──────────────────┘         │  │
│  │                                                        │  │
│  │  ┌─────────────────┐    ┌──────────────────┐         │  │
│  │  │ EXIF Extractor  │───▶│ Metadata Check   │         │  │
│  │  │ (Pillow)        │    │ (Date, Location) │         │  │
│  │  └─────────────────┘    └──────────────────┘         │  │
│  │                                                        │  │
│  │  ┌─────────────────┐    ┌──────────────────┐         │  │
│  │  │ Database Query  │───▶│ Frequency Check  │         │  │
│  │  │ (SQLAlchemy)    │    │ (Claim History)  │         │  │
│  │  └─────────────────┘    └──────────────────┘         │  │
│  │                                                        │  │
│  │  └──────────────────▶ DECISION ENGINE ◀───────────┘  │  │
│  │                      (Score 0-100)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│           SUPABASE (PostgreSQL + Storage)                    │
│  - Claims table                                              │
│  - Customers table                                           │
│  - Image files (1GB free)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎪 DEMO FLOW (45 SECONDS)

### Act 1: The Upload (0:00 - 0:15)
- User drags/drops car damage photo
- Form auto-fills demo data
- Click "Submit Claim"

### Act 2: The Magic (0:15 - 0:40)
- Animated progress bar
- Real-time status updates:
  - ✓ "Analyzing damage..." (Gemini processing)
  - ✓ "Checking for fraud..." (EXIF + DB check)
  - ✓ "Calculating payout..." (Decision engine)

### Act 3: The Reveal (0:40 - 0:45)
- 🟢 **APPROVED** (90% of demo claims)
  - "₦180,000 approved"
  - "Money arrives in 24 hours"
- 🟡 **REVIEW** (suspicious metadata)
- 🔴 **REJECTED** (stock photo detected)

---

## 🚀 QUICK START (15 MINUTES)

### 1. Clone & Install
```bash
# Frontend
npx create-next-app@latest claimguard-frontend \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
cd claimguard-frontend
npm install @tanstack/react-query zustand react-hook-form zod
npx shadcn-ui@latest init

# Backend
mkdir claimguard-backend && cd claimguard-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy asyncpg pydantic pillow \
  google-generativeai python-multipart python-dotenv
```

### 2. Get Gemini API Key
```bash
# Visit: https://aistudio.google.com/app/apikey
# Copy key to backend/.env
echo "GEMINI_API_KEY=your_key_here" > .env
```

### 3. Setup Supabase (2 minutes)
```bash
# Visit: https://supabase.com/dashboard
# Create new project (free tier)
# Copy URL + anon key to backend/.env
```

### 4. Run Both Servers
```bash
# Terminal 1 (Backend)
cd claimguard-backend
uvicorn main:app --reload

# Terminal 2 (Frontend)
cd claimguard-frontend
npm run dev
```

---

## 📊 FEATURE PRIORITY (HACKATHON)

### ✅ MUST HAVE (Demo Blockers)
- [ ] Image upload (mobile camera support)
- [ ] Gemini vision damage analysis
- [ ] Fraud score calculation
- [ ] Instant approval/rejection UI
- [ ] Admin dashboard (basic)

### 🎯 NICE TO HAVE (If Time Permits)
- [ ] WebSocket real-time updates
- [ ] PDF report generation
- [ ] SMS notifications (Twilio)
- [ ] Multi-language support

### ❌ OUT OF SCOPE
- User authentication (demo accounts only)
- Payment integration
- Email notifications
- Mobile app

---

## 🎨 DESIGN PRINCIPLES

### 1. Speed First
- Prefetch images
- Optimistic UI updates
- Skeleton loaders everywhere

### 2. Trust Signals
- Live counter: "₦142M fraud prevented"
- Processing animation (not a spinner)
- Transparent fraud reasoning

### 3. Mobile-First
- Claim submission via camera
- Touch-optimized UI
- Works offline (PWA)

---

## 📈 SUCCESS METRICS (JUDGE CRITERIA)

### Technical Excellence (40%)
- ✓ Clean TypeScript (no `any`)
- ✓ Proper error handling
- ✓ API documentation (FastAPI auto-docs)
- ✓ Responsive design

### Innovation (30%)
- ✓ Novel fraud detection method
- ✓ Real-time processing UX
- ✓ Nigerian market fit (Naira, Lagos rates)

### Demo Impact (30%)
- ✓ Works flawlessly on stage
- ✓ Visually impressive
- ✓ Clear value proposition

---

## 🔥 NEXT STEPS

1. **Read**: `01_DESIGN_SYSTEM.md` (Get the UI right)
2. **Code**: `02_GEMINI_INTEGRATION.md` (Set up AI)
3. **Build**: `03_FRONTEND_GUIDE.md` (Create claim form)
4. **Ship**: `06_MVP_EXECUTION.md` (Hour-by-hour plan)

---

**Status**: Foundation document complete ✅  
**Next**: Design system configuration →
