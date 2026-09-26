'use client';

import { useEffect, useState } from 'react';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import { getSupabaseClient } from '@/lib/supabase';

export default function NotificationListener() {
  const initialise = useNotificationStore((s) => s.initialise);
  const teardown = useNotificationStore((s) => s.teardown);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUserId(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (userId) {
      initialise(userId);
    } else {
      teardown();
    }
  }, [userId, initialise, teardown]);

  useEffect(() => () => teardown(), [teardown]);

  return null;
}
