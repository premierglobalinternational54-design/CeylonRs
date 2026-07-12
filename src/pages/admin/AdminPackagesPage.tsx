import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package as PkgIcon } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { supabase } from '../../lib/supabase';
import { formatNumber, formatUsd } from '../../lib/utils';
import type { Package } from '../../lib/types';

export function AdminPackagesPage() {
  const { packages, reload, loading } = useAdminData();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Package | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <AdminLayout title="Package Management">
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Package
        </Button>
      </div>

      {loading ? (
        <div className="shimmer h-64 rounded-2xl" />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PkgIcon className="h-5 w-5 text-brand-400" />
                  <h3 className="font-bold text-white">{pkg.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(pkg)} className="p-1.5 rounded-lg hover:bg-bg-hover text-muted hover:text-brand-400">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete ${pkg.name}?`)) return;
                      const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
                      if (error) { toast('error', error.message); return; }
                      toast('success', 'Package deleted');
                      reload();
                    }}
                    className="p-1.5 rounded-lg hover:bg-bg-hover text-muted hover:text-danger-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Price" value={pkg.is_free ? 'FREE' : formatUsd(pkg.price_usdt)} />
                <Row label="Daily Reward" value={`${formatNumber(pkg.daily_reward)} CRS`} />
                <Row label="Speed" value={pkg.mining_speed} />
                <Row label="Duration" value={`${pkg.duration_days} days`} />
                <div className="flex gap-2 pt-2">
                  <Badge variant={pkg.is_free ? 'success' : 'gold'}>{pkg.is_free ? 'Free' : 'Paid'}</Badge>
                  <Badge variant={pkg.is_active ? 'success' : 'danger'}>{pkg.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PackageFormModal
        open={creating || !!editing}
        pkg={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { reload(); setCreating(false); setEditing(null); }}
      />
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function PackageFormModal({ open, pkg, onClose, onSaved }: {
  open: boolean; pkg: Package | null; onClose: () => void; onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '', price_usdt: '', daily_reward: '', mining_speed: '', duration_days: '365', is_free: false, is_active: true, sort_order: '0',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkg) {
      setForm({
        name: pkg.name, price_usdt: String(pkg.price_usdt), daily_reward: String(pkg.daily_reward),
        mining_speed: pkg.mining_speed, duration_days: String(pkg.duration_days),
        is_free: pkg.is_free, is_active: pkg.is_active, sort_order: String(pkg.sort_order),
      });
    } else {
      setForm({ name: '', price_usdt: '', daily_reward: '', mining_speed: '', duration_days: '365', is_free: false, is_active: true, sort_order: '0' });
    }
  }, [pkg, open]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const data = {
      name: form.name,
      price_usdt: parseFloat(form.price_usdt) || 0,
      daily_reward: parseFloat(form.daily_reward) || 0,
      mining_speed: form.mining_speed,
      duration_days: parseInt(form.duration_days) || 365,
      is_free: form.is_free,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };
    const res = pkg
      ? await supabase.from('packages').update(data).eq('id', pkg.id)
      : await supabase.from('packages').insert(data);
    setLoading(false);
    if (res.error) { toast('error', res.error.message); return; }
    toast('success', pkg ? 'Package updated' : 'Package created');
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={pkg ? 'Edit Package' : 'Add Package'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Price (USDT)" type="number" value={form.price_usdt} onChange={(e) => setForm({ ...form, price_usdt: e.target.value })} />
          <Input label="Daily Reward (CRS)" type="number" value={form.daily_reward} onChange={(e) => setForm({ ...form, daily_reward: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Mining Speed" placeholder="e.g. 9,066/hr" value={form.mining_speed} onChange={(e) => setForm({ ...form, mining_speed: e.target.value })} />
          <Input label="Duration (days)" type="number" value={form.duration_days} onChange={(e) => setForm({ ...form, duration_days: e.target.value })} />
        </div>
        <Input label="Sort Order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="accent-brand-500" />
            Free Package
          </label>
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="accent-brand-500" />
            Active
          </label>
        </div>
        <Button type="submit" className="w-full" loading={loading} size="lg">
          {pkg ? 'Save Changes' : 'Create Package'}
        </Button>
      </form>
    </Modal>
  );
}
