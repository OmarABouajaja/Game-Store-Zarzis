"""
Resend Email Service

Simple, developer-friendly email API with excellent deliverability.
Free Tier: 3,000 emails/month
See: https://resend.com/
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import resend
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
FROM_NAME = "Game Store Zarzis"

# SMTP Configuration (Fallback)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.resend.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")

# Store email for receiving notifications
STORE_EMAIL = "game.store.zarzis@gmail.com"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://gamestorezarzis.com.tn")

# Initialize Resend with API key
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def send_email_core(subject: str, recipient_email: str, recipient_name: str, html_content: str, text_content: str) -> bool:
    """Core email sending: Tries SMTP first, then Resend API fallback"""
    logger.info(f"Sending email to {recipient_email}: {subject}")
    
    # 1. Try SMTP as primary method
    if SMTP_USER and SMTP_PASS:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
            msg["To"] = f"{recipient_name} <{recipient_email}>"
            
            part1 = MIMEText(text_content, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)
            
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(FROM_EMAIL, recipient_email, msg.as_string())
            
            logger.info(f"✅ Email sent via SMTP to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"❌ SMTP failed for {recipient_email}: {e}")
            # Fall through to Resend
    
    # 2. Try Resend API as fallback
    if RESEND_API_KEY:
        try:
            params = {
                "from": f"{FROM_NAME} <{FROM_EMAIL}>",
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
                "text": text_content
            }
            
            response = resend.Emails.send(params)
            logger.info(f"✅ Email sent via Resend to {recipient_email} (ID: {response.get('id', 'N/A')})")
            return True
        except Exception as e:
            logger.error(f"❌ Resend API failed for {recipient_email}: {e}")
            return False
    
    logger.warning(f"⚠️ No email delivery method configured for {recipient_email}")
    return False


# Translation Dictionary for Emails  
EMAIL_TRANSLATIONS = {
    "staff_invite": {
        "subject": {
            "fr": "Invitation Staff - Game Store Zarzis",
            "en": "Staff Invitation - Game Store Zarzis",
            "ar": "دعوة موظف - Game Store Zarzis"
        },
        "welcome": {
            "fr": "Bienvenue dans l'Équipe!",
            "en": "Welcome to the Team!",
            "ar": "مرحباً بك في الفريق!"
        },
        "greeting": {
            "fr": "Bonjour!",
            "en": "Hello!",
            "ar": "مرحباً!"
        },
        "invite_text": {
            "fr": "Vous avez été invité à rejoindre Game Store Zarzis en tant que",
            "en": "You have been invited to join Game Store Zarzis as",
            "ar": "لقد تمت دعوتك للانضمام إلى Game Store Zarzis بصفتك"
        },
        "credentials": {
            "fr": "Vos identifiants de connexion:",
            "en": "Your login credentials:",
            "ar": "بيانات تسجيل الدخول:"
        },
        "temp_password": {
            "fr": "Mot de passe temporaire:",
            "en": "Temporary password:",
            "ar": "كلمة المرور المؤقتة:"
        },
        "action_required": {
            "fr": "Connectez-vous et changez votre mot de passe dès que possible.",
            "en": "Log in and change your password as soon as possible.",
            "ar": "قم بتسجيل الدخول وتغيير كلمة المرور في أقرب وقت."
        },
        "button": {
            "fr": "Accéder au Dashboard",
            "en": "Access Dashboard",
            "ar": "الدخول إلى لوحة التحكم"
        },
        "roles": {
            "owner": {"fr": "Propriétaire", "en": "Owner", "ar": "مالك"},
            "worker": {"fr": "Employé", "en": "Staff", "ar": "موظف"}
        }
    },
    "otp": {
        "subject": {
            "fr": "Votre Code - Game Store Zarzis",
            "en": "Your Code - Game Store Zarzis",
            "ar": "رمزك - Game Store Zarzis"
        },
        "title": {
            "fr": "Code de Vérification",
            "en": "Verification Code",
            "ar": "رمز التحقق"
        },
        "instruction": {
            "fr": "Voici votre code pour accéder à votre compte:",
            "en": "Here is your code to access your account:",
            "ar": "إليك الرمز للوصول إلى حسابك:"
        },
        "expiry": {
            "fr": "Ce code expire dans 10 minutes.",
            "en": "This code expires in 10 minutes.",
            "ar": "تنتهي صلاحية هذا الرمز خلال 10 دقائق."
        }
    },
    "login_code": {
        "subject": {
            "fr": "Code de Connexion - Game Store",
            "en": "Login Code - Game Store",
            "ar": "رمز الدخول - Game Store"
        },
        "title": {
            "fr": "Connexion Sécurisée",
            "en": "Secure Login",
            "ar": "تسجيل دخول آمن"
        },
        "request_text": {
            "fr": "Nouvelle demande de connexion",
            "en": "New login request",
            "ar": "طلب دخول جديد"
        },
        "instruction": {
            "fr": "Utilisez ce code unique:",
            "en": "Use this unique code:",
            "ar": "استخدم هذا الرمز الفريد:"
        },
        "expiry": {
            "fr": "Expire dans 10 minutes",
            "en": "Expires in 10 minutes",
            "ar": "تنتهي صلاحيته خلال 10 دقائق"
        },
        "ignore_text": {
            "fr": "Si vous n'avez pas demandé ce code, ignorez cet email.",
            "en": "If you didn't request this, ignore this email.",
            "ar": "إذا لم تطلب هذا، تجاهل هذا البريد."
        }
    },
    "password_reset": {
        "subject": {
            "fr": "Réinitialisation Mot de Passe",
            "en": "Password Reset",
            "ar": "إعادة تعيين كلمة المرور"
        },
        "title": {
            "fr": "Réinitialiser votre Mot de Passe",
            "en": "Reset Your Password",
            "ar": "إعادة تعيين كلمة المرور"
        },
        "greeting": {
            "fr": "Bonjour,",
            "en": "Hello,",
            "ar": "مرحباً،"
        },
        "instruction": {
            "fr": "Cliquez ci-dessous pour réinitialiser votre mot de passe:",
            "en": "Click below to reset your password:",
            "ar": "انقر أدناه لإعادة تعيين كلمة المرور:"
        },
        "button": {
            "fr": "Réinitialiser",
            "en": "Reset Password",
            "ar": "إعادة تعيين"
        },
        "expiry": {
            "fr": "Lien valable 1 heure",
            "en": "Link valid for 1 hour",
            "ar": "رابط صالح لمدة ساعة"
        },
        "ignore": {
            "fr": "Si vous n'avez pas demandé ceci, ignorez cet email.",
            "en": "If you didn't request this, ignore this email.",
            "ar": "إذا لم تطلب هذا، تجاهل البريد."
        }
    }
}


def send_otp_email(to_email: str, otp_code: str, lang: str = "fr") -> bool:
    """Send OTP verification code in specific language"""
    lang = lang if lang in ["fr", "en", "ar"] else "fr"
    t = EMAIL_TRANSLATIONS["otp"]
    is_rtl = lang == "ar"
    direction = "rtl" if is_rtl else "ltr"
    
    html_content = f"""
    <!DOCTYPE html>
    <html dir="{direction}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;letter-spacing:0.5px;">Game Store Zarzis</h1>
            </div>
            
            <!-- Body -->
            <div style="padding:40px 32px;text-align:center;">
                <h2 style="margin:0 0 16px;color:#333;font-size:24px;font-weight:600;">{t["title"][lang]}</h2>
                <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">{t["instruction"][lang]}</p>
                
                <!-- OTP Code Box -->
                <div style="display:inline-block;background:#f8f9fa;border:3px solid #667eea;border-radius:12px;padding:24px 48px;margin:0 0 24px;">
                    <div style="font-size:42px;font-weight:bold;color:#667eea;letter-spacing:12px;font-family:monospace;">
                        {otp_code}
                    </div>
                </div>
                
                <p style="margin:0;color:#999;font-size:14px;">{t["expiry"][lang]}</p>
            </div>
            
            <!-- Footer -->
            <div style="background:#1a1a1a;padding:24px;text-align:center;">
                <p style="margin:0;color:#999;font-size:13px;">Zarzis, Tunisie | Tel: 23 290 065</p>
                <p style="margin:8px 0 0;color:#666;font-size:12px;">Game Store Zarzis © 2026</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"{t['instruction'][lang]} {otp_code}. {t['expiry'][lang]}"
    
    return send_email_core(
        subject=t["subject"][lang],
        recipient_email=to_email,
        recipient_name="User",
        html_content=html_content,
        text_content=text_content
    )


def send_staff_invitation(email: str, role: str, password: str, lang: str = "fr") -> bool:
    """Send invitation to new staff member"""
    lang = lang if lang in ["fr", "en", "ar"] else "fr"
    t = EMAIL_TRANSLATIONS["staff_invite"]
    role_name = t["roles"].get(role, t["roles"]["worker"])[lang]
    is_rtl = lang == "ar"
    direction = "rtl" if is_rtl else "ltr"
    
    html_content = f"""
    <!DOCTYPE html>
    <html dir="{direction}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#FFD700 0%,#FDB931 100%);padding:32px 24px;text-align:center;">
                <h1 style="margin:0;color:#333;font-size:28px;font-weight:bold;">{t["welcome"][lang]}</h1>
            </div>
            
            <!-- Body -->
            <div style="padding:40px 32px;">
                <h2 style="margin:0 0 16px;color:#333;font-size:20px;">{t["greeting"][lang]}</h2>
                <p style="margin:0 0 24px;color:#666;font-size:16px;line-height:1.6;">
                    {t["invite_text"][lang]} <strong style="color:#FDB931;">{role_name}</strong>.
                </p>
                
                <!-- Credentials Box -->
                <div style="background:#f8f9fa;border-left:5px solid #FDB931;border-radius:8px;padding:24px;margin:0 0 24px;">
                    <p style="margin:0 0 12px;color:#333;font-weight:600;font-size:15px;">{t["credentials"][lang]}</p>
                    <p style="margin:0 0 8px;color:#555;"><strong>Email:</strong> {email}</p>
                    <p style="margin:0;color:#555;"><strong>{t["temp_password"][lang]}</strong> {password}</p>
                </div>
                
                <p style="margin:0 0 32px;color:#666;font-size:14px;line-height:1.6;">
                    {t["action_required"][lang]}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align:center;">
                    <a href="{FRONTEND_URL}/staff-login" style="display:inline-block;background:#333;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        {t["button"][lang]}
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background:#1a1a1a;padding:24px;text-align:center;">
                <p style="margin:0;color:#999;font-size:13px;">Zarzis, Tunisie | Tel: 23 290 065</p>
                <p style="margin:8px 0 0;color:#666;font-size:12px;">Game Store Zarzis © 2026</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"{t['welcome'][lang]}! {t['invite_text'][lang]} {role_name}. Email: {email}, Password: {password}"
    
    return send_email_core(
        subject=t["subject"][lang],
        recipient_email=email,
        recipient_name="New Staff",
        html_content=html_content,
        text_content=text_content
    )


def send_otp_email_alternative(to_email: str, otp_code: str, lang: str = "fr") -> bool:
    """Alternative OTP for client login"""
    return send_otp_email(to_email, otp_code, lang)


def send_password_reset_email(to_email: str, recovery_url: str, lang: str = "fr") -> bool:
    """Send password reset email with magic link"""
    lang = lang if lang in ["fr", "en", "ar"] else "fr"
    t = EMAIL_TRANSLATIONS["password_reset"]
    is_rtl = lang == "ar"
    direction = "rtl" if is_rtl else "ltr"
    
    html_content = f"""
    <!DOCTYPE html>
    <html dir="{direction}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 24px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:bold;">Game Store Zarzis</h1>
            </div>
            
            <!-- Body -->
            <div style="padding:40px 32px;">
                <h2 style="margin:0 0 16px;color:#333;font-size:24px;">{t["title"][lang]}</h2>
                <p style="margin:0 0 8px;color:#666;font-size:16px;">{t["greeting"][lang]}</p>
                <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">
                    {t["instruction"][lang]}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align:center;margin:0 0 32px;">
                    <a href="{recovery_url}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        {t["button"][lang]}
                    </a>
                </div>
                
                <p style="margin:0 0 16px;color:#999;font-size:14px;text-align:center;">{t["expiry"][lang]}</p>
                <p style="margin:0;color:#aaa;font-size:13px;text-align:center;">{t["ignore"][lang]}</p>
                
                <!-- Link Fallback -->
                <div style="margin:32px 0 0;padding:16px;background:#f8f9fa;border-radius:6px;">
                    <p style="margin:0 0 8px;color:#666;font-size:12px;font-weight:600;">Lien direct:</p>
                    <p style="margin:0;color:#999;font-size:11px;word-break:break-all;">{recovery_url}</p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background:#1a1a1a;padding:24px;text-align:center;">
                <p style="margin:0;color:#999;font-size:13px;">Zarzis, Tunisie | Tel: 23 290 065</p>
                <p style="margin:8px 0 0;color:#666;font-size:12px;">Game Store Zarzis © 2026</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"{t['instruction'][lang]} {recovery_url}. {t['expiry'][lang]}"
    
    return send_email_core(
        subject=t["subject"][lang],
        recipient_email=to_email,
        recipient_name="User",
        html_content=html_content,
        text_content=text_content
    )


# Legacy functions kept for compatibility
def send_booking_confirmation(client_name: str, client_email: str, console_type: str, session_type: str, preferred_date: str = None, preferred_time: str = None) -> bool:
    """Legacy function - kept for compatibility"""
    logger.info(f"Booking confirmation requested but not yet migrated to Resend")
    return True


def send_session_receipt(client_name: str, client_email: str, console_type: str, duration: str, total_amount: float, points_earned: int, date: str) -> bool:
    """Legacy function - kept for compatibility"""
    logger.info(f"Session receipt requested but not yet migrated to Resend")
    return True


def send_contact_form_notification(from_name: str, from_email: str, subject: str, message: str) -> bool:
    """Legacy function - kept for compatibility"""
    logger.info(f"Contact form notification requested but not yet migrated to Resend")
    return True


def send_service_request_notification(client_name: str, client_phone: str, device_type: str, device_brand: str, issue_description: str, request_id: str, status: str = "pending") -> bool:
    """Legacy function - kept for compatibility"""
    logger.info(f"Service request notification requested but not yet migrated to Resend")
    return True
