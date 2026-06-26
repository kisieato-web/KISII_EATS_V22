import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  wallet_balance: number;
  loyalty_points: number;
  loyalty_tier: string;
  is_active: boolean;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    supabase.from('users').select('*').eq('id', userId).single()
      .then(({ data, error }) => {
        if (!error && data) setProfile(data as Profile);
        setLoading(false);
      });

    const channel = supabase.channel('profile-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        setProfile(payload.new as Profile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { profile, loading };
}
