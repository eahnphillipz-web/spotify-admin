import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { ADMIN } from './seed';

/**
 * MOCK admin sign-in. Not security: there is no server, the credentials
 * below are public demo values, and the session lives in sessionStorage so
 * a refresh keeps you in. A real console needs Firebase Auth plus an admin
 * role (custom claims or an allow-list), which is an open decision.
 */
export const DEMO_ADMIN = { email: 'admin@harbor.test', password: 'harbor-admin-demo' };

const KEY = 'harbor.admin.session';

type Session = { name: string; email: string; role: string };
type AuthValue = {
  session: Session | null;
  signIn: (email: string, password: string) => Promise<Session>;
  signOut: () => void;
};

export class SignInError extends Error {
  field?: 'email' | 'password';
  constructor(message: string, field?: SignInError['field']) {
    super(message);
    this.field = field;
  }
}

const AuthContext = createContext<AuthValue | null>(null);

function read(): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(read);

  const signIn = useCallback(async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 600));
    if (
      email.trim().toLowerCase() !== DEMO_ADMIN.email ||
      password !== DEMO_ADMIN.password
    ) {
      throw new SignInError(
        "That email and password don't match an admin account.",
        'password',
      );
    }
    const next: Session = { name: ADMIN.name, email: DEMO_ADMIN.email, role: ADMIN.role };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // Storage blocked: the session just won't survive a refresh.
    }
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, signIn, signOut }), [session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
