'use client';

import { Address, UserRole, InfluencerProfile } from './types';

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

export interface RegisteredAccount extends UserSession {
  passwordHash: string;
  registeredAt: string;
}

const SESSION_STORAGE_KEY = 'tote_real_session_v5';
const REGISTERED_USERS_KEY = 'tote_registered_accounts_v5';

export function switchRole(targetRole: UserRole): { success: boolean; user?: UserSession } {
  const accounts = getRegisteredAccounts();
  const match = accounts.find((a) => a.role === targetRole);
  if (match) {
    setUserSession(match);
    return { success: true, user: match };
  }
  return { success: false };
}

// Helper for consistent simple hash (sufficient for client-side storage sandbox)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}`;
}

export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRegisteredAccounts(accounts: RegisteredAccount[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  }
}

export function getUserSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
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

export function registerUser(payload: {
  role: 'buyer' | 'seller' | 'influencer';
  name: string;
  email: string;
  password?: string;
  phone?: string;
  // Buyer specifics
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  // Seller specifics
  studioName?: string;
  craftSpecialty?: string;
  stateOrigin?: string;
  gemUdyamId?: string;
  upiId?: string;
  // Influencer specifics
  socialHandle?: string;
  socialPlatform?: 'instagram' | 'youtube' | 'lifestyle_blog';
  followerCount?: string;
  contentNiche?: string;
}): { success: boolean; error?: string; user?: UserSession } {
  const cleanEmail = payload.email.toLowerCase().trim();
  const cleanName = payload.name.trim();

  if (!cleanName || !cleanEmail) {
    return { success: false, error: 'Full name and email address are required.' };
  }

  if (!payload.password || payload.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  const existing = getRegisteredAccounts();
  const duplicate = existing.find((u) => u.email.toLowerCase() === cleanEmail);
  if (duplicate) {
    return {
      success: false,
      error: `An account already exists for ${cleanEmail}. Please sign in instead.`,
    };
  }

  const id = `${payload.role}_${Date.now().toString(36)}`;
  const passwordHash = simpleHash(payload.password);
  let newUser: RegisteredAccount;

  if (payload.role === 'buyer') {
    const address: Address = {
      id: `addr_${Date.now()}`,
      name: cleanName,
      phone: payload.phone || '+91 98000 00000',
      street: payload.street || 'Residence',
      city: payload.city || 'Bengaluru',
      state: payload.state || 'Karnataka',
      postalCode: payload.postalCode || '560001',
      country: 'India',
      isDefault: true,
    };

    newUser = {
      id,
      role: 'buyer',
      name: cleanName,
      email: cleanEmail,
      phone: payload.phone,
      passwordHash,
      addresses: [address],
      registeredAt: new Date().toISOString(),
    };
  } else if (payload.role === 'influencer') {
    const handle = payload.socialHandle
      ? payload.socialHandle.startsWith('@')
        ? payload.socialHandle
        : `@${payload.socialHandle}`
      : `@${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    newUser = {
      id,
      role: 'influencer',
      name: cleanName,
      email: cleanEmail,
      phone: payload.phone,
      passwordHash,
      influencerProfile: {
        id,
        user_id: id,
        name: cleanName,
        handle,
        platform: payload.socialPlatform || 'instagram',
        followers: payload.followerCount || '10K',
        category: payload.contentNiche || 'Sustainable Fashion & Slow Living',
        bio: `Cultural creator promoting authentic Vocal for Local crafts and Atmanirbhar Bharat handlooms.`,
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
        preferred_rate_type: 'commission',
        default_commission_pct: 12,
      },
      registeredAt: new Date().toISOString(),
    };
  } else {
    // Seller / Artisan
    const studio = payload.studioName?.trim() || `${cleanName} Handlooms`;
    const slug = studio.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    newUser = {
      id,
      role: 'seller',
      name: cleanName,
      email: cleanEmail,
      phone: payload.phone,
      passwordHash,
      sellerStallId: `stall_${Date.now().toString(36)}`,
      sellerStallName: studio,
      sellerStallSlug: slug,
      craftSpecialty: payload.craftSpecialty || 'Traditional Handcrafted Canvas & Khadi Totes',
      stateOrigin: payload.stateOrigin || 'India',
      gemUdyamId: payload.gemUdyamId || `UDYAM-${Date.now().toString().slice(-6)}`,
      upiId: payload.upiId || `${slug}@okhdfcbank`,
      registeredAt: new Date().toISOString(),
    };
  }

  saveRegisteredAccounts([...existing, newUser]);
  setUserSession(newUser);
  return { success: true, user: newUser };
}

export function loginUser(
  email: string,
  password?: string
): { success: boolean; error?: string; user?: UserSession } {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, error: 'Email address is required.' };
  }

  const accounts = getRegisteredAccounts();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    return {
      success: false,
      error: 'No account found with this email. Please sign up first.',
    };
  }

  // If password provided, verify hash
  if (password && found.passwordHash) {
    const enteredHash = simpleHash(password);
    if (enteredHash !== found.passwordHash) {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }
  }

  setUserSession(found);
  return { success: true, user: found };
}

export function logoutSession(): void {
  setUserSession(null);
}
