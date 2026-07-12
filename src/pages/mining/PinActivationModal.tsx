import { useState } from 'react';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { UserPackage } from '../../lib/types';

export function PinActivationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile || pin.length !== 8) {
      toast('error', 'PIN must be 8 digits');
      return;
    }
    setLoading(true);
    const { data: pinRow, error } = await supabase
      .from('activation_pins')
      .select('*')
      .eq('user_id', profile.id)
      .eq('pin', pin)
      .eq('status', 'unused')
      .maybeSingle();

    if (error || !pinRow) {
      toast('error', 'Invalid or already used PIN');
      setLoading(false);
      return;
    }

    const { data: up } = await supabase
      .from('user_packages')
      .select('*, package:packages(*)')
      .eq('user_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle() as { data: UserPackage | null };

    if (!up) {
      toast('error', 'No pending package to activate');
      setLoading(false);
      return;
    }

    const now = new Date();
    const expires = new Date(now.getTime() + (up.package?.duration_days ?? 365) * 24 * 60 * 60 * 1000);

    await supabase.from('user_packages').update({
      status: 'active',
      activated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      daily_reward: up.package?.daily_reward ?? 0,
      mining_speed: up.package?.mining_speed ?? '',
    }).eq('id', up.id);

    await supabase.from('activation_pins').update({
      status: 'used', used_at: now.toISOString(),
    }).eq('id', pinRow.id);

    await refreshProfile();
    setSuccess(true);
    setLoading(false);
    toast('success', `${up.package?.name} activated! Mining started.`);
  };

  const handleClose = () => {
    setPin('');
    setSuccess(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Activate Package">
      {success ? (
        <div className="text-center py-6">
          <div className="h-16 w-16 rounded-full bg-brand-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Package Activated!</h3>
          <p className="text-sm text-muted mt-2">Your mining package is now active and earning rewards.</p>
          <Button className="mt-6 w-full" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted">
            Enter the 8-digit activation PIN sent to your email after payment approval.
          </p>
          <Input
            label="Activation PIN"
            placeholder="e.g. 83927461"
            icon={<KeyRound className="h-4 w-4" />}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            maxLength={8}
            inputMode="numeric"
            className="text-center text-lg tracking-[0.3em] font-mono"
          />
          <Button type="submit" className="w-full" loading={loading} size="lg">Activate Package</Button>
        </form>
      )}
    </Modal>
  );
}
