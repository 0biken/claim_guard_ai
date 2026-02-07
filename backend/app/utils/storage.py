"""
ClaimGuard AI - Supabase Storage Utilities
"""
from supabase import create_client, Client
import uuid
import httpx
from ..config import get_settings

settings = get_settings()

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


async def upload_image_to_supabase(image_bytes: bytes, filename: str) -> str:
    """
    Upload image to Supabase Storage and return public URL.
    
    Args:
        image_bytes: Raw image data
        filename: Original filename
        
    Returns:
        Public URL of uploaded image
    """
    
    # Generate unique filename
    ext = filename.split('.')[-1] if '.' in filename else 'jpg'
    unique_name = f"claims/{uuid.uuid4()}.{ext}"
    
    # Determine content type
    content_types = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'webp': 'image/webp'
    }
    content_type = content_types.get(ext.lower(), 'image/jpeg')
    
    # Upload to Supabase Storage
    supabase.storage.from_(settings.SUPABASE_BUCKET).upload(
        unique_name,
        image_bytes,
        {"content-type": content_type}
    )
    
    # Get public URL
    url = supabase.storage.from_(settings.SUPABASE_BUCKET).get_public_url(unique_name)
    return url


async def download_from_supabase(url: str) -> bytes:
    """
    Download image from Supabase URL.
    
    Args:
        url: Public Supabase storage URL
        
    Returns:
        Image bytes
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content
