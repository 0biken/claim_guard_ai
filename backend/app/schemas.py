"""
ClaimGuard AI - Pydantic Schemas
Request/Response models for API endpoints
"""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List
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
    """Request model for claim submission."""
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
    """AI damage assessment result."""
    damage_type: str
    severity: str
    estimated_cost_ngn: int
    damaged_items: List[str]
    confidence: float
    reasoning: str


class ClaimResponse(BaseModel):
    """Response model for claim status."""
    claim_id: str
    status: ClaimStatusEnum
    damage_assessment: Optional[DamageAssessment] = None
    fraud_score: int = 0
    decision: Optional[str] = None
    approved_amount: Optional[int] = None
    reason: Optional[str] = None
    flags: List[str] = []
    next_steps: Optional[str] = None
    
    class Config:
        from_attributes = True


class ClaimListItem(BaseModel):
    """Claim item for admin list."""
    claim_id: str
    policy_number: str
    claim_type: str
    status: str
    estimated_amount: int
    fraud_score: int
    created_at: datetime


class AdminStats(BaseModel):
    """Admin dashboard statistics."""
    claims_today: int
    avg_processing_time_seconds: float
    fraud_detected_count: int
    approval_rate: float
