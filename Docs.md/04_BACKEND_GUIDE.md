
```python
# app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App
    APP_NAME: str = "ClaimGuard AI"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str
    
    # Gemini
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash-exp"
    
    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_BUCKET: str = "claim-images"
    
    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
```

---

## 🗄️ DATABASE MODELS

```python
# app/models/claim.py
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base

class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    UNDER_REVIEW = "under_review"
    REJECTED = "rejected"

class ClaimType(str, enum.Enum):
    MOTOR = "motor"
    PROPERTY = "property"
    HEALTH = "health"

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    
    # Claim details
    policy_number = Column(String(50), nullable=False, index=True)
    claim_type = Column(Enum(ClaimType), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    incident_description = Column(Text, nullable=False)
    
    # Images
    images = Column(JSON, default=list)  # List of Supabase URLs
    
    # AI Analysis
    damage_assessment = Column(JSON, nullable=True)
    fraud_score = Column(Integer, default=0)
    fraud_flags = Column(JSON, default=list)
    
    # Decision
    status = Column(Enum(ClaimStatus), default=ClaimStatus.PENDING)
    estimated_amount = Column(Integer, default=0)
    approved_amount = Column(Integer, nullable=True)
    decision_reason = Column(Text, nullable=True)
    decision_timestamp = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="claims")
```

```python
# app/models/customer.py
from sqlalchemy import Column, String, DateTime, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Policy info
    policy_number = Column(String(50), unique=True, nullable=False)
    policy_type = Column(String(50), nullable=False)
    policy_start_date = Column(Date, nullable=False)
    policy_end_date = Column(Date, nullable=False)
    policy_limit = Column(Integer, default=2000000)  # ₦2M default
    
    # History
    claim_history_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    claims = relationship("Claim", back_populates="customer")
```

---

## 🔌 DATABASE CONNECTION

```python
# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

# Create async session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Dependency for routes
async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

---

## 📋 PYDANTIC SCHEMAS

```python
# app/schemas/claim.py
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum

class ClaimTypeEnum(str, Enum):
    MOTOR = "motor"
    PROPERTY = "property"
    HEALTH = "health"

class ClaimStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    UNDER_REVIEW = "under_review"
    REJECTED = "rejected"

class ClaimSubmitRequest(BaseModel):
    policy_number: str = Field(..., min_length=5, max_length=50)
    claim_type: ClaimTypeEnum
    incident_date: datetime
    description: str = Field(..., min_length=20, max_length=500)
    
    @field_validator("incident_date")
    @classmethod
    def validate_incident_date(cls, v: datetime) -> datetime:
        if v > datetime.utcnow():
            raise ValueError("Incident date cannot be in the future")
        
        days_ago = (datetime.utcnow() - v).days
        if days_ago > 30:
            raise ValueError("Incident must be within last 30 days")
        
        return v

class DamageAssessment(BaseModel):
    damage_type: str
    severity: str
    estimated_cost_ngn: int
    damaged_items: list[str]
    confidence: float
    reasoning: str

class ClaimResponse(BaseModel):
    claim_id: str
    status: ClaimStatusEnum
    damage_assessment: Optional[DamageAssessment] = None
    fraud_score: int
    decision: Optional[str] = None
    approved_amount: Optional[int] = None
    reason: Optional[str] = None
    flags: list[str] = []
    next_steps: Optional[str] = None
    
    class Config:
        from_attributes = True
```

---

## 🛣️ API ROUTES

```python
# app/routers/claims.py
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from ..database import get_db
from ..schemas.claim import ClaimSubmitRequest, ClaimResponse
from ..models.claim import Claim, ClaimType, ClaimStatus
from ..models.customer import Customer
from ..services.damage_assessment import DamageAssessor
from ..services.fraud_detection import FraudDetector
from ..services.decision_engine import ClaimDecisionEngine
from ..utils.storage import upload_image_to_supabase

router = APIRouter(prefix="/api/v1/claims", tags=["claims"])

@router.post("/submit")
async def submit_claim(
    policy_number: str = Form(...),
    claim_type: str = Form(...),
    incident_date: str = Form(...),
    description: str = Form(...),
    images: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a new insurance claim with images.
    """
    
    # Validate images
    if len(images) < 2 or len(images) > 4:
        raise HTTPException(status_code=400, detail="Upload 2-4 images")
    
    # Get customer
    customer = await db.execute(
        select(Customer).where(Customer.policy_number == policy_number)
    )
    customer = customer.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Upload images to Supabase
    image_urls = []
    for image in images:
        image_bytes = await image.read()
        url = await upload_image_to_supabase(image_bytes, image.filename)
        image_urls.append(url)
    
    # Create claim record
    claim = Claim(
        customer_id=customer.id,
        policy_number=policy_number,
        claim_type=ClaimType(claim_type),
        incident_date=incident_date,
        incident_description=description,
        images=image_urls,
        status=ClaimStatus.PENDING
    )
    
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    
    # Trigger async processing (in background)
    # For hackathon, we'll do it synchronously
    await process_claim(claim.id, db)
    
    return {"claim_id": str(claim.id), "status": "processing"}

@router.get("/{claim_id}/status", response_model=ClaimResponse)
async def get_claim_status(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get real-time claim processing status.
    """
    
    claim = await db.get(Claim, uuid.UUID(claim_id))
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    return ClaimResponse(
        claim_id=str(claim.id),
        status=claim.status,
        damage_assessment=claim.damage_assessment,
        fraud_score=claim.fraud_score,
        decision=claim.status.value if claim.decision_timestamp else None,
        approved_amount=claim.approved_amount,
        reason=claim.decision_reason,
        flags=claim.fraud_flags or [],
        next_steps="Payment within 24h" if claim.status == ClaimStatus.APPROVED else None
    )

async def process_claim(claim_id: uuid.UUID, db: AsyncSession):
    """
    Internal: Process claim through AI pipeline.
    """
    
    claim = await db.get(Claim, claim_id)
    customer = await db.get(Customer, claim.customer_id)
    
    # Download first image
    image_bytes = await download_from_supabase(claim.images[0])
    
    # 1. Damage Assessment
    assessor = DamageAssessor()
    damage_result = await assessor.analyze_damage(
        image_bytes,
        claim.claim_type.value
    )
    
    claim.damage_assessment = damage_result
    claim.estimated_amount = damage_result.get("estimated_cost_ngn", 0)
    
    # 2. Fraud Detection
    detector = FraudDetector()
    fraud_result = await detector.calculate_fraud_score(
        db,
        image_bytes,
        {
            "incident_date": claim.incident_date.isoformat(),
            "policy_number": claim.policy_number
        },
        {
            "policy_start_date": customer.policy_start_date.isoformat(),
            "policy_end_date": customer.policy_end_date.isoformat()
        }
    )
    
    claim.fraud_score = fraud_result["fraud_score"]
    claim.fraud_flags = fraud_result["flags"]
    
    # 3. Decision
    engine = ClaimDecisionEngine()
    decision = engine.make_decision(
        damage_result,
        fraud_result,
        customer.policy_limit
    )
    
    claim.status = ClaimStatus(decision["decision"])
    claim.approved_amount = decision.get("approved_amount")
    claim.decision_reason = decision["reason"]
    claim.decision_timestamp = datetime.utcnow()
    
    await db.commit()
```

---

## 🛡️ STORAGE UTILITY

```python
# app/utils/storage.py
from supabase import create_client, Client
from ..config import get_settings
import uuid

settings = get_settings()
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def upload_image_to_supabase(image_bytes: bytes, filename: str) -> str:
    """Upload image to Supabase Storage and return public URL."""
    
    # Generate unique filename
    ext = filename.split('.')[-1]
    unique_name = f"{uuid.uuid4()}.{ext}"
    
    # Upload
    supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
        unique_name,
        image_bytes,
        {"content-type": f"image/{ext}"}
    )
    
    # Get public URL
    url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(unique_name)
    return url

async def download_from_supabase(url: str) -> bytes:
    """Download image from Supabase."""
    
    import httpx
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.content
```

---

## 🚀 MAIN APP

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .routers import claims, admin

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered insurance claims platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(claims.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {
        "message": "ClaimGuard AI System Operational",
        "status": "active",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "gemini": "ready",
            "storage": "ready"
        }
    }
```

---

## ✅ CHECKLIST

- [ ] Install dependencies
- [ ] Setup environment variables
- [ ] Create database models
- [ ] Setup Supabase storage
- [ ] Create API routes
- [ ] Integrate Gemini service
- [ ] Integrate fraud detection
- [ ] Test endpoints with Swagger
- [ ] Add error handling
- [ ] Add logging

**Status**: Backend guide complete ✅
