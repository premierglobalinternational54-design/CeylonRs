import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatFull, formatDateTime, shortAddr } from '../../lib/utils';
import type { Withdrawal } from '../../lib/types';

export function AdminWithdrawalsPage() {
  const { withdrawals, reload, loading } = useAdminData();
  const { refreshProfile } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [viewing, setViewing] = useState<Withdrawal | null>(null);
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = withdrawals.filter((w) => filter === 'all' || w.status === filter);

  const handleAction = async (w: Withdrawal, status: 'approved' | 'rejected') => {
    setActionLoading(true);

    if (status === 'approved') {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', w.user_id)
        .maybeSingle();
      if (profError || !prof) {
        setActionLoading(false);
        toast('error', 'Could not load user wallet: ' + (profError?.message ?? 'not found'));
        return;
      }
      const currentBalance = prof.wallet_balance ?? 0;
      if (currentBalance < w.amount) {
        setActionLoading(false);
        toast('error', `Insufficient balance. User has ${formatFull(currentBalance)} CRS but requested ${formatFull(w.amount)} CRS.`);
        return;
      }
      const { error: deductError } = await supabase
        .from('profiles')
        .update({ wallet_balance: currentBalance - w.amount })
        .eq('id', w.user_id);
      if (deductError) {
        setActionLoading(false);
        toast('error', 'Failed to deduct balance: ' + deductError.message);
        return;
      }
    }

    const { error } = await supabase.from('withdrawals').update({
      status, admin_note: note || null,
    }).eq('id', w.id);
    setActionLoading(false);
    if (error) { toast('error', error.message); return; }
    toast('success', `Withdrawal ${status}`);
    setNote('');
    setViewing(null);
    reload();
    refreshProfile();
  };

  const tabs = ['pending', 'approved', 'rejected', 'all'] as const;

  return (
    <AdminLayout title="Withdrawal Management">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition ${
              filter === t ? 'bg-brand-500/15 text-brand-300' : 'bg-bg-card text-muted hover:text-white'
            }`}
          >
            {t} ({withdrawals.filter((w) => t === 'all' || w.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="shimmer h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <Card className="p-6"><EmptyState title="No withdrawals found" /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => (
            <Card key={w.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{w.profile?.email}</p>
                    <Badge variant={w.status === 'approved' ? 'success' : w.status === 'pending' ? 'pending' : 'danger'}>
                      {w.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="font-mono text-brand-400 text-sm font-bold break-all">{formatFull(w.amount)} CRS</span>
                    <span className="font-mono">To: {shortAddr(w.wallet_address)}</span>
                    <span>{formatDateTime(w.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => { setViewing(w); setNote(w.admin_note ?? ''); }}>Review</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Withdrawal Review" size="md">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="label">User</p>
                <p className="text-sm text-white break-all">{viewing.profile?.email}</p>
              </div>
              <div className="min-w-0">
                <p className="label">Amount</p>
                <p className="text-lg text-brand-400 font-bold font-mono break-all">{formatFull(viewing.amount)} CRS</p>
              </div>
            </div>
            <div>
              <p className="label">Wallet Address</p>
              <code className="block bg-bg-elevated rounded-lg p-3 text-xs text-gray-300 font-mono break-all">{viewing.wallet_address}</code>
            </div>
            <div>
              <p className="label">Date</p>
              <p className="text-sm text-white">{formatDateTime(viewing.created_at)}</p>
            </div>
            <Input
              label="Admin Note"
              placeholder="Add a note (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {viewing.status === 'pending' ? (
              <div className="flex gap-2">
                <Button className="flex-1" loading={actionLoading} onClick={() => handleAction(viewing, 'approved')}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => handleAction(viewing, 'rejected')}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            ) : (
              <div className="text-center text-sm text-muted">
                Status: <Badge variant={viewing.status === 'approved' ? 'success' : 'danger'}>{viewing.status}</Badge>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
