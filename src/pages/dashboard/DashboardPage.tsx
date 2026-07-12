import { useMemo, useState } from 'react';
import {
  Wallet, Cpu, TrendingUp, Gift, Coins, Activity, ArrowRight, KeyRound,
} from 'lucide-react';
import { DashboardNavbar } from '../../components/Navigation';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MiniBarChart } from '../../components/Charts';
import { useMiningData } from '../../hooks/useMiningData';
import { useAuth } from '../../context/AuthContext';
import {
  formatNumber, formatFull, timeAgo, classNames,
} from '../../lib/utils';
import { FreeMiningCard } from '../../components/mining/FreeMiningCard';
import { PinActivationModal } from '../mining/PinActivationModal';

export function DashboardPage() {
  const { profile } = useAuth();
  const { claims, userPackages, activePackage, settings, loading } = useMiningData();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const dailyFreeLimit = settings?.free_mining_limit ?? 1000;

  const chartData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dStr = d.toISOString().slice(0, 10);
      const total = claims.filter((c) => c.created_at.slice(0, 10) === dStr).reduce((s, c) => s + c.amount, 0);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2), value: Math.round(total) });
    }
    return days;
  }, [claims]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const dailyRate = activePackage?.daily_reward ?? dailyFreeLimit;

  return (
    <div className="min-h-screen pb-20">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-muted">Welcome back, {profile?.email}</p>
          </div>
          {userPackages.some((up) => up.status === 'pending') && (
            <Button variant="gold" size="sm" onClick={() => setPinModalOpen(true)}>
              <KeyRound className="h-4 w-4" /> Activate Package
            </Button>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Wallet Balance" value={formatFull(profile?.wallet_balance ?? 0)} sub="CeylonRS tokens"
            icon={<Wallet className="h-5 w-5" />} accent="brand" />
          <StatCard label="Total Mined" value={formatNumber(profile?.total_mined ?? 0)} sub="All-time"
            icon={<Coins className="h-5 w-5" />} accent="gold" />
          <StatCard label="Referral Earnings" value={formatNumber(profile?.referral_earnings ?? 0)} sub="From referrals"
            icon={<Gift className="h-5 w-5" />} accent="blue" />
          <StatCard label="Daily Rate" value={formatNumber(dailyRate)} sub="CRS / day"
            icon={<TrendingUp className="h-5 w-5" />} accent="brand" />
        </div>

        {/* Mining card + chart */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FreeMiningCard settings={settings} />
          </div>

          {/* Chart card */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">7-Day Claims</h2>
            </div>
            <MiniBarChart data={chartData} />
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted">Total claims this week</p>
              <p className="text-xl font-bold text-white font-mono">
                {formatFull(chartData.reduce((s, d) => s + d.value, 0))} CRS
              </p>
            </div>
          </Card>
        </div>

        {/* Active packages + recent claims */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">My Packages</h2>
            {userPackages.length === 0 ? (
              <div className="text-center py-8">
                <Cpu className="h-10 w-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted mb-4">No active packages yet</p>
                <Button size="sm" onClick={() => (window.location.href = '/mining')}>
                  Browse Packages <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userPackages.map((up) => (
                  <div key={up.id} className="flex items-center justify-between bg-bg-elevated rounded-xl p-3">
                    <div>
                      <p className="font-semibold text-white text-sm">{up.package?.name}</p>
                      <p className="text-xs text-muted">{formatNumber(up.daily_reward)} CRS/day</p>
                    </div>
                    <Badge variant={up.status === 'active' ? 'success' : up.status === 'pending' ? 'pending' : 'danger'}>
                      {up.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Claims</h2>
            {claims.length === 0 ? (
              <div className="text-center py-8">
                <Coins className="h-10 w-10 text-muted mx-auto mb-3" />
                <p className="text-sm text-muted">No claims yet. Start mining!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {claims.slice(0, 8).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-2 border-b border-border-subtle last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={classNames(
                        'h-2 w-2 rounded-full',
                        c.source === 'free' ? 'bg-brand-400' : 'bg-gold-400',
                      )} />
                      <span className="text-muted capitalize">{c.source}</span>
                    </div>
                    <span className="text-white font-mono font-semibold">+{formatFull(c.amount)}</span>
                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <PinActivationModal open={pinModalOpen} onClose={() => setPinModalOpen(false)} />
    </div>
  );
}
