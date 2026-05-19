/**
 * Expenses Routes — /expenses/*
 * 1:1 port of backend/routers/expenses_routes.py
 * 
 * All routes require authentication via Bearer token.
 */
import { Hono } from 'hono';
import type { AppType } from '../types';
import { getSupabase } from '../services/supabase';
import { requireAuth } from '../middleware/auth';

const expensesRoutes = new Hono<AppType>();

// Apply auth middleware to all expenses routes
expensesRoutes.use('*', requireAuth);

// GET /expenses/
expensesRoutes.get('/', async (c) => {
  try {
    const supabase = getSupabase(c.env);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return c.json(data);
  } catch (e) {
    return c.json({ detail: String(e) }, 500);
  }
});

// POST /expenses/
expensesRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json<{
      description: string;
      amount: number;
      category: string;
      date: string;
      staff_id?: string;
    }>();

    const supabase = getSupabase(c.env);
    const insertData = {
      description: body.description,
      amount: body.amount,
      expense_type: body.category, // Mapping category -> expense_type
      created_at: body.date,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return c.json(data);
  } catch (e) {
    return c.json({ detail: `Failed to create expense: ${e}` }, 500);
  }
});

// DELETE /expenses/:expense_id
expensesRoutes.delete('/:expense_id', async (c) => {
  try {
    const expenseId = c.req.param('expense_id');
    const supabase = getSupabase(c.env);

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
    return c.json({ success: true });
  } catch (e) {
    return c.json({ detail: String(e) }, 500);
  }
});

export { expensesRoutes };
