import { useEffect, useRef, useState } from 'react';
import type { UDISpec } from '../core/types';
import { hasExperienceFragment, parseExperienceFragment } from './links';

/** A link opens a review. It never applies a definition or supplies access. */
export function useSharedExperience() {
  const initialFragment = useRef(window.location.hash);
  const [shared, setShared] = useState<UDISpec | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  useEffect(() => {
    let active = true;
    let request = 0;
    async function receive(hash: string) {
      if (!hasExperienceFragment(hash)) return;
      const current = ++request;
      // Remove incoming definitions from the address before asynchronous parsing.
      // The ref survives StrictMode's effect replay, so the first review is retained.
      if (window.location.hash === hash) {
        const clean = new URL(window.location.href); clean.hash = '';
        window.history.replaceState(null, '', clean);
      }
      setInvalidLink(false); setShared(null);
      try {
        const definition = await parseExperienceFragment(hash);
        if (active && current === request) setShared(definition);
      } catch { if (active && current === request) setInvalidLink(true); }
    }
    void receive(initialFragment.current);
    const changed = () => { void receive(window.location.hash); };
    window.addEventListener('hashchange', changed);
    return () => { active = false; window.removeEventListener('hashchange', changed); };
  }, []);
  return { shared, invalidLink, close: () => setShared(null), dismissError: () => setInvalidLink(false) };
}
