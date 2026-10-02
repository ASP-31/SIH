import React from 'react';
import Link from 'next/link';
import { PERSONA_CHROME, NavPersona } from './navConfig';

export function NavBrand({ persona }: { persona: NavPersona }) {
  const chrome = PERSONA_CHROME[persona];

  return (
    <Link href={chrome.brandHref} className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 flex items-center justify-center font-serif text-lg font-black border-2 ${chrome.logoClass}`}
      >
        T
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base sm:text-lg font-black tracking-tight uppercase leading-none">
            {chrome.brandTitle}
          </span>
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${chrome.badgeClass}`}>
            {chrome.brandBadge}
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 hidden sm:block">
          {chrome.brandSubtitle}
        </span>
      </div>
    </Link>
  );
}
