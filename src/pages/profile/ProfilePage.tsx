import { useState } from 'react';
import { Mail, Gift, Calendar, Shield, KeyRound, CheckCircle2 } from 'lucide-react';
import { DashboardNavbar } from '../../components/Navigation';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useMiningData } from '../../hooks/useMiningData';
import { formatDate, formatFull } from '../../lib/utils';
import { PinActivationModal } from '../mining/PinActivationModal';

export function ProfilePage() {
  const { profile } = useAuth();
  const { userPackages } = useMiningData();
  const [pinOpen, setPinOpen] = useState(false);

  if (!profile) return null;

  return (
    <div className="min-h-screen pb-20">
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <h1 className="text-2xl font-bold text-white">Profile</h1>

        {/* Profile header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-2xl font-bold text-bg-base">
              {profile.email[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{profile.email}</h2>
              <div className="flex items-center gap-2 mt-1">
                {profile.is_admin && <Badge variant="gold"><Shield className="h-3 w-3" /> Admin</Badge>}
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Account info */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Account Information</h3>
          <div className="space-y-3">
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email} />
            <InfoRow icon={<Gift className="h-4 w-4" />} label="Referral Code" value={profile.referral_code} />
            <InfoRow icon={<Calendar className="h-4 w-4" />} label="Member Since" value={formatDate(profile.created_at)} />
            <InfoRow icon={<Shield className="h-4 w-4" />} label="Role" value={profile.is_admin ? 'Administrator' : 'User'} />
          </div>
        </Card>

        {/* Wallet summary */}
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Wallet Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg-elevated rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Balance</p>
              <p className="text-lg font-bold text-brand-400 font-mono">{formatFull(profile.wallet_balance)}</p>
            </div>
            <div className="bg-bg-elevated rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Total Mined</p>
              <p className="text-lg font-bold text-white font-mono">{formatFull(profile.total_mined)}</p>
            </div>
            <div className="bg-bg-elevated rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Referrals</p>
              <p className="text-lg font-bold text-gold-400 font-mono">{formatFull(profile.referral_earnings)}</p>
            </div>
          </div>
        </Card>

        {/* Packages */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">My Packages</h3>
            {userPackages.some((up) => up.status === 'pending') && (
              <Button size="sm" variant="gold" onClick={() => setPinOpen(true)}>
                <KeyRound className="h-4 w-4" /> Enter PIN
              </Button>
            )}
          </div>
          {userPackages.length === 0 ? (
            <p className="text-sm text-muted text-center py-4">No packages yet. Visit the Mining page to get started.</p>
          ) : (
            <div className="space-y-2">
              {userPackages.map((up) => (
                <div key={up.id} className="flex items-center justify-between bg-bg-elevated rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    {up.status === 'active' ? (
                      <CheckCircle2 className="h-5 w-5 text-brand-400" />
                    ) : up.status === 'pending' ? (
                      <KeyRound className="h-5 w-5 text-gold-400" />
                    ) : null}
                    <div>
                      <p className="text-sm font-medium text-white">{up.package?.name}</p>
                      <p className="text-xs text-muted">
                        {up.status === 'active' && up.expires_at ? `Expires ${formatDate(up.expires_at)}` : up.status}
                      </p>
                    </div>
                  </div>
                  <Badge variant={up.status === 'active' ? 'success' : up.status === 'pending' ? 'pending' : 'danger'}>
                    {up.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <PinActivationModal open={pinOpen} onClose={() => setPinOpen(false)} />
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
