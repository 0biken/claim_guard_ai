"""
ClaimGuard AI - Decision Engine
Automated claim approval/rejection based on AI analysis
"""
from typing import Dict, Any


class ClaimDecisionEngine:
    """Make instant claim decisions based on damage and fraud analysis."""
    
    def make_decision(
        self,
        damage_assessment: Dict[str, Any],
        fraud_analysis: Dict[str, Any],
        policy_limit: int
    ) -> Dict[str, Any]:
        """
        Make instant claim decision.
        
        Args:
            damage_assessment: Result from Gemini analysis
            fraud_analysis: Result from fraud detection
            policy_limit: Maximum payout for policy (in Naira)
            
        Returns:
            {
                "decision": "approved" | "under_review" | "rejected",
                "approved_amount": int | None,
                "reason": str,
                "next_steps": str
            }
        """
        
        estimated_cost = damage_assessment.get("estimated_cost_ngn", 0)
        fraud_score = fraud_analysis.get("fraud_score", 0)
        risk_level = fraud_analysis.get("risk_level", "low")
        flags = fraud_analysis.get("flags", [])
        
        # Rule 1: High fraud risk → Reject
        if fraud_score > 70:
            return {
                "decision": "rejected",
                "approved_amount": None,
                "reason": "High fraud indicators detected",
                "flags": flags,
                "next_steps": "Please contact our fraud investigation team at fraud@claimguard.ai"
            }
        
        # Rule 2: Medium fraud risk → Review
        if fraud_score > 30:
            return {
                "decision": "under_review",
                "approved_amount": None,
                "estimated_amount": estimated_cost,
                "reason": "Additional verification required",
                "flags": flags,
                "next_steps": "Our team will review your claim within 4 hours"
            }
        
        # Rule 3: Cost exceeds policy limit → Review
        if estimated_cost > policy_limit:
            return {
                "decision": "under_review",
                "approved_amount": None,
                "estimated_amount": estimated_cost,
                "reason": f"Claim exceeds policy limit (₦{policy_limit:,})",
                "next_steps": "Manual assessment required for high-value claims"
            }
        
        # Rule 4: Low confidence from AI → Review
        confidence = damage_assessment.get("confidence", 1.0)
        if confidence < 0.6:
            return {
                "decision": "under_review",
                "approved_amount": None,
                "estimated_amount": estimated_cost,
                "reason": "Image quality requires manual review",
                "next_steps": "Our team will review within 2 hours"
            }
        
        # Rule 5: Low risk + within limit → Approve
        return {
            "decision": "approved",
            "approved_amount": estimated_cost,
            "reason": "Claim meets all approval criteria",
            "payment_timeline": "Within 24 hours",
            "next_steps": "You'll receive an SMS when payment is processed"
        }
