"""
ClaimGuard AI - Fraud Detection Service
Multi-signal fraud analysis: metadata, frequency, timing
"""
from PIL import Image
from PIL.ExifTags import TAGS
import io
from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from ..models.claim import Claim


class MetadataAnalyzer:
    """Analyze image EXIF metadata for fraud signals."""
    
    def extract_exif(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract and validate EXIF data from image."""
        
        try:
            image = Image.open(io.BytesIO(image_bytes))
            exif_data = image._getexif() or {}
            
            metadata = {}
            for tag_id, value in exif_data.items():
                tag_name = TAGS.get(tag_id, tag_id)
                metadata[tag_name] = str(value)
            
            return {
                "has_metadata": len(metadata) > 0,
                "datetime_original": metadata.get("DateTimeOriginal"),
                "make": metadata.get("Make"),
                "model": metadata.get("Model"),
                "gps_info": metadata.get("GPSInfo"),
                "software": metadata.get("Software"),
            }
            
        except Exception as e:
            return {
                "has_metadata": False,
                "error": str(e)
            }
    
    def check_metadata_fraud(
        self,
        metadata: Dict[str, Any],
        claimed_date: str
    ) -> Dict[str, Any]:
        """
        Detect metadata-based fraud signals.
        
        Returns:
            {
                "is_suspicious": bool,
                "flags": list[str],
                "score": int (0-20)
            }
        """
        
        flags = []
        score = 0
        
        # Signal 1: No metadata (stripped)
        if not metadata.get("has_metadata"):
            flags.append("Metadata stripped or missing")
            score += 15
        
        # Signal 2: Date mismatch
        if metadata.get("datetime_original"):
            try:
                photo_date = datetime.strptime(
                    metadata["datetime_original"],
                    "%Y:%m:%d %H:%M:%S"
                )
                claim_date = datetime.fromisoformat(claimed_date.replace('Z', '+00:00'))
                
                # Allow 7 days tolerance
                diff_days = abs((photo_date - claim_date).days)
                if diff_days > 7:
                    flags.append(f"Photo taken {diff_days} days from claim date")
                    score += 10
                    
            except Exception:
                pass
        
        # Signal 3: Edited with software
        if metadata.get("software"):
            software = metadata["software"].lower()
            if any(editor in software for editor in ["photoshop", "gimp", "affinity", "lightroom"]):
                flags.append("Image edited with photo software")
                score += 5
        
        return {
            "is_suspicious": score > 10,
            "flags": flags,
            "score": min(score, 20)
        }


class FrequencyAnalyzer:
    """Check claim frequency patterns for fraud."""
    
    async def check_claim_history(
        self,
        db: AsyncSession,
        policy_number: str
    ) -> Dict[str, Any]:
        """
        Check for suspicious claim patterns.
        
        Returns:
            {
                "is_suspicious": bool,
                "flags": list[str],
                "score": int (0-25)
            }
        """
        
        # Get claims in last 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        
        result = await db.execute(
            select(func.count(Claim.id)).where(
                Claim.policy_number == policy_number,
                Claim.created_at >= ninety_days_ago
            )
        )
        
        recent_claims = result.scalar() or 0
        
        flags = []
        score = 0
        
        if recent_claims > 2:
            flags.append(f"{recent_claims} claims in last 90 days")
            score = min(25, recent_claims * 8)
        
        return {
            "is_suspicious": recent_claims > 2,
            "flags": flags,
            "score": score,
            "recent_claims_count": recent_claims
        }


class TimingAnalyzer:
    """Check claim timing relative to policy dates."""
    
    def check_suspicious_timing(
        self,
        incident_date: str,
        policy_start_date: str,
        policy_end_date: str
    ) -> Dict[str, Any]:
        """
        Flag claims near policy boundaries.
        
        Returns:
            {
                "is_suspicious": bool,
                "flags": list[str],
                "score": int (0-15)
            }
        """
        
        try:
            incident = datetime.fromisoformat(str(incident_date).replace('Z', '+00:00'))
            policy_start = datetime.fromisoformat(str(policy_start_date))
            policy_end = datetime.fromisoformat(str(policy_end_date))
        except Exception:
            return {"is_suspicious": False, "flags": [], "score": 0}
        
        flags = []
        score = 0
        
        # Check if within 7 days of policy start
        days_after_start = (incident - policy_start).days
        if 0 <= days_after_start <= 7:
            flags.append(f"Claim filed {days_after_start} days after policy start")
            score += 10
        
        # Check if within 7 days of policy end
        days_before_end = (policy_end - incident).days
        if 0 <= days_before_end <= 7:
            flags.append(f"Claim filed {days_before_end} days before policy expiry")
            score += 15
        
        return {
            "is_suspicious": score > 0,
            "flags": flags,
            "score": score
        }


class FraudDetector:
    """Unified fraud detection combining all signals."""
    
    def __init__(self):
        self.metadata_analyzer = MetadataAnalyzer()
        self.frequency_analyzer = FrequencyAnalyzer()
        self.timing_analyzer = TimingAnalyzer()
    
    async def calculate_fraud_score(
        self,
        db: AsyncSession,
        image_bytes: bytes,
        claim_data: Dict[str, Any],
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive fraud score (0-100).
        
        Returns:
            {
                "fraud_score": int,
                "risk_level": "low" | "medium" | "high",
                "flags": list[str],
                "details": dict
            }
        """
        
        total_score = 0
        all_flags = []
        details = {}
        
        # 1. Metadata analysis (max 20 points)
        metadata = self.metadata_analyzer.extract_exif(image_bytes)
        metadata_result = self.metadata_analyzer.check_metadata_fraud(
            metadata,
            str(claim_data.get("incident_date", ""))
        )
        total_score += metadata_result["score"]
        all_flags.extend(metadata_result["flags"])
        details["metadata"] = metadata_result
        
        # 2. Frequency check (max 25 points)
        frequency_result = await self.frequency_analyzer.check_claim_history(
            db,
            claim_data.get("policy_number", "")
        )
        total_score += frequency_result["score"]
        all_flags.extend(frequency_result["flags"])
        details["frequency"] = frequency_result
        
        # 3. Timing analysis (max 15 points)
        timing_result = self.timing_analyzer.check_suspicious_timing(
            str(claim_data.get("incident_date", "")),
            str(policy_data.get("policy_start_date", "")),
            str(policy_data.get("policy_end_date", ""))
        )
        total_score += timing_result["score"]
        all_flags.extend(timing_result["flags"])
        details["timing"] = timing_result
        
        # Determine risk level
        if total_score <= 30:
            risk_level = "low"
        elif total_score <= 70:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        return {
            "fraud_score": min(total_score, 100),
            "risk_level": risk_level,
            "flags": all_flags,
            "details": details
        }
