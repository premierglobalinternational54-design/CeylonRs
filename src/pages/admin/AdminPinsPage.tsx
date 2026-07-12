import { useState } from 'react';
import { KeyRound, Plus, Copy, Mail } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { supabase } from '../../lib/supabase';
import { generatePin, formatDateTime } from '../../lib/utils';

export function AdminPinsPage() {
  const { pins, users, reload, loading } = useAdminData();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState('');
  const [creating, setCreating] = useState(false);

  const handleGenerate = async () => {
    if (!selectedUser) { toast('error', 'Select a user'); return; }
    setCreating(true);
    const pin = generatePin();
    const { error } = await supabase.from('activation_pins').insert({
      user_id: selectedUser, pin, status: 'unused',
    });
    setCreating(false);
    if (error) { toast('error', error.message); return; }
    toast('success', `PIN ${pin} generated for user`);
    reload();
    setSelectedUser('');
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast('success', 'PIN copied');
  };

  return (
    <AdminLayout title="PIN Management">
      {/* Generate PIN */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-gold-400" />
          <h2 className="text-lg font-bold text-white">Generate Activation PIN</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select label="Select User" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="">Choose a user…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} loading={creating} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Generate PIN
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted mt-3 flex items-center gap-1.5">
          <Mail className="h-3 w-3" /> In production, the PIN is emailed to the user automatically.
        </p>
      </Card>

      {/* PIN list */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-white mb-4">All PINs</h2>
        {loading ? (
          <div className="shimmer h-32 rounded-xl" />
        ) : pins.length === 0 ? (
          <EmptyState icon={<KeyRound className="h-10 w-10" />} title="No PINs generated yet" />
        ) : (
          <div className="space-y-2">
            {pins.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-border-subtle last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400 shrink-0">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.profile?.email}</p>
                    <p className="text-xs text-muted">{formatDateTime(p.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <code className="text-lg font-bold font-mono tracking-widest text-brand-400">{p.pin}</code>
                  <button onClick={() => copyPin(p.pin)} className="text-muted hover:text-brand-400 p-1">
                    <Copy className="h-4 w-4" />
                  </button>
                  <Badge variant={p.status === 'unused' ? 'pending' : 'success'}>
                    {p.status === 'unused' ? 'Unused' : 'Used'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}
