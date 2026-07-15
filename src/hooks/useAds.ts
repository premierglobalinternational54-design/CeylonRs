import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Advertisement, AdPosition } from '../lib/types';

export function useAds() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAds = useCallback(async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('ads load error', error);
      setAds([]);
    } else {
      setAds((data as Advertisement[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAds(); }, [loadAds]);

  const getAd = useCallback((position: AdPosition): Advertisement | null => {
    return ads.find((a) => a.position === position) ?? null;
  }, [ads]);

  return { ads, loading, getAd, reload: loadAds };
}
