/**
 * Email Routes — /email/*
 * 1:1 port of backend/routers/email_routes.py
 */
import { Hono } from 'hono';
import type { AppType } from '../types';
import { getSupabase } from '../services/supabase';
import {
  sendBookingConfirmation,
  sendContactFormNotification,
  sendServiceRequestNotification,
  sendSessionReceipt,
  sendStaffInvitation,
  sendPasswordResetEmail,
} from '../services/email';

const emailRoutes = new Hono<AppType>();

// POST /email/booking-confirmation
emailRoutes.post('/booking-confirmation', async (c) => {
  const body = await c.req.json<{
    client_name: string;
    client_email: string;
    console_type: string;
    session_type: string;
    preferred_date?: string;
    preferred_time?: string;
  }>();

  const success = await sendBookingConfirmation(
    c.env,
    body.client_name,
    body.client_email,
    body.console_type,
    body.session_type,
    body.preferred_date,
    body.preferred_time
  );

  if (!success) return c.json({ detail: 'Failed to send email' }, 500);
  return c.json({ success: true, message: 'Booking confirmation sent' });
});

// POST /email/contact-form
emailRoutes.post('/contact-form', async (c) => {
  const body = await c.req.json<{
    from_name: string;
    from_email: string;
    subject: string;
    message: string;
  }>();

  const success = await sendContactFormNotification(
    c.env,
    body.from_name,
    body.from_email,
    body.subject,
    body.message
  );

  if (!success) return c.json({ detail: 'Failed to send email' }, 500);
  return c.json({ success: true, message: 'Contact form sent' });
});

// POST /email/service-request
emailRoutes.post('/service-request', async (c) => {
  const body = await c.req.json<{
    client_name: string;
    client_phone: string;
    device_type: string;
    device_brand: string;
    issue_description: string;
    request_id: string;
    status?: string;
  }>();

  const success = await sendServiceRequestNotification(
    c.env,
    body.client_name,
    body.client_phone,
    body.device_type,
    body.device_brand,
    body.issue_description,
    body.request_id,
    body.status || 'pending'
  );

  if (!success) return c.json({ detail: 'Failed to send email' }, 500);
  return c.json({ success: true, message: 'Service request notification sent' });
});

// POST /email/session-receipt
emailRoutes.post('/session-receipt', async (c) => {
  const body = await c.req.json<{
    client_name: string;
    client_email: string;
    console_type: string;
    duration: string;
    total_amount: number;
    points_earned: number;
    date: string;
  }>();

  const success = await sendSessionReceipt(
    c.env,
    body.client_name,
    body.client_email,
    body.console_type,
    body.duration,
    body.total_amount,
    body.points_earned,
    body.date
  );

  if (!success) return c.json({ detail: 'Failed to send email' }, 500);
  return c.json({ success: true, message: 'Session receipt sent' });
});

// POST /email/staff-invitation
emailRoutes.post('/staff-invitation', async (c) => {
  const body = await c.req.json<{
    email: string;
    role: string;
    password: string;
  }>();

  const success = await sendStaffInvitation(
    c.env,
    body.email,
    body.role,
    body.password
  );

  if (!success) return c.json({ detail: 'Failed to send email' }, 500);
  return c.json({ success: true, message: 'Staff invitation sent' });
});

// POST /email/staff-password-reset
emailRoutes.post('/staff-password-reset', async (c) => {
  const body = await c.req.json<{
    email: string;
    lang?: string;
  }>();

  try {
    const supabase = getSupabase(c.env);
    const resetRedirect = `${c.env.FRONTEND_URL}/reset-password`;

    // Generate recovery link via Supabase Admin
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: body.email,
      options: {
        redirectTo: resetRedirect,
      },
    });

    if (error || !data?.properties?.action_link) {
      console.error(`Password reset link generation failed: ${error?.message}`);
      return c.json({ detail: 'Failed to generate reset link' }, 400);
    }

    const recoveryUrl = data.properties.action_link;

    // Send beautiful custom email
    const success = await sendPasswordResetEmail(
      c.env,
      body.email,
      recoveryUrl,
      body.lang
    );

    if (!success) return c.json({ detail: 'Failed to send email' }, 500);

    return c.json({
      success: true,
      message: 'Password reset email sent with custom template',
    });
  } catch (e) {
    console.error(`Password reset error: ${e}`);
    return c.json({ detail: String(e) }, 500);
  }
});

export { emailRoutes };
