'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/userSession';
import type { UserRole } from '@/lib/types';

interface PersonaGuardProps {
  /** The persona that owns this route group. */
  requiredRole: Extract<UserRole, 'seller' | 'influencer'>;
  children: React.ReactNode;
}

/**
 * Layout-level role guard for the gated persona workspaces.
 *
 * Deliberately narrow: it ONLY redirects when a session exists for the
 * *wrong* role. Unauthenticated visitors are passed straight through to the
 * page's own in-page auth gate (`dashboard/page.tsx`, `influencer/page.tsx`),
 * which renders a friendlier sign-in card instead of a bare redirect.
 */
export function PersonaGuard({ requiredRole, children }: PersonaGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  // Guards against redirect loops and duplicate pushes in React 19 StrictMode.
  const redirected = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const session = await getUserSession();
      if (cancelled) return;

      if (session && session.role !== requiredRole && !redirected.current) {
        redirected.current = true;
        const target = `/login?role=${requiredRole}&redirect=${encodeURIComponent(
          pathname || '/'
        )}`;
        router.replace(target);
      }

      if (!cancelled) setChecking(false);
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [requiredRole, pathname, router]);

  // Hold the first paint until the session resolves, otherwise a wrong-role
  // user briefly sees the private workspace before the redirect lands.
  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          Verifying workspace access...
        </span>
      </div>
    );
  }

  return <>{children}</>;
}