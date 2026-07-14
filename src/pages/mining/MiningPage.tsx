import { useState } from 'react';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { DashboardNavbar } from '../../components/Navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useMiningData } from '../../hooks/useMiningData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatFull, formatUsd } from '../../lib/utils';
import { FreeMiningCard } from '../../components/mining/FreeMiningCard';
import { PaidMiningCard } from '../../components/mining/PaidMiningCard';
import { PaymentModal } from './PaymentModal';
import { PinActivationModal } from './PinActivationModal';
import type { Package } from '../../lib/types';

export function MiningPage() {
  const { profile } = useAuth();
  const { packages, userPackages, settings, loading, reload } = useMiningData();
  const { toast } = useToast();
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const paidPkgs = packages.filter((p) => !p.is_free && p.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const hasPending = userPackages.some((up) => up.status === 'pending');

  const handleBuyPackage = (pkg: Package) => {
    if (!profile) return;
    supabase.from('user_packages').insert({
      user_id: profile.id, package_id: pkg.id, status: 'pending', daily_reward: 0, mining_speed: '',
    }).then(({ error }) => {
      if (error) { toast('error', error.message); return; }
      setSelectedPkg(pkg);
      reload();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mining</h1>
            <p className="text-sm text-muted">Start free mining or activate a premium package</p>
          </div>
          {hasPending && (
            <Button variant="gold" size="sm" onClick={() => setPinModalOpen(true)}>
              <KeyRound className="h-4 w-4" /> Enter PIN
            </Button>
          )}
        </div>

        {/* Free mining */}
        <FreeMiningCard settings={settings} />

        {/* Active package mining */}
        {userPackages.filter((up) => up.status === 'active').length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Your Active Mining Packages</h2>
            <div className="grid md:grid-cols-2 gap-5">
              {userPackages.filter((up) => up.status === 'active').map((up) => (
                <PaidMiningCard key={up.id} userPackage={up} onClaimed={reload} />
              ))}
            </div>
          </div>
        )}

        {/* Paid packages */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Premium Mining Packages</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paidPkgs.map((pkg) => {
              const userOwns = userPackages.some((up) => up.package_id === pkg.id && (up.status === 'active' || up.status === 'pending'));
              return (
                <Card key={pkg.id} hover className="p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    {pkg.sort_order === 2 && <Badge variant="success">Popular</Badge>}
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{formatUsd(pkg.price_usdt)}</p>
                  <p className="text-xs text-muted mb-4">USDT TRC-20</p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-bg-elevated rounded-lg p-2.5">
                      <p className="text-xs text-muted">Daily Reward</p>
                      <p className="text-sm font-bold text-brand-400 font-mono">{formatNumber(pkg.daily_reward)}</p>
                    </div>
                    <div className="bg-bg-elevated rounded-lg p-2.5">
                      <p className="text-xs text-muted">Speed</p>
                      <p className="text-sm font-bold text-white font-mono">{pkg.mining_speed}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-5 text-sm text-gray-300">
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" /> {formatFull(pkg.daily_reward)} CRS / day</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" /> {pkg.duration_days} days duration</p>
                    <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-400" /> Referral bonus unlocked</p>
                  </div>

                  {userOwns ? (
                    <Button variant="ghost" className="w-full mt-auto" disabled>
                      <CheckCircle2 className="h-4 w-4" /> Owned
                    </Button>
                  ) : (
                    <Button variant="gold" className="w-full mt-auto" onClick={() => handleBuyPackage(pkg)}>
                      Activate with USDT
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <PaymentModal open={!!selectedPkg} onClose={() => setSelectedPkg(null)} pkg={selectedPkg} settings={settings} />
      <PinActivationModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />
    </div>
  );
}
