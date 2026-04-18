from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from email_service import (
    send_booking_confirmation,
    send_contact_form_notification,
    send_service_request_notification,
    send_session_receipt,
    send_otp_email,
    send_otp_email_alternative,
    send_staff_invitation,
    send_notification_email
)
import os

router = APIRouter(prefix="/api/email", tags=["Email"])

# Request Models
class OTPRequest(BaseModel):
    email: EmailStr
    otp: str
    is_sms_alternative: bool = False

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
    status: str = "pending"

class SessionReceiptRequest(BaseModel):
    client_name: str
    client_email: EmailStr
    console_type: str
    duration: str
    total_amount: float
    points_earned: int
    date: str

class StaffInvitationRequest(BaseModel):
    email: EmailStr
    role: str
    password: str

class NotificationRequest(BaseModel):
    to_email: EmailStr
    subject: str
    message: str
    title: Optional[str] = "Notification"

# Endpoints

from utils.limiter import limiter
from fastapi import APIRouter, HTTPException, Depends, Request

# ... (imports)

@router.post("/otp")
@limiter.limit("5/minute")
@router.post("/otp")
@limiter.limit("5/minute")
def send_otp(request: Request, body: OTPRequest):
    """Send OTP verification code"""
    if body.is_sms_alternative:
        success = send_otp_email_alternative(body.email, body.otp)
    else:
        success = send_otp_email(body.email, body.otp)
        
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send OTP email")
    return {"status": "success", "message": "OTP sent successfully"}

@router.post("/booking")
@router.post("/booking")
def send_booking(request: BookingConfirmationRequest):
    """Send booking confirmation"""
    success = send_booking_confirmation(
        client_name=request.client_name,
        client_email=request.client_email,
        console_type=request.console_type,
        session_type=request.session_type,
        preferred_date=request.preferred_date,
        preferred_time=request.preferred_time
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send booking confirmation")
    return {"status": "success", "message": "Booking confirmation sent"}

@router.post("/contact")
@router.post("/contact")
def send_contact(request: ContactFormRequest):
    """Send contact form message"""
    success = send_contact_form_notification(
        from_name=request.from_name,
        from_email=request.from_email,
        subject=request.subject,
        message=request.message
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send contact message")
    return {"status": "success", "message": "Message sent"}

@router.post("/service-update")
@router.post("/service-update")
def send_service_update(request: ServiceRequestNotification):
    """Send service request update"""
    success = send_service_request_notification(
        client_name=request.client_name,
        client_phone=request.client_phone,
        device_type=request.device_type,
        device_brand=request.device_brand,
        issue_description=request.issue_description,
        request_id=request.request_id,
        status=request.status
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send service update")
    return {"status": "success", "message": "Service update sent"}

@router.post("/receipt")
@router.post("/receipt")
def send_receipt(request: SessionReceiptRequest):
    """Send session receipt"""
    success = send_session_receipt(
        client_name=request.client_name,
        client_email=request.client_email,
        console_type=request.console_type,
        duration=request.duration,
        total_amount=request.total_amount,
        points_earned=request.points_earned,
        date=request.date
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send receipt")
    return {"status": "success", "message": "Receipt sent"}

@router.post("/staff-invite")
@router.post("/staff-invite")
def invite_staff(request: StaffInvitationRequest):
    """Send staff invitation"""
    success = send_staff_invitation(
        email=request.email,
        role=request.role,
        password=request.password
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send invitation")
    return {"status": "success", "message": "Invitation sent"}

@router.post("/notification")
@router.post("/notification")
def send_general_notification(request: NotificationRequest):
    """Send generic notification"""
    success = send_notification_email(
        to_email=request.to_email,
        subject=request.subject,
        message=request.message,
        title=request.title
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send notification")
    return {"status": "success", "message": "Notification sent"}
