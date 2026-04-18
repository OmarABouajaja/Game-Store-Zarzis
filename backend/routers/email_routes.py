"""
Email Routes for Game Store Zarzis API
Provides endpoints for sending emails via MailerSend
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
from services.supabase_client import get_supabase
from email_service import (
    send_booking_confirmation,
    send_contact_form_notification,
    send_service_request_notification,
    send_session_receipt,
    send_staff_invitation,
    send_password_reset_email,
)

# Initialize Supabase client
supabase = get_supabase()

router = APIRouter(prefix="/email", tags=["Email"])


class BookingConfirmationRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    console_type: str
    session_type: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None


class ContactFormRequest(BaseModel):
    from_name: str
    from_email: EmailStr
    subject: str
    message: str


class ServiceRequestNotification(BaseModel):
    client_name: str
    client_phone: str
    device_type: str
    device_brand: str
    issue_description: str
    request_id: str
    status: Optional[str] = "pending"


class SessionReceiptRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    console_type: str
    duration: str
    total_amount: float
    points_earned: int
    date: str


@router.post("/booking-confirmation")
async def api_send_booking_confirmation(request: BookingConfirmationRequest):
    """Send booking confirmation email to client"""
    success = send_booking_confirmation(
        client_name=request.client_name,
        client_email=request.client_email,
        console_type=request.console_type,
        session_type=request.session_type,
        preferred_date=request.preferred_date,
        preferred_time=request.preferred_time,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"success": True, "message": "Booking confirmation sent"}


@router.post("/contact-form")
async def api_send_contact_form(request: ContactFormRequest):
    """Send contact form to store owner"""
    success = send_contact_form_notification(
        from_name=request.from_name,
        from_email=request.from_email,
        subject=request.subject,
        message=request.message,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"success": True, "message": "Contact form sent"}


@router.post("/service-request")
async def api_send_service_request(request: ServiceRequestNotification):
    """Send service request notification to store"""
    success = send_service_request_notification(
        client_name=request.client_name,
        client_phone=request.client_phone,
        device_type=request.device_type,
        device_brand=request.device_brand,
        issue_description=request.issue_description,
        request_id=request.request_id,
        status=request.status or "pending",
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"success": True, "message": "Service request notification sent"}


@router.post("/session-receipt")
async def api_send_session_receipt(request: SessionReceiptRequest):
    """Send session receipt to client"""
    success = send_session_receipt(
        client_name=request.client_name,
        client_email=request.client_email,
        console_type=request.console_type,
        duration=request.duration,
        total_amount=request.total_amount,
        points_earned=request.points_earned,
        date=request.date,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"success": True, "message": "Session receipt sent"}


class StaffInvitationRequest(BaseModel):
    email: EmailStr
    role: str
    password: str


@router.post("/staff-invitation")
async def api_send_staff_invitation(request: StaffInvitationRequest):
    """Send staff invitation email"""
    success = send_staff_invitation(
        email=request.email,
        role=request.role,
        password=request.password,
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send email")
    
    return {"success": True, "message": "Staff invitation sent"}


class StaffPasswordResetRequest(BaseModel):
    email: EmailStr
    lang: Optional[str] = "fr"


@router.post("/staff-password-reset")
async def api_staff_password_reset(request: StaffPasswordResetRequest):
    """
    Send custom password reset email with beautiful Resend template.
    Generates a Supabase magic link and sends it via our email service.
    """
    try:
        # Generate password reset link through Supabase
        from supabase import create_client
        from dotenv import load_dotenv
        load_dotenv()
        
        SUPABASE_URL = os.getenv("SUPABASE_URL", "")
        SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        
        if not SUPABASE_SERVICE_KEY:
            # Fallback: Use regular auth resetPasswordForEmail
            # This will send Supabase's default email, but better than nothing
            raise HTTPException(
                status_code=500,
                detail="Service role key not configured. Please use Supabase default reset."
            )
        
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Use FRONTEND_URL env var with production fallback
        frontend_url = os.getenv("FRONTEND_URL", "https://www.gamestorezarzis.com.tn")
        reset_redirect = f"{frontend_url}/reset-password"
        
        # Use Supabase to generate recovery link
        response = supabase_admin.auth.generate_link({
            "type": "recovery",
            "email": request.email,
            "options": {
                "redirect_to": reset_redirect
            }
        })
        
        if not response or not hasattr(response, 'properties') or not response.properties.get('action_link'):
            raise HTTPException(status_code=400, detail="Failed to generate reset link")
        
        recovery_url = response.properties['action_link']
        
        # Send beautiful custom email using Resend
        success = send_password_reset_email(
            to_email=request.email,
            recovery_url=recovery_url,
            lang=request.lang or "fr"
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send email")
        
        return {
            "success": True,
            "message": "Password reset email sent with custom template"
        }
        
    except Exception as e:
        print(f"Password reset error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

