import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Megaphone, Power, Code2 } from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { formatDateTime, classNames } from '../../lib/utils';
import type { Advertisement, AdPosition } from '../../lib/types';

const POSITIONS: { value: AdPosition; label: string }[] = [
  { value: 'top', label: 'Top Banner' },
  { value: 'middle', label: 'Middle Banner' },
  { value: 'bottom', label: 'Bottom Banner' },
];

export function AdminAdsPage() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Advertisement | null>(null);
  const [creating, setCreating] = useState(false);

  const loadAds = useCallback(async () => {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast('error', error.message); return; }
    setAds((data as Advertisement[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadAds(); }, [loadAds]);

  const handleToggle = async (ad: Advertisement) => {
    const { error } = await supabase
      .from('advertisements')
      .update({ is_active: !ad.is_active, updated_at: new Date().toISOString() })
      .eq('id', ad.id);
    if (error) { toast('error', error.message); return; }
    toast('success', `Ad ${!ad.is_active ? 'enabled' : 'disabled'}`);
    loadAds();
  };

  const handleDelete = async (ad: Advertisement) => {
    if (!confirm(`Delete "${ad.name}"?`)) return;
    const { error } = await supabase.from('advertisements').delete().eq('id', ad.id);
    if (error) { toast('error', error.message); return; }
    toast('success', 'Ad deleted');
    loadAds();
  };

  return (
    <AdminLayout title="Ads Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="text-sm text-muted">
          Manage global advertisement placements across the website. Paste HTML/JS code from any ad network.
        </p>
        <Button size="sm" onClick={() => setCreating(true)} className="shrink-0">
          <Plus className="h-4 w-4" /> Add Advertisement
        </Button>
      </div>

      {loading ? (
        <div className="shimmer h-64 rounded-2xl" />
      ) : ads.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 text-muted mx-auto mb-4" />
          <p className="text-white font-medium mb-1">No advertisements yet</p>
          <p className="text-sm text-muted mb-4">Create your first ad to display it across the website.</p>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Add Advertisement
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => (
            <Card key={ad.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-5 w-5 text-brand-400 shrink-0" />
                  <h3 className="font-bold text-white truncate">{ad.name}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(ad)}
                    className="p-1.5 rounded-lg hover:bg-bg-hover text-muted hover:text-brand-400"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(ad)}
                    className={classNames(
                      'p-1.5 rounded-lg hover:bg-bg-hover',
                      ad.is_active ? 'text-brand-400' : 'text-muted',
                    )}
                    title={ad.is_active ? 'Disable' : 'Enable'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad)}
                    className="p-1.5 rounded-lg hover:bg-bg-hover text-muted hover:text-danger-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Position</span>
                  <span className="text-white font-medium">
                    {POSITIONS.find((p) => p.value === ad.position)?.label ?? ad.position}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <Badge variant={ad.is_active ? 'success' : 'danger'}>
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Created</span>
                  <span className="text-white text-xs">{formatDateTime(ad.created_at)}</span>
                </div>

                {/* Code preview */}
                <div className="pt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Code2 className="h-3 w-3 text-muted" />
                    <span className="text-xs text-muted">Ad Code Preview</span>
                  </div>
                  <pre className="bg-bg-elevated rounded-lg p-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                    {ad.ad_code.slice(0, 200)}{ad.ad_code.length > 200 ? '...' : ''}
                  </pre>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AdFormModal
        open={creating || !!editing}
        ad={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSaved={() => { loadAds(); setCreating(false); setEditing(null); }}
      />
    </AdminLayout>
  );
}

function AdFormModal({ open, ad, onClose, onSaved }: {
  open: boolean;
  ad: Advertisement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    position: 'top' as AdPosition,
    ad_code: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ad) {
      setForm({ name: ad.name, position: ad.position, ad_code: ad.ad_code, is_active: ad.is_active });
    } else {
      setForm({ name: '', position: 'top', ad_code: '', is_active: true });
    }
  }, [ad, open]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.ad_code.trim()) { toast('error', 'Ad code is required'); return; }
    setLoading(true);
    const data = {
      name: form.name || 'Untitled Ad',
      position: form.position,
      ad_code: form.ad_code,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    const res = ad
      ? await supabase.from('advertisements').update(data).eq('id', ad.id)
      : await supabase.from('advertisements').insert(data);
    setLoading(false);
    if (res.error) { toast('error', res.error.message); return; }
    toast('success', ad ? 'Advertisement updated' : 'Advertisement created');
    onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title={ad ? 'Edit Advertisement' : 'Add Advertisement'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Ad Name</label>
          <input
            className="input"
            placeholder="e.g. Top Banner — AdSense"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Position</label>
          <select
            className="input"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value as AdPosition })}
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Advertisement Code (HTML / JavaScript)</label>
          <textarea
            className="input resize-y min-h-[160px] font-mono text-xs"
            placeholder="Paste your ad network HTML/JavaScript code here..."
            value={form.ad_code}
            onChange={(e) => setForm({ ...form, ad_code: e.target.value })}
            required
          />
          <p className="text-xs text-muted mt-1.5">
            Paste raw HTML or JavaScript code from any ad network (Google AdSense, Media.net, etc.).
            The code will be rendered inside a branded sponsor card on every page.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-white">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="accent-brand-500"
          />
          Active (display this ad on the website)
        </label>

        <Button type="submit" className="w-full" loading={loading} size="lg">
          {ad ? 'Save Changes' : 'Create Advertisement'}
        </Button>
      </form>
    </Modal>
  );
}
