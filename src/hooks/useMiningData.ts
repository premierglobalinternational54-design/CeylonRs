import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Claim, UserPackage, Package, Settings } from '../lib/types';

export function useMiningData() {
  const { user, profile, refreshProfile } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [claimsRes, upRes, pkgRes, setRes] = await Promise.all([
      supabase.from('claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('user_packages').select('*, package:packages(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('packages').select('*').order('sort_order', { ascending: true }),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setClaims((claimsRes.data as Claim[]) ?? []);
    setUserPackages((upRes.data as UserPackage[]) ?? []);
    setPackages((pkgRes.data as Package[]) ?? []);
    setSettings(setRes.data as Settings);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const activePackage = userPackages.find((up) => up.status === 'active');
  const pendingPackages = userPackages.filter((up) => up.status === 'pending');

  return {
    claims, userPackages, packages, settings, loading,
    activePackage, pendingPackages,
    profile, refreshProfile, reload: loadAll,
  };
}

export function useCountdown(target: string | null, intervalMs: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!target) { setRemaining(0); return; }
    const calc = () => {
      const next = new Date(target).getTime() + intervalMs;
      setRemaining(Math.max(0, next - Date.now()));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target, intervalMs]);

  return remaining;
}
