import { useCallback, useEffect, useState } from 'react';
import { Wallet, ArrowDownToLine, ArrowUpFromLine, Coins, Gift, History } from 'lucide-react';
import { DashboardNavbar } from '../../components/Navigation';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatFull, formatNumber, formatDateTime, classNames } from '../../lib/utils';
import type { Claim, Withdrawal } from '../../lib/types';

type HistoryItem = {
  id: string;
  type: 'claim' | 'withdrawal' | 'referral';
  amount: number;
  status: string;
  date: string;
  detail: string;
};

export function WalletPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referralEarnings, setReferralEarnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'claims' | 'withdrawals' | 'referrals'>('all');

  const [wAmount, setWAmount] = useState('');
  const [wAddress, setWAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [cRes, wRes] = await Promise.all([
      supabase.from('claims').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setClaims((cRes.data as Claim[]) ?? []);
    setWithdrawals((wRes.data as Withdrawal[]) ?? []);
    setReferralEarnings(profile?.referral_earnings ?? 0);
    setLoading(false);
  }, [user, profile]);

  useEffect(() => { load(); }, [load]);

  const history: HistoryItem[] = [
    ...claims.map((c) => ({
      id: c.id, type: 'claim' as const, amount: c.amount, status: 'completed',
      date: c.created_at, detail: `Free claim`,
    })),
    ...withdrawals.map((w) => ({
      id: w.id, type: 'withdrawal' as const, amount: -w.amount, status: w.status,
      date: w.created_at, detail: w.wallet_address.slice(0, 10) + '…',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = history.filter((h) => {
    if (tab === 'all') return true;
    if (tab === 'claims') return h.type === 'claim';
    if (tab === 'withdrawals') return h.type === 'withdrawal';
    if (tab === 'referrals') return h.type === 'referral';
    return true;
  });

  const handleWithdraw = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const amount = parseFloat(wAmount);
    if (!amount || amount <= 0) { toast('error', 'Enter a valid amount'); return; }
    if (amount > (profile?.wallet_balance ?? 0)) { toast('error', 'Insufficient balance'); return; }
    if (wAddress.trim().length < 10) { toast('error', 'Enter a valid wallet address'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('withdrawals').insert({
      user_id: user!.id, amount, wallet_address: wAddress.trim(), status: 'pending',
    });
    setSubmitting(false);
    if (error) { toast('error', error.message); return; }
    toast('success', 'Withdrawal request submitted!');
    setWAmount(''); setWAddress(''); setWithdrawOpen(false);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {[1, 2].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'claims' as const, label: 'Claims' },
    { key: 'withdrawals' as const, label: 'Withdrawals' },
  ];

  return (
    <div className="min-h-screen pb-20">
      <DashboardNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Wallet</h1>
            <p className="text-sm text-muted">Manage your CeylonRS tokens</p>
          </div>
          <Button onClick={() => setWithdrawOpen(true)} size="sm">
            <ArrowUpFromLine className="h-4 w-4" /> Withdraw
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Balance" value={formatFull(profile?.wallet_balance ?? 0)} sub="CRS"
            icon={<Wallet className="h-5 w-5" />} accent="brand" />
          <StatCard label="Total Mined" value={formatNumber(profile?.total_mined ?? 0)} sub="All-time"
            icon={<Coins className="h-5 w-5" />} accent="gold" />
          <StatCard label="Referral Earnings" value={formatNumber(referralEarnings)} sub="From referrals"
            icon={<Gift className="h-5 w-5" />} accent="blue" />
          <StatCard label="Withdrawals" value={withdrawals.length.toString()} sub="Total requests"
            icon={<ArrowDownToLine className="h-5 w-5" />} accent="danger" />
        </div>

        {/* History */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Transaction History</h2>
            </div>
            <div className="flex gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={classNames(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    tab === t.key ? 'bg-brand-500/15 text-brand-300' : 'text-muted hover:text-white hover:bg-bg-hover',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<History className="h-10 w-10" />} title="No transactions yet" sub="Your activity will appear here" />
          ) : (
            <div className="space-y-1">
              {filtered.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={classNames(
                      'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                      h.amount > 0 ? 'bg-brand-500/10 text-brand-400' : 'bg-danger-500/10 text-danger-400',
                    )}>
                      {h.type === 'withdrawal' ? <ArrowUpFromLine className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white capitalize">{h.type}</p>
                      <p className="text-xs text-muted truncate">{h.detail} · {formatDateTime(h.date)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={classNames('text-sm font-bold font-mono break-all', h.amount > 0 ? 'text-brand-400' : 'text-danger-400')}>
                      {h.amount > 0 ? '+' : ''}{formatFull(h.amount)}
                    </p>
                    {h.status !== 'completed' && (
                      <Badge variant={h.status === 'pending' ? 'pending' : h.status === 'approved' ? 'success' : 'danger'}>
                        {h.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Withdraw modal */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw CeylonRS">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="bg-bg-elevated rounded-xl p-3 text-center">
            <p className="text-xs text-muted">Available Balance</p>
            <p className="text-xl sm:text-2xl font-bold text-brand-400 font-mono break-all">{formatFull(profile?.wallet_balance ?? 0)} CRS</p>
          </div>
          <Input
            label="Amount (CeylonRS)"
            type="number"
            placeholder="0.00"
            value={wAmount}
            onChange={(e) => setWAmount(e.target.value)}
          />
          <Input
            label="CeylonRS Wallet Address"
            placeholder="Enter your wallet address"
            value={wAddress}
            onChange={(e) => setWAddress(e.target.value)}
          />
          <p className="text-xs text-muted">
            Withdrawal requests are reviewed by admin. You'll be notified once processed.
          </p>
          <Button type="submit" className="w-full" size="lg" loading={submitting}>Submit Withdrawal</Button>
        </form>
      </Modal>
    </div>
  );
}
