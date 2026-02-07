"""
ClaimGuard AI - Claims Router
API endpoints for claim submission and status
"""
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from ..database import get_db
from ..schemas import ClaimResponse, ClaimStatusEnum
from ..models.claim import Claim, ClaimType, ClaimStatus
from ..models.customer import Customer
from ..services.claim_processor import process_claim
from ..utils.storage import upload_image_to_supabase

router = APIRouter(prefix="/api/v1/claims", tags=["claims"])


@router.post("/submit")
async def submit_claim(
    background_tasks: BackgroundTasks,
    policy_number: str = Form(...),
    claim_type: str = Form(...),
    incident_date: str = Form(...),
    description: str = Form(...),
    images: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a new insurance claim with damage photos.
    
    - Validates policy number exists
    - Uploads images to Supabase storage
    - Creates claim record
    - Triggers AI processing in background
    """
    
    # Validate images count
    if len(images) < 1 or len(images) > 4:
        raise HTTPException(status_code=400, detail="Upload 1-4 images")
    
    # Get customer by policy number
    result = await db.execute(
        select(Customer).where(Customer.policy_number == policy_number)
    )
    customer = result.scalar_one_or_none()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Upload images to Supabase Storage
    image_urls = []
    for image in images:
        image_bytes = await image.read()
        url = await upload_image_to_supabase(image_bytes, image.filename or "image.jpg")
        image_urls.append(url)
    
    # Parse incident date
    from datetime import datetime
    try:
        incident_dt = datetime.fromisoformat(incident_date.replace('Z', '+00:00'))
    except ValueError:
        incident_dt = datetime.strptime(incident_date, "%Y-%m-%d")
    
    # Create claim record
    claim = Claim(
        customer_id=customer.id,
        policy_number=policy_number,
        claim_type=ClaimType(claim_type),
        incident_date=incident_dt,
        incident_description=description,
        images=image_urls,
        status=ClaimStatus.PENDING
    )
    
    db.add(claim)
    await db.commit()
    await db.refresh(claim)
    
    # Process claim in background (AI analysis)
    background_tasks.add_task(process_claim, str(claim.id))
    
    return {
        "claim_id": str(claim.id),
        "status": "processing",
        "message": "Claim submitted successfully. Processing..."
    }


@router.get("/{claim_id}/status", response_model=ClaimResponse)
async def get_claim_status(
    claim_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get real-time claim processing status.
    
    Frontend polls this endpoint every 2 seconds during processing.
    """
    
    try:
        claim_uuid = uuid.UUID(claim_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid claim ID format")
    
    result = await db.execute(
        select(Claim).where(Claim.id == claim_uuid)
    )
    claim = result.scalar_one_or_none()
    
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    # Determine next steps based on status
    next_steps = None
    if claim.status == ClaimStatus.APPROVED:
        next_steps = "Payment will be processed within 24 hours"
    elif claim.status == ClaimStatus.UNDER_REVIEW:
        next_steps = "Our team will review within 4 hours"
    elif claim.status == ClaimStatus.REJECTED:
        next_steps = "Contact our fraud investigation team"
    
    return ClaimResponse(
        claim_id=str(claim.id),
        status=ClaimStatusEnum(claim.status.value),
        damage_assessment=claim.damage_assessment,
        fraud_score=claim.fraud_score or 0,
        decision=claim.status.value if claim.decision_timestamp else None,
        approved_amount=claim.approved_amount,
        reason=claim.decision_reason,
        flags=claim.fraud_flags or [],
        next_steps=next_steps
    )
