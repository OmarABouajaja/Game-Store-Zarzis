/**
 * Game Store Zarzis API — Cloudflare Worker
 * 
 * Main entry point. Replaces the Python/FastAPI backend that was on Render.
 * All routes, CORS, security headers, and middleware are configured here.
 * 
 * Version: 2.1.0 (parity with FastAPI version)
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AppType } from './types';
import { getSupabase } from './services/supabase';

// Route imports
import { emailRoutes } from './routes/email';
import { verificationRoutes } from './routes/verification';
import { expensesRoutes } from './routes/expenses';
import { adminRoutes } from './routes/admin';

const app = new Hono<AppType>();

// ─── Security Headers ───────────────────────────────────────────────
// Equivalent to SecurityHeadersMiddleware in FastAPI
app.use(
  '*',
  secureHeaders({
    xContentTypeOptions: 'nosniff',
    xFrameOptions: 'DENY',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    xXssProtection: '1; mode=block',
  })
);

// ─── CORS Configuration ─────────────────────────────────────────────
// Equivalent to CORSMiddleware in FastAPI
app.use(
  '*',
  cors({
    origin: [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:5173',
      'https://www.gamestorezarzis.com.tn',
      'https://gamestorezarzis.com.tn',
      'https://bck.gamestorezarzis.com.tn',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['*'],
    credentials: true,
  })
);

// ─── Trusted Host Check ─────────────────────────────────────────────
// Equivalent to TrustedHostMiddleware in FastAPI
const ALLOWED_HOSTS = [
  'localhost',
  '127.0.0.1',
  'bck.gamestorezarzis.com.tn',
  'gamestorezarzis.com.tn',
  'www.gamestorezarzis.com.tn',
];

app.use('*', async (c, next) => {
  const host = c.req.header('host')?.split(':')[0] || '';
  const isAllowed =
    ALLOWED_HOSTS.includes(host) ||
    host.endsWith('.workers.dev'); // Allow *.workers.dev for development/staging
  
  if (!isAllowed) {
    return c.json({ detail: 'Invalid host header' }, 400);
  }
  await next();
});

// ─── Mount Routes ────────────────────────────────────────────────────

// Email routes: /email/*
app.route('/email', emailRoutes);

// Verification routes: /verify/*
app.route('/verify', verificationRoutes);

// Expenses routes: /expenses/*
app.route('/expenses', expensesRoutes);

// Admin routes: /api/admin/*
app.route('/api/admin', adminRoutes);

// ─── Root & Health Routes ────────────────────────────────────────────

app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Game Store Zarzis API',
    status: 'online',
    version: '2.1.0',
    runtime: 'Cloudflare Workers',
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    services: {
      api: 'online',
      email: c.env.RESEND_API_KEY ? 'configured' : 'not_configured',
    },
  });
});

// POST /cleanup — Delete expired verification codes
app.post('/cleanup', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('verification_codes')
      .delete()
      .lt('expires_at', now)
      .select();

    if (error) {
      return c.json({ success: false, message: error.message });
    }

    return c.json({
      success: true,
      message: 'Cleanup completed',
      deleted_codes: data?.length || 0,
    });
  } catch (e) {
    console.error(`Cleanup error: ${e}`);
    return c.json({ success: false, message: String(e) });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json({ detail: 'Not Found' }, 404);
});

// ─── Error Handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error(`Unhandled error: ${err.message}`);
  return c.json({ detail: 'Internal Server Error' }, 500);
});

export default app;
