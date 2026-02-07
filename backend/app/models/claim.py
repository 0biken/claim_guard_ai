"""
ClaimGuard AI - Claim Model
"""
from sqlalchemy import Column, String, Integer, DateTime, JSON, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from ..database import Base


class ClaimStatus(str, enum.Enum):
    """Claim processing status."""
    PENDING = "pending"
    APPROVED = "approved"
    UNDER_REVIEW = "under_review"
    REJECTED = "rejected"


class ClaimType(str, enum.Enum):
    """Type of insurance claim."""
    MOTOR = "motor"
    PROPERTY = "property"
    HEALTH = "health"


class Claim(Base):
    """Insurance claim model."""
    __tablename__ = "claims"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"))
    
    # Claim details
    policy_number = Column(String(50), nullable=False, index=True)
    claim_type = Column(Enum(ClaimType), nullable=False)
    incident_date = Column(DateTime, nullable=False)
    incident_description = Column(Text, nullable=False)
    
    # Images (list of Supabase URLs)
    images = Column(JSON, default=list)
    
    # AI Analysis results
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
