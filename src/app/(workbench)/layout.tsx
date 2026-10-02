import type { Viewport } from 'next';
import { PersonaShell } from '@/components/PersonaShell';
import { PersonaGuard } from '@/components/PersonaGuard';

export const metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#1C1917',
};

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaShell persona="seller">
      <PersonaGuard requiredRole="seller">{children}</PersonaGuard>
    </PersonaShell>
  );
}