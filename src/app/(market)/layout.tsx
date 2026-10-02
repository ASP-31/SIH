import type { Metadata } from 'next';
import { PersonaShell } from '@/components/PersonaShell';

const TITLE = 'Tote • AI-Driven Market Linkage & Smart Cataloging for Marginalized Artisans';
const DESCRIPTION =
  'An AI-powered virtual business manager empowering marginalized artisans and weavers with AI Studio photo enhancement, multilingual voice auto-cataloging, dynamic fair pricing, and year-round market linkages (B2B, GeM & ONDC). Ministry of Social Justice and Empowerment (MoSJE) initiative.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: 'Tote',
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <PersonaShell persona="buyer" withMarketChrome>
      {children}
    </PersonaShell>
  );
}