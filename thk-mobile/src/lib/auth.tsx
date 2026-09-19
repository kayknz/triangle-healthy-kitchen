import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { NativeBiometric } from 'capacitor-native-biometric';

// Role detection is now handled via database flags and metadata
export type UserRole = 'owner' | 'rider' | 'subscriber';

interface AuthResult {
  error: string | null;
  role?: UserRole;
  approved?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  userRole: UserRole | null;
  isApprovedRider: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string, role?: UserRole, phone?: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshAuth: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  biometricLogin: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isApprovedRider, setIsApprovedRider] = useState(false);

  const ensureOwnerSubscriber = async (userId: string) => {
    try {
      const { data: existing } = await supabase
        .from('subscribers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!existing) {
        await supabase
          .from('subscribers')
          .insert({
            user_id: userId,
            email: '',
            status: 'active',
            membership_type: 'premium',
            reward_tier: 'diamond',
          });
      }
    } catch (error) {
      console.error('Failed to ensure owner subscriber:', error);
    }
  };

  const getAuthAccess = async (u: User | null): Promise<{ role: UserRole | null; isOwner: boolean; isApprovedRider: boolean }> => {
    if (!u) {
      return { role: null, isOwner: false, isApprovedRider: false };
    }

    const { data: sub } = await supabase
      .from('subscribers')
      .select('is_owner')
      .eq('user_id', u.id)
      .maybeSingle();

    if (sub?.is_owner) {
      return { role: 'owner', isOwner: true, isApprovedRider: false };
    }

    if (u.user_metadata?.role === 'rider') {
      const { data } = await supabase
        .from('rider_applications')
        .select('approved')
        .eq('user_id', u.id)
        .maybeSingle();

      return {
        role: 'rider',
        isOwner: false,
        isApprovedRider: data?.approved === true || u.user_metadata?.approved === true,
      };
    }

    return { role: 'subscriber', isOwner: false, isApprovedRider: false };
  };

  const applyAuthAccess = async (u: User | null) => {
    const access = await getAuthAccess(u);
    setUserRole(access.role);
    setIsOwner(access.isOwner);
    setIsApprovedRider(access.isApprovedRider);
    return access;
  };

  useEffect(() => {
    let mounted = true;
    // Global safety timeout: ensure loading finishes within 4 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 4000);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      const u = data.session?.user ?? null;
      setUser(u);

      applyAuthAccess(u).finally(() => {
        clearTimeout(safetyTimeout);
        if (mounted) setLoading(false);
      });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const u = newSession?.user ?? null;
      setUser(u);

      applyAuthAccess(u).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? undefined, approved: access.isApprovedRider };
  };

  const signUp = async (email: string, password: string, name?: string, role: UserRole = 'subscriber', phone?: string) => {
    const requestedRole: UserRole = role === 'rider' ? 'rider' : 'subscriber';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: requestedRole,
          phone: phone,
          approved: requestedRole === 'rider' ? false : true,
        }
      },
    });

    if (error) return { error: error.message };

    if (requestedRole === 'rider' && data.user) {
      await supabase.from('rider_applications').insert({
        user_id: data.user.id,
        full_name: name,
        phone: phone,
        email: email,
        approved: false
      });
    }

    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? requestedRole, approved: access.isApprovedRider };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsOwner(false);
    setUserRole(null);
    setIsApprovedRider(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const refreshAuth = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      setUser(u);
      await applyAuthAccess(u);
    }
  };

  const enableBiometric = async () => {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) return false;

      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return false;

      // In a real app, you'd store a secret in the keychain
      // and use it to authenticate with Supabase
      await NativeBiometric.setCredentials({
        server: "triangle-healthy-kitchen",
        username: u.email || "",
        password: "biometric-secured-session",
      });

      return true;
    } catch (e) {
      console.error('Biometric setup failed:', e);
      return false;
    }
  };

  const biometricLogin = async (): Promise<AuthResult> => {
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) return { error: "Biometric not available" };

      await NativeBiometric.verifyIdentity({
        reason: "Login to Triangle Healthy Kitchen",
        title: "Biometric Login",
        description: "Use your fingerprint or face to login",
      });

      const credentials = await NativeBiometric.getCredentials({
        server: "triangle-healthy-kitchen",
      });

      // This is a simplified flow. Ideally you'd use a refresh token or a specific biometric token.
      // For this implementation, we assume the user is already remembered by Supabase
      // or we use the stored credentials if we had a password.
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return { error: "Session expired, please login manually" };

      const access = await applyAuthAccess(data.session.user);
      return { error: null, role: access.role ?? undefined, approved: access.isApprovedRider };
    } catch (e) {
      return { error: "Authentication failed" };
    }
  };

  return (
    <AuthContext.Provider value={{
      session, user, loading, isOwner, userRole, isApprovedRider,
      signIn, signUp, signOut, resetPassword, refreshAuth,
      enableBiometric, biometricLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
