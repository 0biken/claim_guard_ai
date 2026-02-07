"""
ClaimGuard AI - Customer Model
"""
from sqlalchemy import Column, String, DateTime, Integer, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Customer(Base):
    """Insurance customer/policyholder model."""
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Customer info
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Policy information
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
