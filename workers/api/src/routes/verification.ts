/**
 * Verification Routes — /verify/*
 * 1:1 port of backend/routers/verification_routes.py
 */
import { Hono } from 'hono';
import type { AppType } from '../types';
import { getSupabase } from '../services/supabase';
import { sendOtpEmail } from '../services/email';
import { SMSService } from '../services/sms';

const verificationRoutes = new Hono<AppType>();

const OTP_EXPIRY_MINUTES = 10;

function generateOtp(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// POST /verify/send
verificationRoutes.post('/send', async (c) => {
  const body = await c.req.json<{
    identifier: string;
    type: string; // 'email' or 'sms'
    lang?: string;
  }>();

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  const supabase = getSupabase(c.env);

  // Store in DB
  try {
    await supabase.from('verification_codes').insert({
      identifier: body.identifier,
      code,
      expires_at: expiresAt,
      is_verified: false,
    });
  } catch (e) {
    console.error(`Error storing OTP: ${e}`);
    return c.json({ detail: 'Database error' }, 500);
  }

  // Check global SMS setting
  let smsEnabled = true;
  try {
    const { data: settingsData } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'sms_enabled')
      .single();

    smsEnabled = settingsData?.value ?? true;
  } catch {
    smsEnabled = true; // Default to true if error
  }

  let effectiveType = body.type;
  if (effectiveType === 'sms' && !smsEnabled) {
    if (body.identifier.includes('@')) {
      effectiveType = 'email';
    } else {
      return c.json(
        {
          detail:
            'Le service SMS est désactivé. Veuillez utiliser votre adresse email pour la vérification.',
        },
        400
      );
    }
  }

  let sent = false;

  if (effectiveType === 'sms') {
    if (!smsEnabled) {
      return c.json(
        { detail: 'SMS verification is currently disabled. Please use email.' },
        400
      );
    }
    const smsService = new SMSService(c.env);
    sent = await smsService.sendSMS(
      body.identifier,
      `Your Game Store Zarzis verification code is: ${code}`
    );
  } else if (effectiveType === 'email') {
    sent = await sendOtpEmail(c.env, body.identifier, code, body.lang);
  }

  if (sent) {
    return c.json({ success: true, message: 'Verification code sent' });
  } else {
    return c.json({ detail: 'Failed to send verification code' }, 500);
  }
});

// POST /verify/check
verificationRoutes.post('/check', async (c) => {
  const body = await c.req.json<{
    identifier: string;
    code: string;
  }>();

  try {
    const supabase = getSupabase(c.env);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('identifier', body.identifier)
      .eq('code', body.code)
      .eq('is_verified', false)
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Verification DB error: ${error.message}`);
      return c.json({ detail: 'Verification failed' }, 500);
    }

    if (data && data.length > 0) {
      const otpId = data[0].id;
      await supabase
        .from('verification_codes')
        .update({ is_verified: true })
        .eq('id', otpId);

      return c.json({ success: true, message: 'Verification successful' });
    } else {
      return c.json({ detail: 'Invalid or expired code' }, 400);
    }
  } catch (e) {
    console.error(`Error verifying OTP: ${e}`);
    return c.json({ detail: 'Verification failed' }, 500);
  }
});

export { verificationRoutes };
