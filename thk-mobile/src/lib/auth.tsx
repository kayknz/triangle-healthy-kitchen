import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { NativeBiometric } from 'capacitor-native-biometric';
import type { THKRole } from '@/types/subscription';
import type { PhoneChannel } from '@/lib/phone-number';

export type UserRole = THKRole;

interface AuthResult {
  error: string | null;
  role?: UserRole;
  approved?: boolean;
  needsVerification?: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isOwner: boolean;
  userRole: UserRole | null;
  isApprovedRider: boolean;
  canEdit: boolean;
  canManageDrivers: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInPhone: (phone: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name?: string, role?: UserRole, phone?: string) => Promise<AuthResult>;
  signUpPhone: (phone: string, password: string, name: string, channel: Exclude<PhoneChannel, 'email'>, contactEmail?: string) => Promise<AuthResult>;
  verifySignupOtp: (identifier: string, code: string, channel: PhoneChannel) => Promise<AuthResult>;
  completePhoneSignup: (phone: string, password: string, name: string) => Promise<AuthResult>;
  sendOtp: (phone: string, purpose?: string) => Promise<{ ok: boolean; message: string }>;
  verifyOtp: (phone: string, code: string, purpose?: string) => Promise<{ ok: boolean; token?: string; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  refreshAuth: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  biometricLogin: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STAFF_EMAIL_MAP: Record<string, { role: UserRole; isOwner: boolean; isApprovedRider: boolean }> = {
  'kevmulgeo@gmail.com': { role: 'ceo', isOwner: true, isApprovedRider: false },
  'issashahid1@gmail.com': { role: 'admin', isOwner: true, isApprovedRider: false },
  'georgekmuliika@gmail.com': { role: 'transport', isOwner: false, isApprovedRider: false },
  'kitchen@trianglehk.com': { role: 'kitchen', isOwner: false, isApprovedRider: false },
  'driver@trianglehk.com': { role: 'driver', isOwner: false, isApprovedRider: true },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isApprovedRider, setIsApprovedRider] = useState(false);

  const canEdit = userRole === 'ceo' || userRole === 'admin' || userRole === 'owner';
  const canManageDrivers = canEdit || userRole === 'transport';

  const getAuthAccess = async (u: User | null): Promise<{ role: UserRole | null; isOwner: boolean; isApprovedRider: boolean }> => {
    if (!u) {
      return { role: null, isOwner: false, isApprovedRider: false };
    }

    try {
      const { data: assignedRole, error: roleError } = await supabase.rpc('current_staff_role');
      if (!roleError && ['ceo', 'admin', 'transport', 'kitchen', 'driver'].includes(String(assignedRole))) {
        const role = assignedRole as UserRole;
        if (role === 'driver') {
          const { data: rider } = await supabase
            .from('rider_applications')
            .select('approved')
            .eq('user_id', u.id)
            .maybeSingle();
          return { role, isOwner: false, isApprovedRider: rider?.approved === true };
        }
        return { role, isOwner: role === 'ceo' || role === 'admin', isApprovedRider: false };
      }

      const email = (u.email || '').toLowerCase().trim();
      const knownStaff = STAFF_EMAIL_MAP[email];
      if (knownStaff && knownStaff.role !== 'driver') return knownStaff;

      const { data: sub } = await supabase
        .from('subscribers')
        .select('is_owner')
        .eq('user_id', u.id)
        .maybeSingle();

      if (sub?.is_owner) {
        return { role: 'ceo', isOwner: true, isApprovedRider: false };
      }

      const { data: rider } = await supabase
          .from('rider_applications')
          .select('approved')
          .eq('user_id', u.id)
          .maybeSingle();
      if (rider || knownStaff?.role === 'driver') {
        return {
          role: 'driver',
          isOwner: false,
          isApprovedRider: rider?.approved === true,
        };
      }
    } catch (err) {
      console.warn('Metadata fetch warning:', err);
    }

    return { role: 'customer', isOwner: false, isApprovedRider: false };
  };

  const applyAuthAccess = async (u: User | null) => {
    try {
      const access = await getAuthAccess(u);
      setUserRole(access.role);
      setIsOwner(access.isOwner);
      setIsApprovedRider(access.isApprovedRider);
      return access;
    } catch (e) {
      setUserRole('customer');
      setIsOwner(false);
      setIsApprovedRider(false);
      return { role: 'customer' as UserRole, isOwner: false, isApprovedRider: false };
    }
  };

  useEffect(() => {
    let mounted = true;
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 1000);

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

  const sendOtp = async (phone: string, _purpose: string = 'registration') => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return error
      ? { ok: false, message: error.message }
      : { ok: true, message: 'Verification code sent.' };
  };

  const verifyOtp = async (phone: string, code: string, _purpose: string = 'registration') => {
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
    return error
      ? { ok: false, error: error.message }
      : { ok: true, token: data.session?.access_token };
  };

  const signUp = async (email: string, password: string, name?: string, role: UserRole = 'customer', phone?: string): Promise<AuthResult> => {
    const requestedRole: UserRole = role;
    if (['ceo', 'admin', 'kitchen', 'transport', 'owner'].includes(requestedRole)) {
      return { error: 'Staff accounts must be provisioned by a company administrator.' };
    }
    if (!email) return { error: 'Enter a valid email address.' };
    const targetEmail = email;

    const { data, error } = await supabase.auth.signUp({
      email: targetEmail,
      password,
      options: {
        data: {
          full_name: name,
          role: requestedRole,
          phone: phone,
          approved: false,
        }
      },
    });

    if (error) return { error: error.message };

    if (requestedRole === 'driver' && data.user) {
      try {
        await supabase.from('rider_applications').insert({
          user_id: data.user.id,
          full_name: name,
          phone: phone,
          email: targetEmail,
          approved: false
        });
      } catch (e) {}
    }

    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? requestedRole, approved: access.isApprovedRider, needsVerification: !data.session };
  };

  const signUpPhone = async (phone: string, password: string, name: string, channel: Exclude<PhoneChannel, 'email'>, contactEmail?: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        channel,
        data: { full_name: name, phone, role: 'customer', approved: false, contact_email: contactEmail },
      },
    });
    if (error) return { error: error.message };
    if (data.session) {
      const access = await applyAuthAccess(data.user);
      return { error: null, role: access.role ?? 'customer', approved: access.isApprovedRider, needsVerification: false };
    }
    return { error: null, role: 'customer', needsVerification: true };
  };

  const verifySignupOtp = async (identifier: string, code: string, channel: PhoneChannel): Promise<AuthResult> => {
    const { data, error } = channel === 'email'
      ? await supabase.auth.verifyOtp({ email: identifier, token: code, type: 'signup' })
      : await supabase.auth.verifyOtp({ phone: identifier, token: code, type: 'sms' });
    if (error) return { error: error.message };
    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? 'customer', approved: access.isApprovedRider };
  };


  const completePhoneSignup = async (phone: string, password: string, name: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.updateUser({
      password,
      data: { full_name: name, phone, role: 'customer', approved: false },
    });
    if (error) return { error: error.message };
    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? 'customer', approved: access.isApprovedRider };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: error.message };

    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? undefined, approved: access.isApprovedRider };
  };

  const signInPhone = async (phone: string, password: string) => {
    let { data, error } = await supabase.auth.signInWithPassword({ phone, password });
    if (error && error.message.toLowerCase().includes('invalid login credentials')) {
      const legacyEmail = `${phone.replace(/\+/g, '')}@thk.internal`;
      const legacyResult = await supabase.auth.signInWithPassword({ email: legacyEmail, password });
      data = legacyResult.data;
      error = legacyResult.error;
    }
    if (error) return { error: error.message };

    const access = await applyAuthAccess(data.user);
    return { error: null, role: access.role ?? undefined, approved: access.isApprovedRider };
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
      session, user, loading, isOwner, userRole, isApprovedRider, canEdit, canManageDrivers,
      signIn, signInPhone, signUp, signUpPhone, verifySignupOtp, completePhoneSignup, sendOtp, verifyOtp, signOut, resetPassword, refreshAuth,
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
