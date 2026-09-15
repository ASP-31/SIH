'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UseInstagramBrowserResult {
  isIAB: boolean;
  browserName: 'Instagram' | 'Facebook' | 'Normal';
  isSimulated: boolean;
  toggleSimulatedIAB: () => void;
}

/**
 * Custom hook to detect Meta (Instagram, FB) In-App Browsers (IAB)
 * where direct upi:// deep links are blocked by embedded WebViews.
 * Uses useEffect to prevent SSR/client hydration mismatches.
 */
export function useInstagramBrowser(): UseInstagramBrowserResult {
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
  const [isIAB, setIsIAB] = useState<boolean>(false);
  const [browserName, setBrowserName] = useState<'Instagram' | 'Facebook' | 'Normal'>('Normal');

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored =
        sessionStorage.getItem('simulated_instagram_iab') === 'true';
      setIsSimulated(stored);

      const ua = navigator.userAgent || navigator.vendor || '';
      const isInsta = ua.includes('Instagram');
      const isFB =
        ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('FB_IAB');

      if (stored || isInsta) {
        setIsIAB(true);
        setBrowserName('Instagram');
      } else if (isFB) {
        setIsIAB(true);
        setBrowserName('Facebook');
      } else {
        setIsIAB(false);
        setBrowserName('Normal');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleSimulatedIAB = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsSimulated((prev) => {
      const nextVal = !prev;
      sessionStorage.setItem('simulated_instagram_iab', String(nextVal));
      setIsIAB(nextVal);
      setBrowserName(nextVal ? 'Instagram' : 'Normal');
      return nextVal;
    });
  }, []);

  return {
    isIAB,
    browserName,
    isSimulated,
    toggleSimulatedIAB,
  };
}
