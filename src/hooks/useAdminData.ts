import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Profile, Payment, Withdrawal, Package, ActivationPin, Settings } from '../lib/types';

export function useAdminData() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [pins, setPins] = useState<ActivationPin[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) return;
    const [uRes, pRes, wRes, pkgRes, pinRes, sRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, package:packages(*), profile:profiles(email, referral_code)').order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*, profile:profiles(email, referral_code)').order('created_at', { ascending: false }),
      supabase.from('packages').select('*').order('sort_order', { ascending: true }),
      supabase.from('activation_pins').select('*, profile:profiles(email)').order('created_at', { ascending: false }),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    ]);
    setUsers((uRes.data as Profile[]) ?? []);
    setPayments((pRes.data as Payment[]) ?? []);
    setWithdrawals((wRes.data as Withdrawal[]) ?? []);
    setPackages((pkgRes.data as Package[]) ?? []);
    setPins((pinRes.data as ActivationPin[]) ?? []);
    setSettings(sRes.data as Settings);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  return {
    users, payments, withdrawals, packages, pins, settings, loading,
    reload: loadAll,
  };
}
