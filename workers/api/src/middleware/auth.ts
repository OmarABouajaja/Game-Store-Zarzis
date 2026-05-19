/**
 * Auth Middleware for Cloudflare Workers.
 * 1:1 port of backend/utils/security.py.
 * 
 * Validates Bearer tokens against Supabase Auth and checks roles.
 */
import { Context, Next } from 'hono';
import { getSupabase } from '../services/supabase';
import type { AppType } from '../types';

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(c: Context): string | null {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

/**
 * Middleware: Requires a valid authenticated user.
 * Sets `c.set('user', ...)` for downstream handlers.
 */
export async function requireAuth(c: Context<AppType>, next: Next) {
  const token = extractToken(c);
  if (!token) {
    return c.json({ detail: 'Missing authentication credentials' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      console.warn('Authentication failed: Invalid credentials provided');
      return c.json({ detail: 'Invalid authentication credentials' }, 401);
    }

    c.set('user', data.user as any);
    await next();
  } catch (e) {
    console.error(`Authentication exception: ${e}`);
    return c.json({ detail: 'Authentication failed' }, 401);
  }
}

/**
 * Middleware: Requires an authenticated user with 'owner' role.
 * Checks the `user_roles` table in Supabase.
 */
export async function requireAdmin(c: Context<AppType>, next: Next) {
  const token = extractToken(c);
  if (!token) {
    return c.json({ detail: 'Missing authentication credentials' }, 401);
  }

  try {
    const supabase = getSupabase(c.env);
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      console.warn('Auth Error: Invalid or missing user response in requireAdmin');
      return c.json({ detail: 'Invalid token' }, 401);
    }

    const userId = userData.user.id;

    // Check role in database
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !roleData) {
      console.warn(`Access denied: No role found for user ${userId}`);
      return c.json({ detail: 'No role assigned to user' }, 403);
    }

    if (roleData.role !== 'owner') {
      console.warn(`Access denied: User ${userId} has role '${roleData.role}', owner required`);
      return c.json({ detail: 'Admin privileges required' }, 403);
    }

    console.log(`Admin access granted to user ${userId}`);
    c.set('user', userData.user as any);
    await next();
  } catch (e) {
    console.error(`Auth Error Details in requireAdmin: ${e}`);
    return c.json({ detail: 'Authentication error' }, 401);
  }
}
