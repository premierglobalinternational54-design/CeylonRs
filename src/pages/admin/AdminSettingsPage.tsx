import { useState } from 'react';
import { Save, Settings as SettingsIcon, Percent, Coins, Timer, Wallet } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAdminData } from '../../hooks/useAdminData';
import { supabase } from '../../lib/supabase';

export function AdminSettingsPage() {
  const { settings, reload } = useAdminData();
  const { toast } = useToast();
  const [form, setForm] = useState({
    referral_percentage: String(settings?.referral_percentage ?? 10),
    free_mining_limit: String(settings?.free_mining_limit ?? 1000),
    claim_interval_minutes: String(settings?.claim_interval_minutes ?? 5),
    usdt_trc20_address: settings?.usdt_trc20_address ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('settings').update({
      referral_percentage: parseFloat(form.referral_percentage) || 10,
      free_mining_limit: parseFloat(form.free_mining_limit) || 1000,
      claim_interval_minutes: parseInt(form.claim_interval_minutes) || 5,
      usdt_trc20_address: form.usdt_trc20_address,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) { toast('error', error.message); return; }
    toast('success', 'Settings saved');
    reload();
  };

  return (
    <AdminLayout title="System Settings">
      <Card className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-bold text-white">Platform Configuration</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-5">
          <Input
            label="Referral Percentage (%)"
            type="number"
            icon={<Percent className="h-4 w-4" />}
            value={form.referral_percentage}
            onChange={(e) => setForm({ ...form, referral_percentage: e.target.value })}
          />
          <Input
            label="Free Mining Daily Limit (CRS)"
            type="number"
            icon={<Coins className="h-4 w-4" />}
            value={form.free_mining_limit}
            onChange={(e) => setForm({ ...form, free_mining_limit: e.target.value })}
          />
          <Input
            label="Claim Interval (minutes)"
            type="number"
            icon={<Timer className="h-4 w-4" />}
            value={form.claim_interval_minutes}
            onChange={(e) => setForm({ ...form, claim_interval_minutes: e.target.value })}
          />
          <Input
            label="USDT TRC-20 Payment Address"
            icon={<Wallet className="h-4 w-4" />}
            value={form.usdt_trc20_address}
            onChange={(e) => setForm({ ...form, usdt_trc20_address: e.target.value })}
          />
          <Button type="submit" loading={saving} size="lg" className="w-full">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </form>
      </Card>
    </AdminLayout>
  );
}
