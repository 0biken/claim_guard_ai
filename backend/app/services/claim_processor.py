"""
ClaimGuard AI - Claim Processing Pipeline
Orchestrates the complete AI analysis workflow
"""
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from ..database import async_session
from ..models.claim import Claim, ClaimStatus
from ..models.customer import Customer
from .damage_assessment import DamageAssessor
from .fraud_detection import FraudDetector
from .decision_engine import ClaimDecisionEngine
from ..utils.storage import download_from_supabase


async def process_claim(claim_id: str):
    """
    Process a claim through the complete AI pipeline.
    
    1. Analyze damage with Gemini Vision
    2. Run fraud detection checks
    3. Make automated decision
    4. Update claim record
    
    This runs as a background task after claim submission.
    """
    
    async with async_session() as db:
        try:
            # Get claim
            result = await db.execute(
                select(Claim).where(Claim.id == uuid.UUID(claim_id))
            )
            claim = result.scalar_one_or_none()
            
            if not claim:
                print(f"❌ Claim {claim_id} not found")
                return
            
            # Get customer for policy info
            customer_result = await db.execute(
                select(Customer).where(Customer.id == claim.customer_id)
            )
            customer = customer_result.scalar_one_or_none()
            
            if not customer:
                print(f"❌ Customer not found for claim {claim_id}")
                return
            
            print(f"🔄 Processing claim {claim_id}...")
            
            # Download first image for analysis
            if claim.images and len(claim.images) > 0:
                image_bytes = await download_from_supabase(claim.images[0])
            else:
                print(f"❌ No images for claim {claim_id}")
                return
            
            # 1. Damage Assessment with Gemini
            print("🔍 Analyzing damage with Gemini...")
            assessor = DamageAssessor()
            damage_result = await assessor.analyze_damage(
                image_bytes,
                claim.claim_type.value
            )
            
            claim.damage_assessment = damage_result
            claim.estimated_amount = damage_result.get("estimated_cost_ngn", 0)
            
            # 2. Fraud Detection
            print("🕵️ Running fraud checks...")
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
            
            # 3. Decision Engine
            print("⚖️ Making decision...")
            engine = ClaimDecisionEngine()
            decision = engine.make_decision(
                damage_result,
                fraud_result,
                customer.policy_limit
            )
            
            # Update claim with decision
            claim.status = ClaimStatus(decision["decision"])
            claim.approved_amount = decision.get("approved_amount")
            claim.decision_reason = decision["reason"]
            claim.decision_timestamp = datetime.utcnow()
            
            await db.commit()
            
            print(f"✅ Claim {claim_id} processed: {decision['decision']}")
            print(f"   Fraud Score: {fraud_result['fraud_score']}")
            print(f"   Estimated: ₦{claim.estimated_amount:,}")
            if claim.approved_amount:
                print(f"   Approved: ₦{claim.approved_amount:,}")
                
        except Exception as e:
            print(f"❌ Error processing claim {claim_id}: {str(e)}")
            # Update claim status to indicate error
            try:
                claim.status = ClaimStatus.UNDER_REVIEW
                claim.decision_reason = f"Processing error: {str(e)}"
                await db.commit()
            except Exception:
                pass
