import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { adminSupabase } from '../lib/supabase';
import { adminSignIn, adminSignOut, checkIsAdmin } from '../services/adminService';

interface AdminAuthValue {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      const { data } = await adminSupabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setIsAdmin(data.session ? await checkIsAdmin() : false);
      if (active) setLoading(false);
    })();

    // Keep this callback synchronous (supabase-js deadlocks on awaited calls here).
    const { data: sub } = adminSupabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) setIsAdmin(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      session,
      isAdmin,
      loading,
      signIn: async (email, password) => {
        await adminSignIn(email, password);
        const { data } = await adminSupabase.auth.getSession();
        setSession(data.session);
        setIsAdmin(true);
      },
      signOut: async () => {
        await adminSignOut();
        setSession(null);
        setIsAdmin(false);
      },
    }),
    [session, isAdmin, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return v;
}
