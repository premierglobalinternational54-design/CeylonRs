import { Users, CreditCard, ArrowDownToLine, Package, DollarSign, TrendingUp, KeyRound, CheckCircle2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, StatCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAdminData } from '../../hooks/useAdminData';
import { formatNumber, formatFull, formatUsd, timeAgo } from '../../lib/utils';

export function AdminOverviewPage() {
  const { users, payments, withdrawals, packages, pins, loading } = useAdminData();

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const totalRevenue = payments.filter((p) => p.status === 'approved').reduce((s, p) => s + p.amount_usdt, 0);
  const totalWithdrawn = withdrawals.filter((w) => w.status === 'approved').reduce((s, w) => s + w.amount, 0);
  const activePins = pins.filter((p) => p.status === 'unused');

  return (
    <AdminLayout title="Admin Overview">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-32 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={users.length.toString()} icon={<Users className="h-5 w-5" />} accent="brand" />
            <StatCard label="Revenue" value={formatUsd(totalRevenue)} icon={<DollarSign className="h-5 w-5" />} accent="gold" />
            <StatCard label="Pending Payments" value={pendingPayments.length.toString()} icon={<CreditCard className="h-5 w-5" />} accent="blue" />
            <StatCard label="Pending Withdrawals" value={pendingWithdrawals.length.toString()} icon={<ArrowDownToLine className="h-5 w-5" />} accent="danger" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending payments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Payments</h2>
                <Badge variant="pending">{pendingPayments.length} pending</Badge>
              </div>
              {payments.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No payments yet</p>
              ) : (
                <div className="space-y-2">
                  {payments.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.email}</p>
                        <p className="text-xs text-muted">{p.package?.name} · {timeAgo(p.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-gold-400 font-mono break-all">{formatUsd(p.amount_usdt)}</p>
                        <Badge variant={p.status === 'approved' ? 'success' : p.status === 'pending' ? 'pending' : 'danger'}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Pending withdrawals */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Recent Withdrawals</h2>
                <Badge variant="pending">{pendingWithdrawals.length} pending</Badge>
              </div>
              {withdrawals.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">No withdrawals yet</p>
              ) : (
                <div className="space-y-2">
                  {withdrawals.slice(0, 5).map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{w.profile?.email}</p>
                        <p className="text-xs text-muted">{timeAgo(w.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm font-bold text-brand-400 font-mono break-all">{formatFull(w.amount)} CRS</p>
                        <Badge variant={w.status === 'approved' ? 'success' : w.status === 'pending' ? 'pending' : 'danger'}>
                          {w.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatCard label="Packages" value={packages.length.toString()} icon={<Package className="h-5 w-5" />} accent="brand" />
            <StatCard label="Unused PINs" value={activePins.length.toString()} icon={<KeyRound className="h-5 w-5" />} accent="gold" />
            <StatCard label="Total Withdrawn" value={formatNumber(totalWithdrawn)} sub="CRS" icon={<TrendingUp className="h-5 w-5" />} accent="blue" />
            <StatCard label="Approved Payments" value={payments.filter((p) => p.status === 'approved').length.toString()} icon={<CheckCircle2 className="h-5 w-5" />} accent="brand" />
          </div>
        </>
      )}
    </AdminLayout>
  );
}
