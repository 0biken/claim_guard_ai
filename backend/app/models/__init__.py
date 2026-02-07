# backend/app/models/__init__.py
from .claim import Claim, ClaimStatus, ClaimType
from .customer import Customer

__all__ = ["Claim", "ClaimStatus", "ClaimType", "Customer"]
