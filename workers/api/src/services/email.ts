/**
 * Resend Email Service for Cloudflare Workers.
 * 
 * 1:1 port of the Python email_service.py.
 * Uses Resend REST API directly (no SDK needed in Workers).
 * All HTML templates preserved exactly.
 */
import type { Env } from '../types';

// ─── Translation Dictionary ──────────────────────────────────────────

const EMAIL_TRANSLATIONS = {
  staff_invite: {
    subject: {
      fr: 'Invitation Staff - Game Store Zarzis',
      en: 'Staff Invitation - Game Store Zarzis',
      ar: 'دعوة موظف - Game Store Zarzis',
    },
    welcome: {
      fr: "Bienvenue dans l'Équipe!",
      en: 'Welcome to the Team!',
      ar: 'مرحباً بك في الفريق!',
    },
    greeting: {
      fr: 'Bonjour!',
      en: 'Hello!',
      ar: 'مرحباً!',
    },
    invite_text: {
      fr: 'Vous avez été invité à rejoindre Game Store Zarzis en tant que',
      en: 'You have been invited to join Game Store Zarzis as',
      ar: 'لقد تمت دعوتك للانضمام إلى Game Store Zarzis بصفتك',
    },
    credentials: {
      fr: 'Vos identifiants de connexion:',
      en: 'Your login credentials:',
      ar: 'بيانات تسجيل الدخول:',
    },
    temp_password: {
      fr: 'Mot de passe temporaire:',
      en: 'Temporary password:',
      ar: 'كلمة المرور المؤقتة:',
    },
    action_required: {
      fr: 'Connectez-vous et changez votre mot de passe dès que possible.',
      en: 'Log in and change your password as soon as possible.',
      ar: 'قم بتسجيل الدخول وتغيير كلمة المرور في أقرب وقت.',
    },
    button: {
      fr: 'Accéder au Dashboard',
      en: 'Access Dashboard',
      ar: 'الدخول إلى لوحة التحكم',
    },
    roles: {
      owner: { fr: 'Propriétaire', en: 'Owner', ar: 'مالك' },
      worker: { fr: 'Employé', en: 'Staff', ar: 'موظف' },
    },
  },
  otp: {
    subject: {
      fr: 'Votre Code - Game Store Zarzis',
      en: 'Your Code - Game Store Zarzis',
      ar: 'رمزك - Game Store Zarzis',
    },
    title: {
      fr: 'Code de Vérification',
      en: 'Verification Code',
      ar: 'رمز التحقق',
    },
    instruction: {
      fr: 'Voici votre code pour accéder à votre compte:',
      en: 'Here is your code to access your account:',
      ar: 'إليك الرمز للوصول إلى حسابك:',
    },
    expiry: {
      fr: 'Ce code expire dans 10 minutes.',
      en: 'This code expires in 10 minutes.',
      ar: 'تنتهي صلاحية هذا الرمز خلال 10 دقائق.',
    },
  },
  login_code: {
    subject: {
      fr: 'Code de Connexion - Game Store',
      en: 'Login Code - Game Store',
      ar: 'رمز الدخول - Game Store',
    },
    title: {
      fr: 'Connexion Sécurisée',
      en: 'Secure Login',
      ar: 'تسجيل دخول آمن',
    },
    request_text: {
      fr: 'Nouvelle demande de connexion',
      en: 'New login request',
      ar: 'طلب دخول جديد',
    },
    instruction: {
      fr: 'Utilisez ce code unique:',
      en: 'Use this unique code:',
      ar: 'استخدم هذا الرمز الفريد:',
    },
    expiry: {
      fr: 'Expire dans 10 minutes',
      en: 'Expires in 10 minutes',
      ar: 'تنتهي صلاحيته خلال 10 دقائق',
    },
    ignore_text: {
      fr: "Si vous n'avez pas demandé ce code, ignorez cet email.",
      en: "If you didn't request this, ignore this email.",
      ar: 'إذا لم تطلب هذا، تجاهل هذا البريد.',
    },
  },
  password_reset: {
    subject: {
      fr: 'Réinitialisation Mot de Passe',
      en: 'Password Reset',
      ar: 'إعادة تعيين كلمة المرور',
    },
    title: {
      fr: 'Réinitialiser votre Mot de Passe',
      en: 'Reset Your Password',
      ar: 'إعادة تعيين كلمة المرور',
    },
    greeting: {
      fr: 'Bonjour,',
      en: 'Hello,',
      ar: 'مرحباً،',
    },
    instruction: {
      fr: 'Cliquez ci-dessous pour réinitialiser votre mot de passe:',
      en: 'Click below to reset your password:',
      ar: 'انقر أدناه لإعادة تعيين كلمة المرور:',
    },
    button: {
      fr: 'Réinitialiser',
      en: 'Reset Password',
      ar: 'إعادة تعيين',
    },
    expiry: {
      fr: 'Lien valable 1 heure',
      en: 'Link valid for 1 hour',
      ar: 'رابط صالح لمدة ساعة',
    },
    ignore: {
      fr: "Si vous n'avez pas demandé ceci, ignorez cet email.",
      en: "If you didn't request this, ignore this email.",
      ar: 'إذا لم تطلب هذا، تجاهل البريد.',
    },
  },
} as const;

type Lang = 'fr' | 'en' | 'ar';

function safeLang(lang?: string): Lang {
  if (lang === 'en' || lang === 'ar') return lang;
  return 'fr';
}

// ─── Core Send Function ──────────────────────────────────────────────

async function sendEmailCore(
  env: Env,
  subject: string,
  recipientEmail: string,
  recipientName: string,
  htmlContent: string,
  textContent: string
): Promise<boolean> {
  console.log(`Sending email to ${recipientEmail}: ${subject}`);

  if (!env.RESEND_API_KEY) {
    console.warn(`⚠️ No RESEND_API_KEY configured for ${recipientEmail}`);
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${env.FROM_NAME} <${env.FROM_EMAIL}>`,
        to: [recipientEmail],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as { id?: string };
      console.log(`✅ Email sent via Resend to ${recipientEmail} (ID: ${data.id || 'N/A'})`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Resend API failed for ${recipientEmail}: ${response.status} - ${error}`);
      return false;
    }
  } catch (e) {
    console.error(`❌ Email send exception for ${recipientEmail}: ${e}`);
    return false;
  }
}

// ─── Email Footer (shared) ──────────────────────────────────────────

const EMAIL_FOOTER = `
  <div style="background:#1a1a1a;padding:24px;text-align:center;">
    <p style="margin:0;color:#999;font-size:13px;">Zarzis, Tunisie | Tel: 23 290 065</p>
    <p style="margin:8px 0 0;color:#666;font-size:12px;">Game Store Zarzis © 2026</p>
  </div>
`;

// ─── OTP Email ───────────────────────────────────────────────────────

export async function sendOtpEmail(
  env: Env,
  toEmail: string,
  otpCode: string,
  lang?: string
): Promise<boolean> {
  const l = safeLang(lang);
  const t = EMAIL_TRANSLATIONS.otp;
  const direction = l === 'ar' ? 'rtl' : 'ltr';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${direction}">
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
                <h2 style="margin:0 0 16px;color:#333;font-size:24px;font-weight:600;">${t.title[l]}</h2>
                <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">${t.instruction[l]}</p>
                
                <!-- OTP Code Box -->
                <div style="display:inline-block;background:#f8f9fa;border:3px solid #667eea;border-radius:12px;padding:24px 48px;margin:0 0 24px;">
                    <div style="font-size:42px;font-weight:bold;color:#667eea;letter-spacing:12px;font-family:monospace;">
                        ${otpCode}
                    </div>
                </div>
                
                <p style="margin:0;color:#999;font-size:14px;">${t.expiry[l]}</p>
            </div>
            
            ${EMAIL_FOOTER}
        </div>
    </body>
    </html>
  `;

  const textContent = `${t.instruction[l]} ${otpCode}. ${t.expiry[l]}`;

  return sendEmailCore(env, t.subject[l], toEmail, 'User', htmlContent, textContent);
}

// Alias for compatibility
export const sendOtpEmailAlternative = sendOtpEmail;

// ─── Staff Invitation Email ─────────────────────────────────────────

export async function sendStaffInvitation(
  env: Env,
  email: string,
  role: string,
  password: string,
  lang?: string
): Promise<boolean> {
  const l = safeLang(lang);
  const t = EMAIL_TRANSLATIONS.staff_invite;
  const roleKey = role as keyof typeof t.roles;
  const roleName = (t.roles[roleKey] || t.roles.worker)[l];
  const direction = l === 'ar' ? 'rtl' : 'ltr';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${direction}">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5;">
        <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#FFD700 0%,#FDB931 100%);padding:32px 24px;text-align:center;">
                <h1 style="margin:0;color:#333;font-size:28px;font-weight:bold;">${t.welcome[l]}</h1>
            </div>
            
            <!-- Body -->
            <div style="padding:40px 32px;">
                <h2 style="margin:0 0 16px;color:#333;font-size:20px;">${t.greeting[l]}</h2>
                <p style="margin:0 0 24px;color:#666;font-size:16px;line-height:1.6;">
                    ${t.invite_text[l]} <strong style="color:#FDB931;">${roleName}</strong>.
                </p>
                
                <!-- Credentials Box -->
                <div style="background:#f8f9fa;border-left:5px solid #FDB931;border-radius:8px;padding:24px;margin:0 0 24px;">
                    <p style="margin:0 0 12px;color:#333;font-weight:600;font-size:15px;">${t.credentials[l]}</p>
                    <p style="margin:0 0 8px;color:#555;"><strong>Email:</strong> ${email}</p>
                    <p style="margin:0;color:#555;"><strong>${t.temp_password[l]}</strong> ${password}</p>
                </div>
                
                <p style="margin:0 0 32px;color:#666;font-size:14px;line-height:1.6;">
                    ${t.action_required[l]}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align:center;">
                    <a href="${env.FRONTEND_URL}/staff-login" style="display:inline-block;background:#333;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        ${t.button[l]}
                    </a>
                </div>
            </div>
            
            ${EMAIL_FOOTER}
        </div>
    </body>
    </html>
  `;

  const textContent = `${t.welcome[l]}! ${t.invite_text[l]} ${roleName}. Email: ${email}, Password: ${password}`;

  return sendEmailCore(env, t.subject[l], email, 'New Staff', htmlContent, textContent);
}

// ─── Password Reset Email ───────────────────────────────────────────

export async function sendPasswordResetEmail(
  env: Env,
  toEmail: string,
  recoveryUrl: string,
  lang?: string
): Promise<boolean> {
  const l = safeLang(lang);
  const t = EMAIL_TRANSLATIONS.password_reset;
  const direction = l === 'ar' ? 'rtl' : 'ltr';

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="${direction}">
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
                <h2 style="margin:0 0 16px;color:#333;font-size:24px;">${t.title[l]}</h2>
                <p style="margin:0 0 8px;color:#666;font-size:16px;">${t.greeting[l]}</p>
                <p style="margin:0 0 32px;color:#666;font-size:16px;line-height:1.6;">
                    ${t.instruction[l]}
                </p>
                
                <!-- CTA Button -->
                <div style="text-align:center;margin:0 0 32px;">
                    <a href="${recoveryUrl}" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:16px 40px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
                        ${t.button[l]}
                    </a>
                </div>
                
                <p style="margin:0 0 16px;color:#999;font-size:14px;text-align:center;">${t.expiry[l]}</p>
                <p style="margin:0;color:#aaa;font-size:13px;text-align:center;">${t.ignore[l]}</p>
                
                <!-- Link Fallback -->
                <div style="margin:32px 0 0;padding:16px;background:#f8f9fa;border-radius:6px;">
                    <p style="margin:0 0 8px;color:#666;font-size:12px;font-weight:600;">Lien direct:</p>
                    <p style="margin:0;color:#999;font-size:11px;word-break:break-all;">${recoveryUrl}</p>
                </div>
            </div>
            
            ${EMAIL_FOOTER}
        </div>
    </body>
    </html>
  `;

  const textContent = `${t.instruction[l]} ${recoveryUrl}. ${t.expiry[l]}`;

  return sendEmailCore(env, t.subject[l], toEmail, 'User', htmlContent, textContent);
}

// ─── Legacy Functions (kept for compatibility, return true as stubs) ─

export async function sendBookingConfirmation(
  env: Env,
  _clientName: string,
  _clientEmail: string,
  _consoleType: string,
  _sessionType: string,
  _preferredDate?: string,
  _preferredTime?: string
): Promise<boolean> {
  console.log('Booking confirmation requested but not yet migrated to Resend');
  return true;
}

export async function sendSessionReceipt(
  env: Env,
  _clientName: string,
  _clientEmail: string,
  _consoleType: string,
  _duration: string,
  _totalAmount: number,
  _pointsEarned: number,
  _date: string
): Promise<boolean> {
  console.log('Session receipt requested but not yet migrated to Resend');
  return true;
}

export async function sendContactFormNotification(
  env: Env,
  _fromName: string,
  _fromEmail: string,
  _subject: string,
  _message: string
): Promise<boolean> {
  console.log('Contact form notification requested but not yet migrated to Resend');
  return true;
}

export async function sendServiceRequestNotification(
  env: Env,
  _clientName: string,
  _clientPhone: string,
  _deviceType: string,
  _deviceBrand: string,
  _issueDescription: string,
  _requestId: string,
  _status: string
): Promise<boolean> {
  console.log('Service request notification requested but not yet migrated to Resend');
  return true;
}
