import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type StaffRole = 'ceo' | 'admin' | 'kitchen' | 'transport';
export type UserRole = StaffRole | 'owner' | 'rider' | 'subscriber';

// Role detection is now handled via database flags and metadata
export type AccessMode = 'work' | 'personal';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRole: UserRole | null;
  staffRole: StaffRole | null;
  isOwner: boolean;
  isApprovedRider: boolean;
  onboardingComplete: boolean;
  accessMode: AccessMode | null;
  setAccessMode: (mode: AccessMode) => void;
  hasDualAccess: boolean;
  signIn: (email: string, password: string, role?: UserRole) => Promise<{ error: string | null; role?: UserRole; dual?: boolean }>;
  signUp: (email: string, password: string, role: UserRole, name?: string, phone?: string) => Promise<{ error: string | null; role?: UserRole }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const normalizeAuthError = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes('invalid api key') || lower.includes('api key') || lower.includes('missing supabase') || lower.includes('required')) {
    return 'Unauthorized';
  }
  return message;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isApprovedRider, setIsApprovedRider] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [accessMode, setAccessModeState] = useState<AccessMode | null>(null);
  const [hasDualAccess, setHasDualAccess] = useState(false);

  const setAccessMode = (mode: AccessMode) => {
    setAccessModeState(mode);
    localStorage.setItem('thk_access_mode', mode);
  };

  const getAuthAccess = async (u: User | null): Promise<{ role: UserRole | null; staffRole: StaffRole | null; isOwner: boolean; isApprovedRider: boolean; hasPersonal: boolean; onboardingCompleted: boolean }> => {
    if (!u) return { role: null, staffRole: null, isOwner: false, isApprovedRider: false, hasPersonal: false, onboardingCompleted: false };

    const { data: assignedRole, error: roleError } = await supabase.rpc('current_staff_role');
    const validStaffRoles: StaffRole[] = ['ceo', 'admin', 'kitchen', 'transport'];
    const staffRole = !roleError && validStaffRoles.includes(assignedRole as StaffRole)
      ? assignedRole as StaffRole
      : null;

    // 1. Check for personal subscription status
    const { data: sub } = await supabase
      .from('subscribers')
      .select('id, is_owner, onboarding_completed')
      .eq('user_id', u.id)
      .maybeSingle();

    const hasPersonal = !!sub;
    const owner = sub?.is_owner === true;
    const onboardingCompleted = sub?.onboarding_completed === true;

    if (staffRole) {
      return {
        role: staffRole,
        staffRole,
        isOwner: staffRole === 'ceo' || staffRole === 'admin',
        isApprovedRider: false,
        hasPersonal,
        onboardingCompleted
      };
    }

    // 2. Resolve Owner Status
    if (owner) {
      return { role: 'owner', staffRole: null, isOwner: true, isApprovedRider: false, hasPersonal: true, onboardingCompleted };
    }

    // 3. Resolve Rider Status (Check rider_applications table)
    const { data: riderApp } = await supabase
      .from('rider_applications')
      .select('approved')
      .eq('user_id', u.id)
      .maybeSingle();

    if (riderApp) {
      return {
        role: 'rider',
        staffRole: null,
        isOwner: false,
        isApprovedRider: riderApp.approved === true,
        hasPersonal,
        onboardingCompleted
      };
    }

    // 4. Default to Subscriber
    return { role: 'subscriber', staffRole: null, isOwner: false, isApprovedRider: false, hasPersonal: true, onboardingCompleted };
  };

  const applyAuthAccess = async (u: User | null) => {
    const access = await getAuthAccess(u);
    setUserRole(access.role);
    setStaffRole(access.staffRole);
    setIsOwner(access.isOwner);
    setIsApprovedRider(access.isApprovedRider);
    setOnboardingComplete(access.onboardingCompleted);

    const dual = (access.isOwner || access.role === 'rider') && access.hasPersonal;
    setHasDualAccess(dual);

    if (u) {
      const savedMode = localStorage.getItem('thk_access_mode') as AccessMode;
      // FIX: If they have dual access, don't default a mode. Let the selector show.
      if (dual && !savedMode) {
        setAccessModeState(null);
      } else {
        setAccessModeState(savedMode || (access.isOwner || access.role === 'rider' ? 'work' : 'personal'));
      }
    } else {
      setAccessModeState(null);
    }

    return { ...access, dual };
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      applyAuthAccess(session?.user ?? null).finally(() => setLoading(false));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      applyAuthAccess(session?.user ?? null).finally(() => setLoading(false));
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, role?: UserRole): Promise<{ error: string | null; role?: UserRole; dual?: boolean }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: normalizeAuthError(error.message) };
    }

    const access = await applyAuthAccess(data.user);
    // The database role is authoritative. The optional role only identifies the
    // sign-in panel and must never elevate the account's permissions.
    const resolvedRole = access.role ?? 'subscriber';

    return { error: null, role: resolvedRole, dual: access.dual };
  };

  const signUp = async (email: string, password: string, role: UserRole, name?: string, phone?: string) => {
    if (role !== 'subscriber' && role !== 'rider') return { error: 'Staff registration is restricted.' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          approved: role !== 'rider',
          full_name: name,
          phone: phone
        }
      }
    });

    if (error) return { error: normalizeAuthError(error.message) };

    if (data.user && role === 'rider') {
      await supabase.from('rider_applications').upsert({
        user_id: data.user.id,
        email: email,
        full_name: name || 'New Rider',
        phone: phone || null,
        approved: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    }

    await applyAuthAccess(data.user);
    return { error: null, role: role };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = '/login';
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?password-recovery=1`,
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

  return (
    <AuthContext.Provider value={{
      session, user, loading, userRole, staffRole, isOwner, isApprovedRider, onboardingComplete,
      accessMode, setAccessMode: (m) => { setAccessModeState(m); localStorage.setItem('thk_access_mode', m); },
      hasDualAccess,
      signIn, signUp, signOut, resetPassword, refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
