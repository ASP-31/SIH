import React from 'react';
import { Footer } from '@/components/Footer';
import { CartDrawer } from '@/components/CartDrawer';
import { QuickViewModal } from '@/components/QuickViewModal';
import { PersonaNavbar } from '@/components/nav/PersonaNavbar';
import { PersonaBottomNav } from '@/components/nav/PersonaBottomNav';

export type Persona = 'buyer' | 'seller' | 'creator' | 'shared';

interface PersonaShellProps {
  persona: Persona;
  children: React.ReactNode;
  /** Market-only chrome: footer + cart drawer + quick view modal. */
  withMarketChrome?: boolean;
}

/**
 * Per-persona application chrome. `data-persona` scopes the CSS token
 * overrides in globals.css, so every token-based class (bg-background,
 * bg-card, text-foreground, border-border, ...) re-themes per mode.
 * Navigation is route-driven: each group owns its nav variant.
 */
export function PersonaShell({ persona, children, withMarketChrome = false }: PersonaShellProps) {
  return (
    <div
      data-persona={persona}
      className="flex min-h-full flex-1 flex-col bg-background text-foreground"
    >
      <PersonaNavbar persona={persona} />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {withMarketChrome && <Footer />}
      {withMarketChrome && <CartDrawer />}
      {withMarketChrome && <QuickViewModal />}
      <PersonaBottomNav persona={persona} />
    </div>
  );
}
