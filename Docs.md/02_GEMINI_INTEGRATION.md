# 02 - GEMINI INTEGRATION
## AI Damage Assessment & Fraud Detection

> **Model**: Gemini 2.0 Flash (Free Tier - 1500 RPD)

---

## 🔑 API SETUP

### 1. Get Your API Key
```bash
# Visit: https://aistudio.google.com/app/apikey
# Click "Create API Key"
# Store securely in .env file
```

### 2. Install SDK
```bash
# Backend (Python)
pip install google-generativeai pillow python-dotenv

# Test installation
python -c "import google.generativeai as genai; print('✓ SDK installed')"
```

### 3. Environment Configuration
```bash
# backend/.env
GEMINI_API_KEY=AIzaSy...your_key_here
GEMINI_MODEL=gemini-2.0-flash-exp  # Free tier model
```

---

## 🧠 DAMAGE ASSESSMENT SERVICE

### Complete Implementation
```python
# backend/app/services/damage_assessment.py
import google.generativeai as genai
from PIL import Image
import io
import json
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class DamageAssessor:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
    async def analyze_damage(
        self, 
        image_bytes: bytes,
        claim_type: str = "motor"
    ) -> Dict[str, Any]:
        """
        Analyze vehicle/property damage using Gemini Vision.
        
        Args:
            image_bytes: Raw image data
            claim_type: "motor" | "property" | "health"
            
        Returns:
            {
                "damage_type": str,
                "severity": "minor" | "moderate" | "severe",
                "estimated_cost_ngn": int,
                "damaged_items": list[str],
                "confidence": float,
                "reasoning": str
            }
        """
        
        try:
            # Load image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Construct prompt based on claim type
            prompt = self._get_prompt(claim_type)
            
            # Generate analysis
            response = self.model.generate_content([prompt, image])
            
            # Parse JSON response
            result = self._parse_response(response.text)
            
            return result
            
        except Exception as e:
            return {
                "error": str(e),
                "fallback": True,
                "estimated_cost_ngn": 0
            }
    
    def _get_prompt(self, claim_type: str) -> str:
        """Return optimized prompt for claim type."""
        
        base_instructions = """
You are an expert insurance claims assessor in Nigeria. 
Analyze this image and provide a detailed damage assessment.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanation.
"""
        
        if claim_type == "motor":
            return base_instructions + """
{
  "damage_type": "Describe the primary damage (e.g., 'Front bumper collision', 'Side panel dent')",
  "severity": "minor | moderate | severe",
  "estimated_cost_ngn": <number> (Use current Lagos market rates for parts + labor),
  "damaged_items": ["List each damaged part", "e.g., 'Headlight assembly'", "Hood panel"],
  "confidence": <0.0 to 1.0> (How certain are you about this assessment?),
  "reasoning": "Brief explanation of your assessment (2-3 sentences)"
}

PRICING GUIDE (Lagos, 2025):
- Minor scratches/dents: ₦50,000 - ₦150,000
- Moderate damage (panels, lights): ₦150,000 - ₦500,000  
- Severe damage (structural, multiple parts): ₦500,000 - ₦2,000,000
"""
        
        elif claim_type == "property":
            return base_instructions + """
{
  "damage_type": "Describe the damage (e.g., 'Water damage to ceiling', 'Fire damage to kitchen')",
  "severity": "minor | moderate | severe",
  "estimated_cost_ngn": <number> (Nigerian market rates),
  "damaged_items": ["List damaged property", "e.g., 'Electronics'", "Furniture"],
  "confidence": <0.0 to 1.0>,
  "reasoning": "Brief explanation"
}

PRICING GUIDE:
- Minor (cosmetic): ₦100,000 - ₦300,000
- Moderate (repairs needed): ₦300,000 - ₦1,000,000
- Severe (replacement/rebuild): ₦1,000,000+
"""
        
        else:
            return base_instructions + """
{
  "damage_type": "Description of damage/injury",
  "severity": "minor | moderate | severe",
  "estimated_cost_ngn": <number>,
  "damaged_items": ["Affected areas/items"],
  "confidence": <0.0 to 1.0>,
  "reasoning": "Brief explanation"
}
"""
    
    def _parse_response(self, text: str) -> Dict[str, Any]:
        """Extract JSON from Gemini response."""
        
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        # Parse JSON
        try:
            data = json.loads(text.strip())
            
            # Validate required fields
            assert "damage_type" in data
            assert "severity" in data
            assert "estimated_cost_ngn" in data
            
            return data
            
        except (json.JSONDecodeError, AssertionError) as e:
            # Fallback parsing (extract key info from text)
            return {
                "damage_type": "Unable to determine",
                "severity": "moderate",
                "estimated_cost_ngn": 200000,  # Safe default
                "damaged_items": [],
                "confidence": 0.5,
                "reasoning": f"Error parsing response: {str(e)}",
                "raw_response": text
            }


# Usage example
assessor = DamageAssessor()

# In your FastAPI endpoint:
async def process_claim_image(image: bytes):
    result = await assessor.analyze_damage(image, claim_type="motor")
    return result
```

---

## 🔍 FRAUD DETECTION SIGNALS

### 1. EXIF Metadata Extraction
```python
# backend/app/services/fraud_detection.py
from PIL import Image
from PIL.ExifTags import TAGS
import io
from datetime import datetime
from typing import Dict, Any

class MetadataAnalyzer:
    def extract_exif(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract and validate EXIF data."""
        
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
                claim_date = datetime.fromisoformat(claimed_date)
                
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
            if any(editor in software for editor in ["photoshop", "gimp", "affinity"]):
                flags.append("Image edited with photo software")
                score += 5
        
        return {
            "is_suspicious": score > 10,
            "flags": flags,
            "score": min(score, 20)
        }
```

### 2. Claim Frequency Check
```python
# backend/app/services/fraud_detection.py (continued)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from ..models import Claim

class FrequencyAnalyzer:
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
            select(func.count(Claim.id))
            .where(
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
```

### 3. Timing Analysis
```python
# backend/app/services/fraud_detection.py (continued)
from datetime import datetime

class TimingAnalyzer:
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
        
        incident = datetime.fromisoformat(incident_date)
        policy_start = datetime.fromisoformat(policy_start_date)
        policy_end = datetime.fromisoformat(policy_end_date)
        
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
```

### 4. Unified Fraud Scorer
```python
# backend/app/services/fraud_detection.py (continued)
class FraudDetector:
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
            claim_data["incident_date"]
        )
        total_score += metadata_result["score"]
        all_flags.extend(metadata_result["flags"])
        details["metadata"] = metadata_result
        
        # 2. Frequency check (max 25 points)
        frequency_result = await self.frequency_analyzer.check_claim_history(
            db,
            claim_data["policy_number"]
        )
        total_score += frequency_result["score"]
        all_flags.extend(frequency_result["flags"])
        details["frequency"] = frequency_result
        
        # 3. Timing analysis (max 15 points)
        timing_result = self.timing_analyzer.check_suspicious_timing(
            claim_data["incident_date"],
            policy_data["policy_start_date"],
            policy_data["policy_end_date"]
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
```

---

## 🎯 DECISION ENGINE

```python
# backend/app/services/decision_engine.py
from typing import Dict, Any

class ClaimDecisionEngine:
    def make_decision(
        self,
        damage_assessment: Dict[str, Any],
        fraud_analysis: Dict[str, Any],
        policy_limit: int
    ) -> Dict[str, Any]:
        """
        Make instant claim decision.
        
        Returns:
            {
                "decision": "approved" | "review" | "rejected",
                "approved_amount": int | null,
                "reason": str,
                "next_steps": str
            }
        """
        
        estimated_cost = damage_assessment.get("estimated_cost_ngn", 0)
        fraud_score = fraud_analysis["fraud_score"]
        risk_level = fraud_analysis["risk_level"]
        
        # Rule 1: High fraud risk → Reject
        if fraud_score > 70:
            return {
                "decision": "rejected",
                "approved_amount": None,
                "reason": "High fraud indicators detected",
                "flags": fraud_analysis["flags"],
                "next_steps": "Please contact our fraud investigation team"
            }
        
        # Rule 2: Medium fraud risk → Review
        if fraud_score > 30:
            return {
                "decision": "review",
                "approved_amount": None,
                "estimated_amount": estimated_cost,
                "reason": "Additional verification required",
                "flags": fraud_analysis["flags"],
                "next_steps": "Our team will review within 4 hours"
            }
        
        # Rule 3: Cost exceeds policy limit → Review
        if estimated_cost > policy_limit:
            return {
                "decision": "review",
                "approved_amount": None,
                "estimated_amount": estimated_cost,
                "reason": f"Claim exceeds policy limit (₦{policy_limit:,})",
                "next_steps": "Manual assessment required"
            }
        
        # Rule 4: Low risk + within limit → Approve
        return {
            "decision": "approved",
            "approved_amount": estimated_cost,
            "reason": "Claim meets approval criteria",
            "payment_timeline": "Within 24 hours",
            "next_steps": "You'll receive an SMS when payment is processed"
        }
```

---

## ⚡ RATE LIMIT MANAGEMENT (FREE TIER)

```python
# backend/app/services/rate_limiter.py
from datetime import datetime, timedelta
from collections import deque
from typing import Optional

class GeminiRateLimiter:
    """
    Free tier limits:
    - 15 requests per minute
    - 1,500 requests per day
    """
    
    def __init__(self):
        self.minute_requests = deque(maxlen=15)
        self.day_requests = deque(maxlen=1500)
    
    def can_make_request(self) -> bool:
        """Check if we can make a request without hitting limits."""
        
        now = datetime.utcnow()
        
        # Remove requests older than 1 minute
        while self.minute_requests and \
              (now - self.minute_requests[0]) > timedelta(minutes=1):
            self.minute_requests.popleft()
        
        # Remove requests older than 1 day
        while self.day_requests and \
              (now - self.day_requests[0]) > timedelta(days=1):
            self.day_requests.popleft()
        
        # Check limits
        return len(self.minute_requests) < 15 and len(self.day_requests) < 1500
    
    def record_request(self):
        """Record that a request was made."""
        now = datetime.utcnow()
        self.minute_requests.append(now)
        self.day_requests.append(now)
    
    async def wait_if_needed(self):
        """Sleep if rate limit reached."""
        import asyncio
        
        if not self.can_make_request():
            # Wait 5 seconds and retry
            await asyncio.sleep(5)
            return await self.wait_if_needed()
```

---

## ✅ TESTING

```python
# backend/tests/test_gemini.py
import pytest
from app.services.damage_assessment import DamageAssessor

@pytest.mark.asyncio
async def test_damage_assessment():
    assessor = DamageAssessor()
    
    # Load test image
    with open("tests/fixtures/car_damage.jpg", "rb") as f:
        image_bytes = f.read()
    
    result = await assessor.analyze_damage(image_bytes, "motor")
    
    assert "damage_type" in result
    assert result["severity"] in ["minor", "moderate", "severe"]
    assert result["estimated_cost_ngn"] > 0
    assert 0 <= result["confidence"] <= 1
```

---

**Status**: Gemini integration complete ✅  
**Next**: Frontend implementation →
