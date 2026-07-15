import { useCallback, useEffect, useState } from 'react';
import { Users, UserCheck, Gift, Copy, Check, Link2, Share2 } from 'lucide-react';
import { DashboardNavbar } from '../../components/Navigation';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatDate } from '../../lib/utils';
import { AdSlot } from '../../components/AdSlot';
import type { Referral } from '../../lib/types';

export function ReferralPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  void loading;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('referrals')
      .select('*, referred:profiles!referrals_referred_id_fkey(email, referral_code)')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });
    setReferrals((data as Referral[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code ?? ''}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast('success', 'Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(profile?.referral_code ?? '');
    toast('success', 'Referral code copied!');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CeylonRS', text: 'Join me on CeylonRS and start mining!', url: referralLink });
      } catch { /* user cancelled */ }
    } else {
      copyLink();
    }
  };

  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === 'activated').length;
  const totalRewards = referrals.reduce((s, r) => s + r.reward_amount, 0);

  return (
    <div className="min-h-screen pb-20">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Referrals</h1>
          <p className="text-sm text-muted">Invite friends and earn CeylonRS when they activate a paid package</p>
        </div>

        {/* Referral link card */}
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/10 blur-[80px] rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Your Referral Link</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 bg-bg-elevated rounded-xl p-3 border border-border">
                <p className="text-xs text-muted mb-1">Referral Code</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-bold text-brand-400 font-mono">{profile?.referral_code}</code>
                  <button onClick={copyCode} className="text-muted hover:text-brand-400 p-1">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-bg-elevated rounded-xl p-3 border border-border mb-4">
              <p className="text-xs text-muted mb-1">Referral Link</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-gray-300 font-mono flex-1 truncate">{referralLink}</code>
                <button onClick={copyLink} className="text-muted hover:text-brand-400 p-1 shrink-0">
                  {copied ? <Check className="h-4 w-4 text-brand-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={copyLink} className="btn-primary flex-1 px-4 py-2.5 text-sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={shareLink} className="btn-ghost px-4 py-2.5 text-sm">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Total Referrals" value={totalReferrals.toString()} icon={<Users className="h-5 w-5" />} accent="brand" />
          <StatCard label="Active" value={activeReferrals.toString()} icon={<UserCheck className="h-5 w-5" />} accent="gold" />
          <StatCard label="Rewards" value={formatNumber(totalRewards)} sub="CRS" icon={<Gift className="h-5 w-5" />} accent="blue" />
        </div>

        <AdSlot position="top" />

        {/* Referral list */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-white mb-4">Referred Users</h2>
          {referrals.length === 0 ? (
            <EmptyState icon={<Users className="h-10 w-10" />} title="No referrals yet" sub="Share your link to start earning" />
          ) : (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-brand-400 shrink-0">
                      {r.referred?.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.referred?.email}</p>
                      <p className="text-xs text-muted">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {r.status === 'activated' ? (
                      <Badge variant="success">Active · +{formatNumber(r.reward_amount)}</Badge>
                    ) : (
                      <Badge variant="pending">Pending</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <AdSlot position="bottom" />
      </div>
    </div>
  );
}
