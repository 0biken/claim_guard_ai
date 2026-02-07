# 06 - MVP EXECUTION PLAN
## Hour-by-Hour Hackathon Build Schedule

> **Total Time**: 24 hours | **Team Size**: 1-3 developers

---

## ⏱️ TIME ALLOCATION

```
Phase 1: Setup (4 hours)           ████░░░░░░░░░░░░░░░░
Phase 2: Core Features (10 hours)  ████████████░░░░░░░░
Phase 3: Polish (6 hours)          ████████░░░░░░░░░░░░
Phase 4: Deploy & Test (4 hours)   ██████░░░░░░░░░░░░░░
```

---

## 🚀 PHASE 1: SETUP & FOUNDATION (Hours 0-4)

### Hour 0-1: Project Initialization

**Frontend**
```bash
# Create Next.js app
npx create-next-app@latest claimguard-frontend \
  --typescript --tailwind --app --src-dir --import-alias "@/*"

cd claimguard-frontend

# Install core dependencies
npm install @tanstack/react-query zustand axios react-hook-form zod \
  @hookform/resolvers framer-motion react-dropzone lucide-react sonner

# Install Shadcn
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label textarea select badge alert progress toast dialog skeleton
```

**Backend**
```bash
# Create FastAPI project
mkdir claimguard-backend && cd claimguard-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn sqlalchemy asyncpg pydantic pydantic-settings \
  python-multipart python-dotenv google-generativeai pillow supabase alembic
```

### Hour 1-2: Configuration

**Tailwind Config** (`frontend/tailwind.config.ts`)
- Copy design system from `01_DESIGN_SYSTEM.md`
- Add color tokens
- Configure fonts

**Environment Variables**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# backend/.env
GEMINI_API_KEY=your_key_here
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
```

**Supabase Setup**
1. Create project at supabase.com
2. Run schema SQL from `05_DATABASE_SCHEMA.md`
3. Create storage bucket
4. Test connection

### Hour 2-3: Database Models

**Create Models** (`backend/app/models/`)
- `claim.py` - Claim model
- `customer.py` - Customer model
- `database.py` - Connection setup

**Seed Data**
```bash
# Insert demo customers
python -c "from app.database import seed_demo_data; seed_demo_data()"
```

### Hour 3-4: Basic API Structure

**Create Routes** (`backend/app/routers/`)
- `claims.py` - POST /submit, GET /status
- `admin.py` - GET /claims, GET /analytics

**Test Server**
```bash
# Start backend
uvicorn app.main:app --reload

# Visit: http://localhost:8000/docs
# Test health check endpoint
```

**✅ Phase 1 Deliverables:**
- [x] Projects created
- [x] Dependencies installed
- [x] Database connected
- [x] API responding

---

## 🧠 PHASE 2: CORE FEATURES (Hours 4-14)

### Hour 4-6: Gemini Integration

**Damage Assessment Service** (`backend/app/services/damage_assessment.py`)
- Copy implementation from `02_GEMINI_INTEGRATION.md`
- Test with sample car damage image
- Verify JSON response parsing

**Test**
```python
# backend/tests/test_gemini.py
import asyncio
from app.services.damage_assessment import DamageAssessor

async def test():
    assessor = DamageAssessor()
    with open("test_car.jpg", "rb") as f:
        result = await assessor.analyze_damage(f.read(), "motor")
    print(result)

asyncio.run(test())
```

### Hour 6-8: Fraud Detection

**Implement Services** (`backend/app/services/fraud_detection.py`)
- Metadata analyzer
- Frequency checker
- Timing analyzer
- Fraud scorer

**Test Each Signal**
```python
# Test metadata extraction
from app.services.fraud_detection import MetadataAnalyzer
analyzer = MetadataAnalyzer()
with open("test_image.jpg", "rb") as f:
    metadata = analyzer.extract_exif(f.read())
print(metadata)
```

### Hour 8-10: Decision Engine

**Implement Logic** (`backend/app/services/decision_engine.py`)
- Approval rules (fraud < 30, cost < limit)
- Review rules (31-70 fraud score)
- Rejection rules (fraud > 70)

**Wire Up Complete Flow**
```python
# backend/app/routers/claims.py
# Connect: submit → process → damage + fraud → decision
```

**Test End-to-End**
```bash
# Use Postman or curl
curl -X POST http://localhost:8000/api/v1/claims/submit \
  -F "policy_number=HIG-MOT-2024-001" \
  -F "claim_type=motor" \
  -F "incident_date=2024-02-05" \
  -F "description=Front bumper damaged in parking lot" \
  -F "images=@test1.jpg" \
  -F "images=@test2.jpg"
```

### Hour 10-12: Frontend - Claim Form

**Create Components** (`frontend/components/`)
- `claim-form.tsx` - Multi-step form (Step 1: Details, Step 2: Upload)
- Use React Hook Form + Zod validation
- Integrate TanStack Query mutation

**Test Form**
- Fill out form
- Upload images
- Submit to backend
- Verify claim created

### Hour 12-14: Frontend - Processing & Results

**Processing Page** (`frontend/app/result/[id]/page.tsx`)
- Show animated steps
- Poll claim status every 2 seconds
- Display when complete

**Result Display** (`frontend/components/result-display.tsx`)
- Approved state (green check, amount)
- Review state (amber warning)
- Rejected state (red flag)

**✅ Phase 2 Deliverables:**
- [x] Gemini analyzing images
- [x] Fraud detection working
- [x] Decisions being made
- [x] Frontend submitting claims
- [x] Results displaying

---

## 🎨 PHASE 3: POLISH & FEATURES (Hours 14-20)

### Hour 14-16: Admin Dashboard

**Layout** (`frontend/app/admin/page.tsx`)
- Stats cards (claims today, avg time, fraud rate)
- Claims table (TanStack Table)
- Filters (status, date range)

**Backend Endpoints**
```python
# GET /api/v1/admin/claims
# GET /api/v1/admin/analytics
```

### Hour 16-17: UI/UX Enhancements

**Animations**
- Framer Motion transitions
- Loading skeletons
- Success/error toasts (Sonner)

**Responsive Design**
- Test mobile layout
- Fix spacing issues
- Add touch targets

### Hour 17-18: Demo Mode

**Backend** (`backend/app/demo.py`)
```python
DEMO_SCENARIOS = {
    "clean": {"fraud_score": 12, "decision": "approved"},
    "suspicious": {"fraud_score": 65, "decision": "review"},
    "fraud": {"fraud_score": 95, "decision": "rejected"}
}
```

**Frontend**
- Add "Try Demo" button on landing page
- Pre-fill form with demo data
- Use demo images

### Hour 18-20: Error Handling & Edge Cases

**Backend**
- Validate image types/sizes
- Handle Gemini rate limits
- Add retry logic
- Proper error responses

**Frontend**
- Error boundaries
- Network error handling
- Form validation errors
- Empty states

**✅ Phase 3 Deliverables:**
- [x] Admin dashboard functional
- [x] Smooth animations
- [x] Demo mode working
- [x] Error handling robust

---

## 🚀 PHASE 4: DEPLOYMENT & TESTING (Hours 20-24)

### Hour 20-21: Backend Deployment (Railway)

```bash
# Create railway.app account
# Install CLI: npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add environment variables in Railway dashboard
# GEMINI_API_KEY
# DATABASE_URL (Supabase connection)
# SUPABASE_URL
# SUPABASE_KEY

# Get deployment URL
# e.g., https://claimguard-backend-production.up.railway.app
```

### Hour 21-22: Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd claimguard-frontend
vercel

# Add environment variable
# NEXT_PUBLIC_API_URL=https://your-railway-url.app

# Production deployment
vercel --prod
```

### Hour 22-23: End-to-End Testing

**Test Flows**
1. **Happy Path** (Legitimate claim)
   - Submit with valid photos
   - Wait for approval
   - Verify payout amount

2. **Fraud Detection** (Stock photo)
   - Submit with internet image
   - Should flag as fraud
   - Verify rejection

3. **Review Case** (Borderline)
   - Submit with edited photo
   - Should go to review
   - Verify flags displayed

4. **Admin Dashboard**
   - View all claims
   - Filter by status
   - Verify stats update

**Mobile Testing**
- Test on actual phone
- Camera upload works
- Layout responsive

### Hour 23-24: Presentation Prep

**Create Demo Script**
```markdown
1. Opening (30s)
   - "Insurance claims take 2 weeks. We do it in 60 seconds."
   
2. Live Demo (2 min)
   - Open landing page
   - Click "Try Demo"
   - Show image upload
   - Watch AI process live
   - Reveal approval in 45 seconds
   
3. Admin View (30s)
   - Show fraud detection in action
   - Stats dashboard
   
4. Impact (30s)
   - "₦124M fraud prevented"
   - "73% auto-approval rate"
   - "47 second average processing"
```

**Backup Plan**
- Record video demo (in case of network issues)
- Take screenshots of each step
- Have offline version ready

**Presentation Materials**
- 10-slide pitch deck
- Technical architecture diagram
- Demo account credentials printed

**✅ Phase 4 Deliverables:**
- [x] Backend deployed
- [x] Frontend deployed
- [x] All features tested
- [x] Demo rehearsed
- [x] Backup ready

---

## 🎯 DEMO DAY CHECKLIST (Final Hour)

### 30 Minutes Before

- [ ] Clear browser cache
- [ ] Test production URLs
- [ ] Login to demo account
- [ ] Close unnecessary tabs
- [ ] Silence phone notifications
- [ ] Test microphone/screen share
- [ ] Have backup video queued

### During Presentation

- [ ] Start with problem (insurance is slow)
- [ ] Show live claim submission (1 min)
- [ ] Watch AI processing live (45 sec)
- [ ] Show approval result (15 sec)
- [ ] Quick admin dashboard (30 sec)
- [ ] Close with impact metrics (30 sec)

**Total time: 3 minutes max**

### If Tech Fails

- [ ] Show video demo
- [ ] Walk through screenshots
- [ ] Explain architecture verbally

---

## 📊 FEATURE PRIORITY MATRIX

```
┌─────────────────────────────────────────────────────────┐
│                    MUST HAVE                             │
│  (Cannot demo without these)                            │
├─────────────────────────────────────────────────────────┤
│ ✓ Image upload                                          │
│ ✓ Gemini damage analysis                               │
│ ✓ Fraud scoring                                         │
│ ✓ Instant decision                                      │
│ ✓ Result display                                        │
│ ✓ Basic admin view                                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    SHOULD HAVE                           │
│  (Make demo impressive)                                 │
├─────────────────────────────────────────────────────────┤
│ ✓ Animated processing                                   │
│ ✓ Mobile-responsive                                     │
│ ✓ Demo mode                                             │
│ ✓ Stats dashboard                                       │
│ ✓ Error handling                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    NICE TO HAVE                          │
│  (Only if time permits)                                 │
├─────────────────────────────────────────────────────────┤
│ □ WebSocket real-time updates                          │
│ □ PDF report generation                                │
│ □ Email notifications                                   │
│ □ Dark mode                                             │
│ □ Multi-language                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ DEBUGGING QUICK REFERENCE

### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check environment variables
python -c "from app.config import get_settings; print(get_settings())"
```

### Gemini API Errors
```bash
# Test API key
python -c "import google.generativeai as genai; genai.configure(api_key='YOUR_KEY'); print('✓ Valid')"

# Check rate limits
# Free tier: 15 RPM, 1500 RPD
```

### Database Connection Issues
```bash
# Test connection
python -c "from app.database import engine; import asyncio; asyncio.run(engine.connect())"

# Check Supabase status
# Visit: https://status.supabase.com
```

### Frontend Build Errors
```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build

# Check TypeScript errors
npm run type-check
```

---

**Status**: Execution plan complete ✅  
**Next**: Deploy and conquer! 🚀
