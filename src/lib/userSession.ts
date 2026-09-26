'use client';

import { Address, UserRole, InfluencerProfile } from './types';
import { getSupabaseClient } from './supabase';

export interface UserSession {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  addresses?: Address[];
  // For sellers / artisans
  sellerStallId?: string;
  sellerStallSlug?: string;
  sellerStallName?: string;
  craftSpecialty?: string;
  stateOrigin?: string;
  gemUdyamId?: string;
  upiId?: string;
  // For influencers / creators
  influencerProfile?: InfluencerProfile;
}

const SESSION_STORAGE_KEY = 'tote_real_session_v5';

export async function switchRole(targetRole: UserRole): Promise<{ success: boolean; user?: UserSession }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false };

  const session = await getUserSession();
  if (!session) return { success: false };

  const { data: profile, error } = await supabase
    .from('profiles')
    .update({ role: targetRole })
    .eq('id', session.id)
    .select('*')
    .single();

  if (error || !profile) return { success: false };

  // The database is the source of truth for roles; mirror it into the cached session.
  const updated = await buildUserSession(profile, session.email, profile.email);
  setUserSession(updated);
  return { success: true, user: updated };
}

interface ProfileRow {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  gem_udyam_id?: string | null;
  upi_id?: string | null;
}

interface StallRow {
  id: string;
  name?: string | null;
  slug?: string | null;
  craft_heritage?: string | null;
  state?: string | null;
  location?: string | null;
}

async function buildUserSession(
  profile: ProfileRow,
  fallbackEmail: string,
  authEmail: string
): Promise<UserSession> {
  const supabase = getSupabaseClient();
  const role = (profile.role || 'buyer') as UserRole;

  const base: UserSession = {
    id: profile.id,
    email: authEmail || profile.email || fallbackEmail,
    name: profile.name || 'User',
    role,
    phone: profile.phone || undefined,
    avatar_url: profile.avatar_url || undefined,
  };

  if (!supabase) return base;

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', profile.id)
    .order('is_default', { ascending: false });

  if (addresses?.length) base.addresses = addresses as UserSession['addresses'];

  if (role === 'seller' || role === 'admin') {
    const { data: stall } = await supabase
      .from('stalls')
      .select('id, name, slug, craft_heritage, state, location')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const row = stall as StallRow | null;
    if (row) {
      base.sellerStallId = row.id;
      base.sellerStallSlug = row.slug || undefined;
      base.sellerStallName = row.name || undefined;
      base.craftSpecialty = row.craft_heritage || undefined;
      base.stateOrigin = row.state || row.location || undefined;
    }

    base.gemUdyamId = profile.gem_udyam_id || undefined;
    base.upiId = profile.upi_id || undefined;
  }

  return base;
}

export async function getUserSession(): Promise<UserSession | null> {
  if (typeof window === 'undefined') return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) return null;

  return buildUserSession(profile as ProfileRow, session.user.email || '', session.user.email || '');
}

export function setUserSession(session: UserSession | null): void {
  if (typeof window !== 'undefined') {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    window.dispatchEvent(new Event('tote_session_changed'));
  }
}

export async function registerUser(payload: {
  role: 'buyer' | 'seller' | 'influencer';
  name: string;
  email: string;
  password?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  studioName?: string;
  craftSpecialty?: string;
  stateOrigin?: string;
  gemUdyamId?: string;
  upiId?: string;
  socialHandle?: string;
  socialPlatform?: 'instagram' | 'youtube' | 'lifestyle_blog';
  followerCount?: string;
  contentNiche?: string;
}): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not initialized.' };

  const cleanEmail = payload.email.toLowerCase().trim();
  const cleanName = payload.name.trim();

  if (!cleanName || !cleanEmail) {
    return { success: false, error: 'Full name and email address are required.' };
  }

  if (!payload.password || payload.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const { data, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: payload.password,
    options: {
      data: {
        name: cleanName,
        role: payload.role,
        phone: payload.phone,
      },
    },
  });

  if (authError) return { success: false, error: authError.message };
  if (!data.user) return { success: false, error: 'User creation failed.' };

  // When email confirmation is required, Supabase returns a user but no session.
  // Faking a local session here would leave getUserSession() resolving to null on
  // every later read, so fail loudly and ask the user to confirm first.
  if (!data.session) {
    return {
      success: false,
      error:
        'Account created. Check your inbox to confirm your email address, then sign in.',
    };
  }

  // The handle_new_user() trigger in Supabase handles the profile insertion.
  // Now we handle the role-specific extra data.

  if (payload.role === 'buyer' && payload.street) {
    await supabase.from('addresses').insert({
      user_id: data.user.id,
      street: payload.street,
      city: payload.city,
      state: payload.state,
      postal_code: payload.postalCode,
      is_default: true,
    });
  } else if (payload.role === 'influencer') {
    const handle = payload.socialHandle
      ? payload.socialHandle.startsWith('@')
        ? payload.socialHandle
        : `@${payload.socialHandle}`
      : `@${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    await supabase.from('influencer_profiles').insert({
      user_id: data.user.id,
      handle,
      platform: payload.socialPlatform || 'instagram',
      followers: payload.followerCount || '10K',
      category: payload.contentNiche || 'Sustainable Fashion & Slow Living',
      bio: `Cultural creator promoting authentic Vocal for Local crafts and Atmanirbhar Bharat handlooms.`,
    });
  } else if (payload.role === 'seller') {
    const studio = payload.studioName?.trim() || `${cleanName} Handlooms`;
    const slug = studio.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const { error: stallError } = await supabase.from('stalls').insert({
      user_id: data.user.id,
      name: studio,
      slug: slug,
      craft_heritage: payload.craftSpecialty || 'Traditional Handcrafted Canvas & Khadi Totes',
      location: payload.stateOrigin || 'India',
      // Other fields can be updated later via dashboard
    }).single();

    if (stallError) console.error('Stall creation failed:', stallError);
  }

  const userSession: UserSession = {
    id: data.user.id,
    role: payload.role,
    name: cleanName,
    email: cleanEmail,
    phone: payload.phone,
  };

  setUserSession(userSession);
  return { success: true, user: userSession };
}

export async function loginUser(
  email: string,
  password?: string
): Promise<{ success: boolean; error?: string; user?: UserSession }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase client not initialized.' };

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) return { success: false, error: 'Email address is required.' };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password || '',
  });

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'Login failed.' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (!profile) return { success: false, error: 'User profile not found.' };

  const userSession = await buildUserSession(
    profile as ProfileRow,
    data.user.email || cleanEmail,
    data.user.email || cleanEmail
  );

  setUserSession(userSession);
  return { success: true, user: userSession };
}

export async function logoutSession(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  setUserSession(null);
}
