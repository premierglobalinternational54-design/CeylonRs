import { useState } from 'react';
import { Check, X, ExternalLink, Package as PkgIcon } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { supabase } from '../../lib/supabase';
import { formatUsd, formatDateTime, shortHash, generatePin } from '../../lib/utils';
import type { Payment } from '../../lib/types';

export function AdminPaymentsPage() {
  const { payments, reload, loading } = useAdminData();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [viewing, setViewing] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = payments.filter((p) => filter === 'all' || p.status === filter);

  const handleApprove = async (payment: Payment) => {
    setActionLoading(true);
    const pin = generatePin();

    const { error: pinError } = await supabase.from('activation_pins').insert({
      user_id: payment.user_id,
      payment_id: payment.id,
      pin,
      status: 'unused',
    });
    if (pinError) { toast('error', 'PIN creation failed: ' + pinError.message); setActionLoading(false); return; }

    const { error } = await supabase.from('payments').update({
      status: 'approved', admin_note: `PIN ${pin} generated`,
    }).eq('id', payment.id);
    if (error) { toast('error', error.message); setActionLoading(false); return; }

    setActionLoading(false);
    toast('success', `Payment approved! PIN ${pin} generated for user.`);
    reload();
    setViewing(null);
  };

  const handleReject = async (payment: Payment) => {
    setActionLoading(true);
    const { error } = await supabase.from('payments').update({
      status: 'rejected', admin_note: 'Rejected by admin',
    }).eq('id', payment.id);
    setActionLoading(false);
    if (error) { toast('error', error.message); return; }
    toast('info', 'Payment rejected');
    reload();
    setViewing(null);
  };

  const tabs = ['pending', 'approved', 'rejected', 'all'] as const;

  return (
    <AdminLayout title="Payment Management">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition ${
              filter === t ? 'bg-brand-500/15 text-brand-300' : 'bg-bg-card text-muted hover:text-white'
            }`}
          >
            {t} ({payments.filter((p) => t === 'all' || p.status === t).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="shimmer h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <Card className="p-6"><EmptyState title="No payments found" /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">{p.email}</p>
                    <Badge variant={p.status === 'approved' ? 'success' : p.status === 'pending' ? 'pending' : 'danger'}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="flex items-center gap-1"><PkgIcon className="h-3 w-3" /> {p.package?.name}</span>
                    <span className="font-mono text-gold-400">{formatUsd(p.amount_usdt)}</span>
                    <span className="font-mono">TX: {shortHash(p.tx_hash)}</span>
                    <span>{formatDateTime(p.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(p)}>View</Button>
                  {p.status === 'pending' && (
                    <>
                      <Button size="sm" loading={actionLoading} onClick={() => handleApprove(p)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleReject(p)}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Payment Details" size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Detail label="User Email" value={viewing.email} />
              <Detail label="Package" value={viewing.package?.name ?? '—'} />
              <Detail label="Amount" value={formatUsd(viewing.amount_usdt)} />
              <Detail label="Status" value={viewing.status} />
              <Detail label="Date" value={formatDateTime(viewing.created_at)} />
              <Detail label="Admin Note" value={viewing.admin_note ?? '—'} />
            </div>
            <div>
              <p className="label">Transaction Hash</p>
              <code className="block bg-bg-elevated rounded-lg p-3 text-xs text-gray-300 font-mono break-all">{viewing.tx_hash}</code>
            </div>
            {viewing.screenshot_url && (
              <div>
                <p className="label">Payment Screenshot</p>
                <a href={viewing.screenshot_url} target="_blank" rel="noreferrer" className="block">
                  <img src={viewing.screenshot_url} alt="Payment proof" className="w-full rounded-xl border border-border max-h-64 object-cover" />
                  <p className="text-xs text-brand-400 mt-1 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Open full size</p>
                </a>
              </div>
            )}
            {viewing.status === 'pending' && (
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" loading={actionLoading} onClick={() => handleApprove(viewing)}>
                  <Check className="h-4 w-4" /> Approve & Generate PIN
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => handleReject(viewing)}>
                  <X className="h-4 w-4" /> Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
