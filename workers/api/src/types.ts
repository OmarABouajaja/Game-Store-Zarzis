/**
 * Environment bindings for the Cloudflare Worker.
 * Secrets are set via `wrangler secret put <NAME>`.
 * Vars are defined in wrangler.toml.
 */
export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;

  // Resend email
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  FROM_NAME: string;

  // App config
  ENVIRONMENT: string;
  FRONTEND_URL: string;
  STORE_EMAIL: string;

  // SMS (optional)
  SMS_API_KEY?: string;
  SMS_PROVIDER_URL?: string;
  SMS_ENABLED?: string;
}

/**
 * Authenticated user payload passed through middleware.
 */
export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  user_metadata?: Record<string, unknown>;
}

/**
 * Hono app type with Bindings and Variables.
 * Use this as the generic parameter for Hono<AppType>.
 */
export type AppType = {
  Bindings: Env;
  Variables: {
    user: AuthUser;
  };
};
