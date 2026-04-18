import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'gs-zarzis-staff-auth', // Namespace isolation to prevent conflicts with client auth
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database table names (matching the final schema)
export const TABLES = {
  USER_ROLES: 'user_roles',
  PROFILES: 'profiles',
  CLIENTS: 'clients',
  STORE_SETTINGS: 'store_settings',
  PRICING: 'pricing',
  CONSOLES: 'consoles',
  GAMING_SESSIONS: 'gaming_sessions',
  PRODUCTS: 'products',
  SALES: 'sales',
  SERVICES_CATALOG: 'services_catalog',
  SERVICE_REQUESTS: 'service_requests',
  POINTS_TRANSACTIONS: 'points_transactions',
  STAFF_SHIFTS: 'staff_shifts',
  BLOG_POSTS: 'blog_posts',
  DAILY_STATS: 'daily_stats',
  EXPENSES: 'expenses',
  GAME_SHORTCUTS: 'game_shortcuts',
  ORDERS: 'orders'
} as const
