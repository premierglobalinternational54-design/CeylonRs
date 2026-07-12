import { useState } from 'react';
import { Upload, Copy, Check, Wallet } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatUsd } from '../../lib/utils';
import type { Package, Settings } from '../../lib/types';

export function PaymentModal({
  open, onClose, pkg, settings,
}: { open: boolean; onClose: () => void; pkg: Package | null; settings: Settings | null }) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [txHash, setTxHash] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!pkg) return null;
  const address = settings?.usdt_trc20_address ?? '';

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('payment-screenshots')
      .upload(path, file, { contentType: file.type });
    if (error) {
      toast('error', 'Upload failed: ' + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('payment-screenshots').getPublicUrl(path);
    setScreenshotUrl(urlData.publicUrl);
    setUploading(false);
    toast('success', 'Screenshot uploaded');
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!profile || !pkg) return;
    if (!txHash.trim()) { toast('error', 'Transaction hash is required'); return; }
    if (!screenshotUrl) { toast('error', 'Please upload a payment screenshot'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('payments').insert({
      user_id: profile.id,
      package_id: pkg.id,
      email: profile.email,
      amount_usdt: pkg.price_usdt,
      tx_hash: txHash.trim(),
      screenshot_url: screenshotUrl,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) {
      toast('error', 'Failed to submit: ' + error.message);
      return;
    }
    toast('success', 'Payment request submitted! Admin will review shortly.');
    setTxHash('');
    setScreenshotUrl('');
    onClose();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Buy ${pkg.name}`} size="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Package summary */}
        <div className="bg-bg-elevated rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-white">{pkg.name}</p>
            <p className="text-xs text-muted">Duration: {pkg.duration_days} days</p>
          </div>
          <p className="text-2xl font-bold text-gold-400">{formatUsd(pkg.price_usdt)}</p>
        </div>

        {/* Payment address */}
        <div>
          <label className="label">USDT TRC-20 Payment Address</label>
          <div className="flex items-center gap-2 bg-bg-elevated rounded-xl p-3 border border-border">
            <Wallet className="h-4 w-4 text-brand-400 shrink-0" />
            <code className="text-xs text-gray-300 flex-1 truncate font-mono">{address}</code>
            <button type="button" onClick={copyAddress} className="text-muted hover:text-brand-400 p-1">
              {copied ? <Check className="h-4 w-4 text-brand-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted mt-1.5">
            Send exactly <span className="text-gold-400 font-semibold">{formatUsd(pkg.price_usdt)}</span> USDT (TRC-20) to the address above.
          </p>
        </div>

        {/* Email (read-only) */}
        <Input label="Your Email" value={profile?.email ?? ''} disabled icon={<Wallet className="h-4 w-4" />} />

        {/* TX hash */}
        <Input
          label="Transaction Hash"
          placeholder="Enter the USDT transaction hash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
        />

        {/* Screenshot upload */}
        <div>
          <label className="label">Payment Screenshot</label>
          {screenshotUrl ? (
            <div className="relative">
              <img src={screenshotUrl} alt="Payment proof" className="w-full rounded-xl border border-border max-h-48 object-cover" />
              <button type="button" onClick={() => setScreenshotUrl('')} className="absolute top-2 right-2 bg-bg-base/80 text-white text-xs px-2 py-1 rounded-lg">
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-brand-500/50 transition">
              <Upload className="h-6 w-6 text-muted" />
              <span className="text-sm text-muted">{uploading ? 'Uploading…' : 'Click to upload screenshot'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
            </label>
          )}
        </div>

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          Submit Payment Request
        </Button>
        <p className="text-xs text-muted text-center">
          After admin approval, an 8-digit activation PIN will be sent to your email.
        </p>
      </form>
    </Modal>
  );
}
