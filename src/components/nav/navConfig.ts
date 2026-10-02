export type NavPersona = 'buyer' | 'seller' | 'creator' | 'shared';

export interface PersonaChrome {
  /** Main bar background + text classes. */
  barClass: string;
  /**
   * Bottom edge of the main bar. The seller bar is near-black (`#18181B`) and
   * sits on a near-black workbench canvas (`#1C1917`), so without an explicit
   * edge the chrome has no visible boundary. Others rely on the default.
   */
  barBorderClass?: string;
  /** Square logo tile classes. */
  logoClass: string;
  /** Small persona badge classes. */
  badgeClass: string;
  brandTitle: string;
  brandBadge: string;
  brandSubtitle: string;
  brandHref: string;
  bellVariant: 'light' | 'dark';
  /** null hides the search input (seller). */
  searchPlaceholder: string | null;
  /** Prefix the query is appended to, e.g. '/?search='. */
  searchTarget: string | null;
}

export const PERSONA_CHROME: Record<NavPersona, PersonaChrome> = {
  buyer: {
    barClass: 'bg-white text-[#18181B]',
    logoClass: 'bg-[#18181B] text-white border-[#18181B]',
    badgeClass: 'bg-[#F4F4F1] text-[#18181B] border-[#18181B]',
    brandTitle: 'TOTE MARKET',
    brandBadge: 'BUYER MODE',
    brandSubtitle: 'Handcrafted Totes • Direct Vishwakarma Route',
    brandHref: '/',
    bellVariant: 'light',
    searchPlaceholder: 'Search craft, GI-tag...',
    searchTarget: '/?search=',
  },
  seller: {
    barClass: 'bg-[#18181B] text-white',
    barBorderClass: 'border-b-2 border-amber-500/40',
    logoClass: 'bg-amber-400 text-[#18181B] border-amber-400',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-700',
    brandTitle: 'ARTISAN WORKBENCH',
    brandBadge: 'MAKER / B2B',
    brandSubtitle: 'Production Pipeline, GeM & Influencer Collabs',
    brandHref: '/dashboard',
    bellVariant: 'dark',
    searchPlaceholder: null,
    searchTarget: null,
  },
  creator: {
    barClass: 'bg-[#FFF7ED] text-[#18181B]',
    logoClass: 'bg-orange-500 text-white border-[#18181B]',
    badgeClass: 'bg-orange-100 text-orange-950 border-orange-500',
    brandTitle: 'CREATOR STUDIO',
    brandBadge: 'INFLUENCER / REELS',
    brandSubtitle: 'Reel Links, Clicks & Artisan Partnerships',
    brandHref: '/influencer',
    bellVariant: 'light',
    searchPlaceholder: 'Search craft to collab...',
    searchTarget: '/influencer?search=',
  },
  shared: {
    barClass: 'bg-white text-[#18181B]',
    logoClass: 'bg-[#18181B] text-white border-[#18181B]',
    badgeClass: 'bg-[#F4F4F1] text-[#18181B] border-[#18181B]',
    brandTitle: 'TOTE MARKET',
    brandBadge: 'BUYER MODE',
    brandSubtitle: 'Handcrafted Totes • Direct Vishwakarma Route',
    brandHref: '/',
    bellVariant: 'light',
    searchPlaceholder: 'Search craft, GI-tag...',
    searchTarget: '/?search=',
  },
};
