import { useAds } from '../hooks/useAds';
import { SponsorCard } from './SponsorCard';
import type { AdPosition } from '../lib/types';

/**
 * Renders a SponsorCard for the given ad position, wrapped in a container
 * with the site's standard max-width and padding. Returns null if no active
 * ad exists for that position — so pages can embed <AdSlot position="top" />
 * without worrying about layout shifts when no ad is configured.
 */
export function AdSlot({ position }: { position: AdPosition }) {
  const { getAd, loading } = useAds();
  const ad = getAd(position);
  if (loading || !ad) return null;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
      <SponsorCard ad={ad} />
    </div>
  );
}
