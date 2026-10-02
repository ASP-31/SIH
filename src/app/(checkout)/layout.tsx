import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata = {
  title: 'Secure Checkout • Tote',
  robots: { index: false, follow: false },
};

/**
 * Chromeless checkout: no navbar, footer, cart drawer or bottom nav, so the
 * buyer can't wander off mid-transaction. The cart itself lives in the
 * persisted Zustand store, so it needs no drawer to function.
 */
export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-persona="buyer" className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 border-2 border-foreground px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Cart</span>
          </Link>

          <span className="font-mono text-xs font-black uppercase tracking-widest text-muted">
            Tote Secure Checkout
          </span>

          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted">
            <Lock className="h-3 w-3" />
            <span className="hidden sm:inline">Encrypted</span>
          </span>
        </div>
      </header>

      <main className="flex-1 pb-10">{children}</main>
    </div>
  );
}