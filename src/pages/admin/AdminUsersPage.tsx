import { useState } from 'react';
import { Search, Wallet, Gift, Calendar, Shield } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Loader';
import { useAdminData } from '../../hooks/useAdminData';
import { formatFull, formatDate, formatNumber } from '../../lib/utils';

export function AdminUsersPage() {
  const { users, loading } = useAdminData();
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.referral_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout title="User Management">
      <Card className="p-4 mb-4">
        <Input
          placeholder="Search by email or referral code…"
          icon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {loading ? (
        <div className="shimmer h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <Card className="p-6"><EmptyState title="No users found" /></Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bg-elevated text-muted text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Referral Code</th>
                  <th className="text-right px-4 py-3">Balance</th>
                  <th className="text-right px-4 py-3">Total Mined</th>
                  <th className="text-right px-4 py-3">Referral Earn</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-center px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-border-subtle hover:bg-bg-hover">
                    <td className="px-4 py-3 text-white font-medium">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-brand-400">{u.referral_code}</td>
                    <td className="px-4 py-3 text-right font-mono text-brand-400">{formatFull(u.wallet_balance)}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{formatNumber(u.total_mined)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gold-400">{formatNumber(u.referral_earnings)}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      {u.is_admin ? <Badge variant="gold"><Shield className="h-3 w-3" /> Admin</Badge> : <Badge variant="info">User</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <Card key={u.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.email}</p>
                    <p className="text-xs text-muted font-mono">{u.referral_code}</p>
                  </div>
                  {u.is_admin && <Badge variant="gold">Admin</Badge>}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-bg-elevated rounded-lg p-2 min-w-0">
                    <Wallet className="h-3 w-3 text-brand-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-brand-400 font-mono break-all">{formatFull(u.wallet_balance)}</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-2 min-w-0">
                    <Gift className="h-3 w-3 text-gold-400 mx-auto mb-1" />
                    <p className="text-xs font-bold text-white font-mono break-all">{formatNumber(u.referral_earnings)}</p>
                  </div>
                  <div className="bg-bg-elevated rounded-lg p-2">
                    <Calendar className="h-3 w-3 text-muted mx-auto mb-1" />
                    <p className="text-xs text-muted">{formatDate(u.created_at)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
