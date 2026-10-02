import { PersonaShell } from '@/components/PersonaShell';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <PersonaShell persona="shared">{children}</PersonaShell>;
}
