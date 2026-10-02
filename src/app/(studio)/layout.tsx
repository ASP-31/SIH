import type { Viewport } from 'next';
import { PersonaShell } from '@/components/PersonaShell';
import { PersonaGuard } from '@/components/PersonaGuard';

export const metadata = {
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#FFF7ED',
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaShell persona="creator">
      <PersonaGuard requiredRole="influencer">{children}</PersonaGuard>
    </PersonaShell>
  );
}