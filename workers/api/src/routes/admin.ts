/**
 * Admin Routes — /api/admin/*
 * 1:1 port of backend/routers/admin_routes.py
 * 
 * All routes require owner-level authentication.
 */
import { Hono } from 'hono';
import type { AppType } from '../types';
import { getSupabase } from '../services/supabase';
import { requireAdmin } from '../middleware/auth';
import { sendStaffInvitation } from '../services/email';

const adminRoutes = new Hono<AppType>();

// Apply admin middleware to all routes
adminRoutes.use('*', requireAdmin);

// ─── DELETE /api/admin/cleanup ───────────────────────────────────────

adminRoutes.delete('/cleanup', async (c) => {
  try {
    const body = await c.req.json<{
      days_to_keep: number;
      tables?: string[];
    }>();

    const cutoffDate = new Date(
      Date.now() - body.days_to_keep * 24 * 60 * 60 * 1000
    ).toISOString();

    const allowedTables = [
      'gaming_sessions',
      'sales',
      'expenses',
      'audit_logs',
      'staff_sessions',
      'points_transactions',
    ];

    const tablesToClean = body.tables || ['gaming_sessions', 'sales', 'expenses'];
    const supabase = getSupabase(c.env);
    const results: Record<string, string> = {};

    for (const table of tablesToClean) {
      if (!allowedTables.includes(table)) {
        results[table] = 'Skipped: table not in allowed list';
        continue;
      }

      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .lt('created_at', cutoffDate);

        if (error) {
          results[table] = `Error: ${error.message}`;
        } else {
          results[table] = `Cleanup executed successfully (Cutoff: ${cutoffDate})`;
        }
      } catch (tableErr) {
        results[table] = `Execution failed: ${tableErr}`;
      }
    }

    return c.json({
      status: 'completed',
      cutoff_date: cutoffDate,
      details: results,
    });
  } catch (e) {
    return c.json({ detail: `Cleanup process failed: ${e}` }, 500);
  }
});

// ─── GET /api/admin/export ───────────────────────────────────────────

adminRoutes.get('/export', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const backup: Record<string, unknown> = {};
    const tables = [
      'gaming_sessions',
      'sales',
      'expenses',
      'clients',
      'products',
      'services_catalog',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2000);

        if (error) {
          backup[table] = { error: error.message };
        } else {
          backup[table] = data;
        }
      } catch (tableErr) {
        backup[table] = { error: `Table fetch failed: ${tableErr}` };
      }
    }

    return c.json({
      timestamp: new Date().toISOString(),
      data: backup,
    });
  } catch (e) {
    return c.json({ detail: `Export failed: ${e}` }, 500);
  }
});

// ─── POST /api/admin/staff ───────────────────────────────────────────

adminRoutes.post('/staff', async (c) => {
  const body = await c.req.json<{
    email: string;
    password: string;
    role: string;
    phone?: string;
    full_name?: string;
    skip_email?: boolean;
    lang?: string;
  }>();

  try {
    const supabase = getSupabase(c.env);
    const fullName = body.full_name || 'Staff Member';

    // 1. Create Auth User
    let userId: string;
    try {
      const { data: userResponse, error: authError } =
        await supabase.auth.admin.createUser({
          email: body.email,
          password: body.password,
          email_confirm: true,
          user_metadata: { full_name: fullName },
        });

      if (authError) {
        const errorStr = authError.message.toLowerCase();
        if (errorStr.includes('already registered') || errorStr.includes('already exists')) {
          return c.json(
            { detail: 'Ce membre du personnel est déjà enregistré.' },
            400
          );
        }
        if (errorStr.includes('weak_password') || errorStr.includes('password')) {
          return c.json(
            { detail: `Mot de passe invalide: ${authError.message}` },
            400
          );
        }
        return c.json(
          { detail: `Erreur Supabase Auth: ${authError.message}` },
          400
        );
      }

      userId = userResponse.user.id;
    } catch (authErr) {
      const errorStr = String(authErr).toLowerCase();
      if (errorStr.includes('already registered') || errorStr.includes('already exists')) {
        return c.json(
          { detail: 'Ce membre du personnel est déjà enregistré.' },
          400
        );
      }
      return c.json({ detail: `Erreur Supabase Auth: ${authErr}` }, 400);
    }

    // 2. Assign Role
    try {
      await supabase.from('user_roles').insert({
        user_id: userId,
        role: body.role,
      });
    } catch (roleError) {
      // Clean up user if role assignment fails
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch {
        // ignore cleanup errors
      }
      return c.json(
        { detail: `Impossible d'assigner le rôle: ${roleError}` },
        400
      );
    }

    // 3. Create Profile
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        email: body.email,
        full_name: fullName,
        phone: body.phone || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
    } catch (profileError) {
      console.error(`Profile upsert error: ${profileError}`);
      // Non-critical
    }

    // 4. Send Invitation Email
    let emailSent = false;
    if (!body.skip_email) {
      emailSent = await sendStaffInvitation(
        c.env,
        body.email,
        body.role,
        body.password,
        body.lang
      );
    }

    return c.json({
      status: 'success',
      user_id: userId,
      email_sent: emailSent,
      message: 'Staff member created and invited successfully',
    });
  } catch (e) {
    return c.json({ detail: String(e) }, 500);
  }
});

// ─── POST /api/admin/sync-profiles ──────────────────────────────────

adminRoutes.post('/sync-profiles', async (c) => {
  try {
    const supabase = getSupabase(c.env);

    // Fetch all users from Auth
    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      return c.json({ detail: String(listError) }, 500);
    }

    let syncedCount = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const userMeta = user.user_metadata || {};
        const fullName = (userMeta.full_name as string) || 'Staff Member';

        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName,
          is_active: true,
          updated_at: new Date().toISOString(),
        });

        syncedCount++;
      } catch (uErr) {
        errors.push(`Failed to sync ${user.email}: ${uErr}`);
      }
    }

    return c.json({
      status: 'success',
      synced_count: syncedCount,
      total_found: users.length,
      errors,
    });
  } catch (e) {
    return c.json({ detail: String(e) }, 500);
  }
});

// ─── DELETE /api/admin/staff/:user_id ────────────────────────────────

adminRoutes.delete('/staff/:user_id', async (c) => {
  const userId = c.req.param('user_id');

  try {
    const supabase = getSupabase(c.env);

    // 1. Delete from auth.users
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (authErr) {
      console.error(`Auth delete error: ${authErr}`);
      // Continue anyway to clean database
    }

    // 2. Delete from user_roles
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
    } catch (roleErr) {
      console.error(`Role delete error: ${roleErr}`);
    }

    // 3. Delete from profiles
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (profileErr) {
      console.error(`Profile delete error: ${profileErr}`);
    }

    return c.json({
      status: 'success',
      message: 'Staff member fully deleted from auth and database',
      user_id: userId,
    });
  } catch (e) {
    return c.json({ detail: String(e) }, 500);
  }
});

export { adminRoutes };
