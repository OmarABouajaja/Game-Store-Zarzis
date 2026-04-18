import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

type AppRole = "owner" | "worker";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isLoading: boolean;
  isStaff: boolean;
  isOwner: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  isClockedIn: boolean;
  currentSessionStartTime: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  /* 
   * Session Stability:
   * Start with isLoading=true to prevent flashing redirects.
   * Cache role in localStorage to avoid flicker on page refresh.
   */
  const [role, setRole] = useState<AppRole | null>(() => {
    return localStorage.getItem('user_role') as AppRole | null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isClockedIn, setIsClockedIn] = useState(() => {
    return localStorage.getItem('isClockedIn') === 'true';
  });
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<string | null>(() => {
    return localStorage.getItem('currentSessionStartTime');
  });

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    try {


      // Add internal timeout for the query (increased to 5s for reliability)
      const queryPromise = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 5000)
      );

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) {
        console.error("AuthContext: Database error fetching role:", error);
        return null;
      }

      if (!data) {
        console.warn("AuthContext: No role found for user");
        return null;
      }

      const foundRole = data.role as AppRole;
      localStorage.setItem('user_role', foundRole); // Persist role
      return foundRole;
    } catch (err: any) {
      console.error("AuthContext: Exception fetching role:", err.message || err);
      return null;
    }
  };

  // 🚀 Profile Sync Logic (Ensures visibility in dashboard)
  const syncProfile = async (targetUser: User) => {
    try {

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: targetUser.id,
          full_name: targetUser.user_metadata?.full_name || "Staff Member",
          is_active: true,
          updated_at: new Date().toISOString()
        });

      if (error) console.error("AuthContext: Profile sync failed", error);
    } catch (err) {
      console.error("AuthContext: Profile sync exception", err);
    }
  };




  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;



        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setRole(null);
          localStorage.removeItem('user_role');
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Force update last active on every sign in / resume
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            syncProfile(session.user).catch(console.error);
          }

          // Re-fetch role to be safe, but utilize cache if network fails
          try {
            const currentRole = localStorage.getItem('user_role') as AppRole | null;
            // Optimistically set from cache if available to prevent flicker
            if (currentRole && !role) {
              setRole(currentRole);
            }

            const fetchedRole = await fetchUserRole(session.user.id);
            if (isMounted) {
              if (fetchedRole) {
                setRole(fetchedRole);
              } else if (!currentRole) {
                // Only nullify if we have NO role at all (neither fetched nor cached)
                // This allows "offline" mode or RLS failure survival
                console.warn("AuthContext: No role found, and no cache.");
                setRole(null);
              }
            }
          } catch (error) {
            console.error('AuthContext: Error checking role:', error);
          }
        } else {
          // Case: Session exists but user is somehow null? Rare.
        }

        setIsLoading(false);
      }
    );

    // Initial Load Logic
    const initializeAuth = async () => {
      try {
        const query = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth Timeout")), 5000)
        );

        const { data: { session }, error } = await Promise.race([query, timeoutPromise]) as any;

        if (error) throw error;
        if (!isMounted) return;

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Try to get role
          const cachedRole = localStorage.getItem('user_role') as AppRole | null;
          if (cachedRole) setRole(cachedRole);

          // Background refresh of role
          fetchUserRole(session.user.id).then(r => {
            if (isMounted && r) setRole(r);
          });
        } else {
          setRole(null);
          localStorage.removeItem('user_role');
        }
      } catch (err) {
        console.error("AuthContext: Init error", err);
        if (isMounted) setRole(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array prevents re-subscription loops

  // 🚀 Attendance Hardening: Check DB for active shift on mount
  useEffect(() => {
    if (!user) return;

    const checkActiveShift = async () => {
      try {
        const query = supabase
          .from('staff_shifts')
          .select('id, check_in')
          .eq('staff_id', user.id)
          .is('check_out', null)
          .order('check_in', { ascending: false })
          .limit(1)
          .maybeSingle();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Shift Check Timeout")), 5000)
        );

        const { data, error } = await Promise.race([query, timeoutPromise]) as any;

        if (error) {
          console.error("AuthContext: Failed to check active shift", error);
          return;
        }

        if (data) {
          localStorage.setItem('current_staff_session_id', data.id);
          localStorage.setItem('currentSessionStartTime', data.check_in);
          setIsClockedIn(true);
          setCurrentSessionStartTime(data.check_in);
        } else {
          localStorage.removeItem('current_staff_session_id');
          localStorage.removeItem('currentSessionStartTime');
          setIsClockedIn(false);
          setCurrentSessionStartTime(null);
        }
      } catch (err) {
        console.error("AuthContext: Active shift check exception", err);
      }
    };

    checkActiveShift();
  }, [user]);

  const clockIn = async () => {
    if (!user) return;

    // 1. Check for existing active session first
    const { data: existingSession } = await supabase
      .from('staff_shifts')
      .select('id, check_in')
      .eq('staff_id', user.id)
      .is('check_out', null)
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      // Resume existing session
      localStorage.setItem('current_staff_session_id', existingSession.id);
      localStorage.setItem('currentSessionStartTime', existingSession.check_in);
      setIsClockedIn(true);
      setCurrentSessionStartTime(existingSession.check_in);
      return;
    }

    // 2. No existing session, create new one
    const { data: sessionData, error: sessionError } = await supabase
      .from('staff_shifts')
      .insert({ staff_id: user.id })
      .select()
      .single();

    if (sessionError) throw sessionError;

    if (sessionData) {
      localStorage.setItem('current_staff_session_id', sessionData.id);
      localStorage.setItem('currentSessionStartTime', sessionData.check_in);
      setIsClockedIn(true);
      setCurrentSessionStartTime(sessionData.check_in);

      // Notify Owner
      import('@/services/emailService').then(({ sendStaffAttendanceNotification }) => {
        sendStaffAttendanceNotification({
          staffName: user.user_metadata?.full_name || user.email || 'Staff',
          action: 'clock_in',
          time: new Date().toLocaleTimeString('fr-FR')
        });
      });

      // Invalidate queries for real-time dashboard sync
      queryClient.invalidateQueries({ queryKey: ['all-active-shifts'] });
    }
  };

  const clockOut = async () => {
    const sessionId = localStorage.getItem('current_staff_session_id');

    // Fallback: If no local ID, check DB for any open shift to close it
    let targetSessionId = sessionId;
    if (!targetSessionId && user) {
      const { data } = await supabase
        .from('staff_shifts')
        .select('id')
        .eq('staff_id', user.id)
        .is('check_out', null)
        .limit(1)
        .maybeSingle();
      if (data) targetSessionId = data.id;
    }

    if (targetSessionId) {
      const { error } = await supabase
        .from('staff_shifts')
        .update({ check_out: new Date().toISOString() })
        .eq('id', targetSessionId);

      if (error) throw error;

      localStorage.removeItem('current_staff_session_id');
      localStorage.removeItem('currentSessionStartTime');
      setIsClockedIn(false);
      setCurrentSessionStartTime(null);

      // Notify Owner
      import('@/services/emailService').then(({ sendStaffAttendanceNotification }) => {
        sendStaffAttendanceNotification({
          staffName: user?.user_metadata?.full_name || user?.email || 'Staff',
          action: 'clock_out',
          time: new Date().toLocaleTimeString('fr-FR')
        });
      });

      // Invalidate queries for real-time dashboard sync
      queryClient.invalidateQueries({ queryKey: ['all-active-shifts'] });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      const targetUser = data.user;

      const promises: any[] = [
        supabase
          .from('profiles')
          .upsert({
            id: targetUser.id,
            full_name: targetUser.user_metadata?.full_name || "Staff Member",
            updated_at: new Date().toISOString()
          })
      ];

      Promise.all(promises).then((results) => {
        const profileRes = results[0];
        if (profileRes.error) console.error("Profile sync failed", profileRes.error);
      }).catch(err => console.error("Post-login operations failed", err));
    }

    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    try {
      // Use custom backend endpoint with beautiful Resend template
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://bck.gamestorezarzis.com.tn';

      const response = await fetch(`${BACKEND_URL}/email/staff-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          lang: 'fr' // Can be dynamic based on current language
        }),
      });

      if (!response.ok) {
        console.warn("Custom password reset failed, falling back to Supabase default");
        // Fallback to Supabase standard email if backend custom email fails
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }

      return { error: null };
    } catch (err: any) {
      console.error('Password reset error:', err);
      return { error: new Error(err.message || 'Failed to send reset email') };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (!error) {
        // Optionally sign out user to force re-login with new password
        // await signOut();
      }

      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await clockOut();
    await supabase.auth.signOut();
    setRole(null);
  };

  const contextValue = useMemo(() => ({
    user,
    session,
    role,
    isLoading,
    isStaff: role === "owner" || role === "worker",
    isOwner: role === "owner",
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    clockIn,
    clockOut,
    isClockedIn,
    currentSessionStartTime,
  }), [user, session, role, isLoading, isClockedIn, currentSessionStartTime]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
