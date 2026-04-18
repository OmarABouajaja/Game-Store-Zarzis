from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
import random
import string
from services.supabase_client import get_supabase
from supabase import Client
import os
from services.sms_service import sms_service
# Need to import email sending logic, currently in email_routes but should be in a service
# I'll modify email_service.py briefly to export a simple send_otp function or use existing one

router = APIRouter(prefix="/verify", tags=["Verification"])

# Supabase setup for backend
supabase: Client = get_supabase()

class TIMEOUTS:
    OTP_EXPIRY_MINUTES = 10

class SendCodeRequest(BaseModel):
    identifier: str # Email or Phone
    type: str # 'email' or 'sms'
    lang: Optional[str] = "fr"

class VerifyCodeRequest(BaseModel):
    identifier: str
    code: str

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

from utils.limiter import limiter
from fastapi import Request

@router.post("/send")
@limiter.limit("3/minute")
def send_verification_code(request: Request, body: SendCodeRequest):
    # Map body to original logic args
    request_data = body
    code = generate_otp()
    expires_at = (datetime.utcnow() + timedelta(minutes=TIMEOUTS.OTP_EXPIRY_MINUTES)).isoformat()
    
    # Store in DB
    try:
        data = {
            "identifier": request_data.identifier,
            "code": code,
            "expires_at": expires_at,
            "is_verified": False
        }
        res = supabase.table("verification_codes").insert(data).execute()
    except Exception as e:
        # logger.error(f"Error storing OTP: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    # Check global SMS setting
    try:
        settings_res = supabase.table("store_settings").select("value").eq("key", "sms_enabled").single().execute()
        sms_enabled = settings_res.data.get("value", True) if settings_res.data else True
    except Exception:
        sms_enabled = True # Default to True if error

    effective_type = request_data.type
    if effective_type == 'sms' and not sms_enabled:
        # Fallback to email if the identifier looks like an email
        if "@" in request_data.identifier:
            effective_type = 'email'
        else:
            # If it's a phone number but SMS is disabled, let the user know via 400
            raise HTTPException(
                status_code=400, 
                detail="Le service SMS est désactivé. Veuillez utiliser votre adresse email pour la vérification."
            )

    sent = False
    if effective_type == 'sms':
        if not sms_enabled:
            raise HTTPException(status_code=400, detail="SMS verification is currently disabled. Please use email.")
        sent = sms_service.send_sms(request_data.identifier, f"Your Game Store Zarzis verification code is: {code}")

    elif effective_type == 'email':
        from email_service import send_otp_email_alternative
        sent = send_otp_email_alternative(request_data.identifier, code, lang=request_data.lang or "fr")
    
    if sent:
        return {"success": True, "message": "Verification code sent"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send verification code")

@router.post("/check")
@limiter.limit("5/minute")
def check_verification_code(request: Request, body: VerifyCodeRequest):
    request_data = body
    try:
        # Check for valid, non-expired, matching code
        res = supabase.table("verification_codes")\
            .select("*")\
            .eq("identifier", request_data.identifier)\
            .eq("code", request_data.code)\
            .eq("is_verified", False)\
            .gt("expires_at", datetime.utcnow().isoformat())\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
            
        if len(res.data) > 0:
            # Mark as verified
            otp_id = res.data[0]['id']
            supabase.table("verification_codes").update({"is_verified": True}).eq("id", otp_id).execute()
            return {"success": True, "message": "Verification successful"}
        else:
            raise HTTPException(status_code=400, detail="Invalid or expired code")
            
    except HTTPException:
        raise  # Re-raise 400 "Invalid or expired code" as-is
    except Exception as e:
        # logger.error(f"Error verifying OTP: {e}")
        raise HTTPException(status_code=500, detail="Verification failed")
