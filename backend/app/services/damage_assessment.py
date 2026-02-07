"""
ClaimGuard AI - Gemini Damage Assessment Service
Uses Gemini 2.0 Flash for vision-based damage analysis
"""
import google.generativeai as genai
from PIL import Image
import io
import json
from typing import Dict, Any
from ..config import get_settings

settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


class DamageAssessor:
    """AI-powered damage assessment using Gemini Vision."""
    
    def __init__(self):
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
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
            
            # Get appropriate prompt
            prompt = self._get_prompt(claim_type)
            
            # Generate analysis
            response = self.model.generate_content([prompt, image])
            
            # Parse JSON response
            result = self._parse_response(response.text)
            
            return result
            
        except Exception as e:
            # Fallback response on error
            return {
                "damage_type": "Unable to determine",
                "severity": "moderate",
                "estimated_cost_ngn": 200000,
                "damaged_items": [],
                "confidence": 0.3,
                "reasoning": f"Error during analysis: {str(e)}",
                "error": True
            }
    
    def _get_prompt(self, claim_type: str) -> str:
        """Return optimized prompt for claim type."""
        
        base_instructions = """
You are an expert insurance claims assessor in Nigeria. 
Analyze this image and provide a detailed damage assessment.

CRITICAL: Respond ONLY with valid JSON. No markdown, no explanation outside JSON.
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
            # Fallback parsing
            return {
                "damage_type": "Unable to determine",
                "severity": "moderate",
                "estimated_cost_ngn": 200000,
                "damaged_items": [],
                "confidence": 0.5,
                "reasoning": f"Error parsing response: {str(e)}",
                "raw_response": text[:500]
            }
