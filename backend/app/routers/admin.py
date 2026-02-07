"""
ClaimGuard AI - Admin Router
Dashboard endpoints for admin users
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from typing import Optional

from ..database import get_db
from ..schemas import ClaimListItem, AdminStats
from ..models.claim import Claim, ClaimStatus

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/claims")
async def get_claims(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of claims for admin dashboard.
    
    Supports filtering by status and pagination.
    """
    
    query = select(Claim).order_by(Claim.created_at.desc())
    
    if status:
        query = query.where(Claim.status == ClaimStatus(status))
    
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    claims = result.scalars().all()
    
    # Get total count
    count_query = select(func.count(Claim.id))
    if status:
        count_query = count_query.where(Claim.status == ClaimStatus(status))
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0
    
    return {
        "claims": [
            ClaimListItem(
                claim_id=str(c.id),
                policy_number=c.policy_number,
                claim_type=c.claim_type.value,
                status=c.status.value,
                estimated_amount=c.estimated_amount or 0,
                fraud_score=c.fraud_score or 0,
                created_at=c.created_at
            )
            for c in claims
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/analytics", response_model=AdminStats)
async def get_analytics(
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard analytics and statistics.
    """
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Claims today
    claims_today_result = await db.execute(
        select(func.count(Claim.id)).where(Claim.created_at >= today)
    )
    claims_today = claims_today_result.scalar() or 0
    
    # Average processing time (for decided claims today)
    decided_claims = await db.execute(
        select(Claim).where(
            Claim.created_at >= today,
            Claim.decision_timestamp.isnot(None)
        )
    )
    decided = decided_claims.scalars().all()
    
    if decided:
        total_seconds = sum(
            (c.decision_timestamp - c.created_at).total_seconds()
            for c in decided
        )
        avg_time = total_seconds / len(decided)
    else:
        avg_time = 0.0
    
    # Fraud detected count
    fraud_result = await db.execute(
        select(func.count(Claim.id)).where(
            Claim.created_at >= today,
            Claim.fraud_score > 70
        )
    )
    fraud_count = fraud_result.scalar() or 0
    
    # Approval rate
    approved_result = await db.execute(
        select(func.count(Claim.id)).where(
            Claim.created_at >= today,
            Claim.status == ClaimStatus.APPROVED
        )
    )
    approved_count = approved_result.scalar() or 0
    
    approval_rate = (approved_count / claims_today * 100) if claims_today > 0 else 0.0
    
    return AdminStats(
        claims_today=claims_today,
        avg_processing_time_seconds=avg_time,
        fraud_detected_count=fraud_count,
        approval_rate=approval_rate
    )
