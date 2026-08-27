import { UserProfile } from '../types/store';
import { supabase } from './supabase';

export interface SupabaseAuthResult {
  success: boolean;
  message?: string;
  error?: string;
  session?: any;
  user?: any;
  userProfile?: UserProfile;
}

/**
 * Clean and format Indian / International mobile numbers for Supabase Auth (e.g. +919603344954)
 */
export function formatPhoneForSupabase(phoneRaw: string): string {
  const digits = phoneRaw.replace(/\D/g, '');
  if (phoneRaw.startsWith('+')) {
    return phoneRaw.replace(/\s+/g, '');
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
}

/**
 * 1. Request OTP via Supabase Auth (Phone SMS or Email magic OTP)
 */
export async function sendSupabaseOtp(
  identifier: string,
  channel: 'phone' | 'email' = 'phone'
): Promise<SupabaseAuthResult> {
  console.log(`[Supabase Auth] Requesting OTP via ${channel} for:`, identifier);

  try {
    if (channel === 'email') {
      const email = identifier.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        console.error('[Supabase Auth] Email OTP Error:', error);
        // Fallback to backend mailer if Supabase SMTP is unconfigured
        const backupRes = await fetch('/api/customer/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }).then((r) => r.json()).catch(() => null);

        if (backupRes?.success) {
          return { success: true, message: `OTP code sent to ${email}` };
        }
        return { success: false, error: error.message };
      }

      console.log('[Supabase Auth] Email OTP requested successfully:', data);
      return { success: true, message: `Verification code sent to ${email}` };
    } else {
      const formattedPhone = formatPhoneForSupabase(identifier);
      if (!formattedPhone || formattedPhone.length < 12) {
        return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      });

      if (error) {
        console.warn('[Supabase Auth] Phone OTP provider warning:', error.message);
        // Try backend SMS gateway dispatch fallback
        const backupRes = await fetch('/api/customer/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formattedPhone.replace(/\D/g, '').slice(-10) }),
        }).then((r) => r.json()).catch(() => null);

        if (backupRes?.success) {
          return { success: true, message: `OTP SMS dispatched to ${formattedPhone}` };
        }
        return { success: false, error: error.message };
      }

      console.log('[Supabase Auth] Phone OTP dispatched successfully:', data);
      return { success: true, message: `Verification code sent to ${formattedPhone}` };
    }
  } catch (err: any) {
    console.error('[Supabase Auth] Unexpected sendOtp failure:', err);
    return { success: false, error: err?.message || 'Network error while requesting OTP' };
  }
}

/**
 * 2. Verify OTP code with Supabase Auth
 */
export async function verifySupabaseOtp(
  identifier: string,
  token: string,
  channel: 'phone' | 'email' = 'phone',
  profileMetadata?: { name?: string; address?: string; city?: string }
): Promise<SupabaseAuthResult> {
  console.log(`[Supabase Auth] Verifying OTP for ${channel}:`, identifier, 'token length:', token.length);

  try {
    let authUser: any = null;
    let authSession: any = null;

    if (channel === 'email') {
      const email = identifier.trim().toLowerCase();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: 'email',
      });

      if (error) {
        console.warn('[Supabase Auth] Email OTP verification error:', error);
        // Fallback backend check
        const backupVerify = await fetch('/api/customer/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: token.trim(), name: profileMetadata?.name }),
        }).then((r) => r.json()).catch(() => null);

        if (backupVerify?.success && backupVerify.customer) {
          const profile: UserProfile = {
            id: backupVerify.customer.id,
            name: backupVerify.customer.name,
            email: backupVerify.customer.email,
            phone: backupVerify.customer.phone,
            address: backupVerify.customer.address,
            city: backupVerify.customer.city,
            country: 'India',
          };
          return { success: true, userProfile: profile };
        }
        return { success: false, error: error.message || 'Invalid or expired OTP code.' };
      }

      authUser = data.user;
      authSession = data.session;
    } else {
      const formattedPhone = formatPhoneForSupabase(identifier);
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: 'sms',
      });

      if (error) {
        console.warn('[Supabase Auth] Phone OTP verification error:', error);
        // Fallback backend verification
        const raw10Digits = formattedPhone.replace(/\D/g, '').slice(-10);
        const backupVerify = await fetch('/api/customer/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: raw10Digits,
            otp: token.trim(),
            name: profileMetadata?.name,
            address: profileMetadata?.address,
            city: profileMetadata?.city,
          }),
        }).then((r) => r.json()).catch(() => null);

        if (backupVerify?.success && backupVerify.customer) {
          const profile: UserProfile = {
            id: backupVerify.customer.id,
            name: backupVerify.customer.name,
            email: backupVerify.customer.email || `${raw10Digits}@anfaprintwear.in`,
            phone: backupVerify.customer.phone,
            address: backupVerify.customer.address,
            city: backupVerify.customer.city,
            country: 'India',
          };
          return { success: true, userProfile: profile };
        }
        return { success: false, error: error.message || 'Invalid or expired OTP code.' };
      }

      authUser = data.user;
      authSession = data.session;
    }

    if (!authUser) {
      return { success: false, error: 'Authentication could not be completed.' };
    }

    const userId = authUser.id;
    const userEmail = authUser.email || (channel === 'email' ? identifier : '');
    const userPhone = authUser.phone || (channel === 'phone' ? identifier : '');
    const rawPhoneDigits = userPhone.replace(/\D/g, '').slice(-10);

    // Sync or retrieve user profile in public.profiles and public.customers
    let userProfile: UserProfile = {
      id: userId,
      name: profileMetadata?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || `Customer ${rawPhoneDigits || 'User'}`,
      email: userEmail || `${rawPhoneDigits || userId}@anfaprintwear.in`,
      phone: rawPhoneDigits || userPhone,
      address: profileMetadata?.address || 'Nilofar complex, main road, cloth market',
      city: profileMetadata?.city || 'Bhainsa, Telangana, 504103',
      country: 'India',
    };

    // Upsert into profiles table
    try {
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userProfile.email,
          phone: userProfile.phone,
          full_name: userProfile.name,
          address: userProfile.address,
          city: userProfile.city,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (profData && !profErr) {
        userProfile.name = profData.full_name || userProfile.name;
        userProfile.address = profData.address || userProfile.address;
        userProfile.city = profData.city || userProfile.city;
      }
    } catch (e) {
      console.warn('[Supabase Auth] profiles upsert note:', e);
    }

    // Also persist in public.customers
    try {
      await supabase.from('customers').upsert({
        id: userId,
        phone: userProfile.phone,
        email: userProfile.email,
        name: userProfile.name,
        address: userProfile.address,
        city: userProfile.city,
        country: 'India',
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Supabase Auth] customers upsert note:', e);
    }

    console.log('[Supabase Auth] User authenticated successfully:', userProfile);
    return {
      success: true,
      session: authSession,
      user: authUser,
      userProfile,
    };
  } catch (err: any) {
    console.error('[Supabase Auth] Verification exception:', err);
    return { success: false, error: err?.message || 'Verification failed. Please try again.' };
  }
}

/**
 * 3. Log Out Current Supabase User
 */
export async function signOutSupabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * 4. Global Auth State Listener
 */
export function setupSupabaseAuthListener(
  onUserAuthenticated: (profile: UserProfile | null) => void
): () => void {
  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Supabase Auth State Change]', event, session?.user?.email || session?.user?.phone || 'No User');

    if (session?.user) {
      const u = session.user;
      const rawPhone = (u.phone || '').replace(/\D/g, '').slice(-10);

      let profile: UserProfile = {
        id: u.id,
        name: u.user_metadata?.full_name || u.user_metadata?.name || (rawPhone ? `Customer ${rawPhone}` : 'Valued Customer'),
        email: u.email || `${rawPhone || u.id}@anfaprintwear.in`,
        phone: rawPhone || u.phone,
        address: 'Nilofar complex, main road, cloth market',
        city: 'Bhainsa, Telangana, 504103',
        country: 'India',
      };

      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        if (dbProfile) {
          profile = {
            ...profile,
            name: dbProfile.full_name || dbProfile.name || profile.name,
            address: dbProfile.address || profile.address,
            city: dbProfile.city || profile.city,
          };
        }
      } catch (e) {
        // use fallback
      }

      onUserAuthenticated(profile);
    } else if (event === 'SIGNED_OUT') {
      onUserAuthenticated(null);
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}
