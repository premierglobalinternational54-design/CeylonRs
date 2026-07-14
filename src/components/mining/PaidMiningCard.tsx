import { useEffect, useRef, useState } from 'react';
import { Play, Square, Zap, Timer, Crown, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatFull, formatCountdown, classNames } from '../../lib/utils';
import type { UserPackage } from '../../lib/types';

interface PaidMiningCardProps {
  userPackage: UserPackage;
  onClaimed?: () => void;
}

export function PaidMiningCard({ userPackage, onClaimed }: PaidMiningCardProps) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local checkpoint: accumulated amount and timestamp at our last sync point.
  const [checkpointAmount, setCheckpointAmount] = useState(0);
  const [checkpointTime, setCheckpointTime] = useState(0);

  const pkg = userPackage.package;
  const dailyReward = userPackage.daily_reward || pkg?.daily_reward || 0;
  const ratePerMs = dailyReward / (24 * 60 * 60 * 1000);
  const intervalMs = 5 * 60 * 1000;

  const isMining = userPackage.mining_active ?? false;

  // Sync local checkpoint from DB whenever mining state or DB values change
  useEffect(() => {
    if (isMining && userPackage.mining_started_at) {
      setCheckpointAmount(userPackage.mining_accumulated ?? 0);
      setCheckpointTime(new Date(userPackage.mining_started_at).getTime());
    } else {
      setCheckpointAmount(0);
      setCheckpointTime(0);
    }
  }, [isMining, userPackage.mining_started_at, userPackage.mining_accumulated]);

  // Tick every second for live display
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute live accumulated purely from checkpoint + elapsed time since checkpoint
  const liveAccumulated = isMining && checkpointTime
    ? checkpointAmount + (now - checkpointTime) * ratePerMs
    : 0;
  const elapsed = isMining && checkpointTime ? now - checkpointTime : 0;

  // Auto-save to DB every 30 seconds. Updates both mining_accumulated and
  // mining_started_at, then updates local checkpoint — no double-counting.
  useEffect(() => {
    if (!isMining || !profile) return;
    saveTimer.current = setInterval(async () => {
      const raw = checkpointAmount + (Date.now() - checkpointTime) * ratePerMs;
      const saveTime = new Date().toISOString();
      await supabase.from('user_packages').update({
        mining_accumulated: raw,
        mining_started_at: saveTime,
      }).eq('id', userPackage.id);
      setCheckpointAmount(raw);
      setCheckpointTime(Date.now());
    }, 30000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [isMining, profile, checkpointAmount, checkpointTime, ratePerMs, userPackage.id]);

  const progressPct = Math.min(100, (liveAccumulated / dailyReward) * 100);

  const lastClaim = userPackage.last_claim_at ? new Date(userPackage.last_claim_at).getTime() : 0;
  const nextClaimAt = lastClaim + intervalMs;
  const claimRemaining = Math.max(0, nextClaimAt - now);
  const canClaim = claimRemaining <= 0 && liveAccumulated > 0;

  const handleStart = async () => {
    if (!profile) return;
    setToggling(true);
    const startTime = new Date().toISOString();
    const { error } = await supabase.from('user_packages').update({
      mining_active: true,
      mining_started_at: startTime,
      mining_accumulated: 0,
    }).eq('id', userPackage.id);
    setToggling(false);
    if (error) { toast('error', 'Failed to start: ' + error.message); return; }
    setCheckpointAmount(0);
    setCheckpointTime(Date.now());
    await refreshProfile();
    onClaimed?.();
    toast('success', `${pkg?.name} mining started!`);
  };

  const doClaim = async (stopAfter: boolean) => {
    if (!profile) return;
    const claimAmount = Math.floor(liveAccumulated);

    if (claimAmount <= 0) {
      if (stopAfter) {
        const { error } = await supabase.from('user_packages').update({
          mining_active: false, mining_started_at: null, mining_accumulated: 0,
        }).eq('id', userPackage.id);
        if (error) { toast('error', error.message); return; }
        setCheckpointAmount(0);
        setCheckpointTime(0);
        await refreshProfile();
        onClaimed?.();
      }
      return;
    }

    const claimTime = new Date().toISOString();
    const claimMs = Date.now();

    const { error } = await supabase.from('user_packages').update({
      mining_active: !stopAfter,
      mining_started_at: stopAfter ? null : claimTime,
      mining_accumulated: 0,
      last_claim_at: claimTime,
    }).eq('id', userPackage.id);
    if (error) { toast('error', 'Claim failed: ' + error.message); return; }

    const { error: profileError } = await supabase.from('profiles').update({
      wallet_balance: profile.wallet_balance + claimAmount,
      total_mined: profile.total_mined + claimAmount,
    }).eq('id', profile.id);
    if (profileError) { toast('error', 'Wallet update failed: ' + profileError.message); return; }

    const { error: claimError } = await supabase.from('claims').insert({
      user_id: profile.id, amount: claimAmount, source: 'paid',
    });
    if (claimError) { toast('error', 'Claim record failed: ' + claimError.message); return; }

    // Reset checkpoint so only new points accumulate after claim
    setCheckpointAmount(0);
    setCheckpointTime(stopAfter ? 0 : claimMs);
    await refreshProfile();
    onClaimed?.();
    toast('success', `Claimed ${formatFull(claimAmount)} CRS from ${pkg?.name}!`);
  };

  const handleStop = async () => {
    setToggling(true);
    await doClaim(true);
    setToggling(false);
  };

  const handleClaim = async () => {
    if (!canClaim) return;
    setClaiming(true);
    await doClaim(false);
    setClaiming(false);
  };

  const expired = userPackage.expires_at && new Date(userPackage.expires_at) < new Date();

  if (expired) {
    return (
      <Card className="p-6 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="h-5 w-5 text-gold-400" />
          <h3 className="text-lg font-bold text-white">{pkg?.name}</h3>
          <Badge variant="danger">Expired</Badge>
        </div>
        <p className="text-sm text-muted">This package has expired.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className={classNames(
        'absolute top-0 right-0 h-48 w-48 rounded-full blur-[80px] transition-opacity duration-500',
        isMining ? 'bg-gold-500/20 opacity-100' : 'bg-gold-500/5 opacity-50',
      )} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={classNames(
              'h-10 w-10 rounded-xl flex items-center justify-center transition-all',
              isMining ? 'bg-gold-500/20 text-gold-400' : 'bg-bg-elevated text-muted',
            )}>
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{pkg?.name}</h3>
              <p className="text-xs text-muted">{formatFull(dailyReward)} CRS / day</p>
            </div>
          </div>
          <Badge variant={isMining ? 'success' : 'pending'}>
            {isMining ? 'Mining' : 'Idle'}
          </Badge>
        </div>

        <div className="bg-bg-elevated rounded-2xl p-5 mb-4">
          {isMining ? (
            <>
              <div className="text-center mb-4">
                <p className="text-xs text-muted uppercase tracking-wide mb-1 flex items-center justify-center gap-1.5">
                  <Activity className="h-3 w-3 animate-pulse" /> Mining Now
                </p>
                <p className="text-4xl font-bold text-gold-400 font-mono tabular-nums">
                  {formatFull(liveAccumulated)}
                </p>
                <p className="text-xs text-muted mt-1">CRS accumulated</p>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>Progress to daily reward</span>
                  <span className="font-mono text-gold-400">{progressPct.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-bg-base rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear relative"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fcd34d)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted mt-1.5">
                  <span className="font-mono">{formatFull(liveAccumulated)} CRS</span>
                  <span className="font-mono">{formatFull(dailyReward)} CRS</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Timer className="h-3.5 w-3.5" />
                <span className="font-mono">Elapsed: {formatCountdown(elapsed)}</span>
                <span className="text-border">·</span>
                <span>Rate: ~{formatFull(dailyReward / 24)} CRS/hr</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-2xl bg-bg-base border border-border flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-muted" />
              </div>
              <p className="text-sm text-white font-medium mb-1">Start {pkg?.name} Mining</p>
              <p className="text-xs text-muted mb-4">
                Earn {formatFull(dailyReward)} CRS per day. No daily cap — mine continuously.
              </p>
            </div>
          )}
        </div>

        {isMining ? (
          <div className="space-y-2">
            <Button
              variant="gold"
              className="w-full"
              size="lg"
              loading={claiming}
              disabled={!canClaim}
              onClick={handleClaim}
            >
              <Zap className="h-5 w-5" />
              {canClaim
                ? `Claim ${formatFull(Math.floor(liveAccumulated))} CRS`
                : `Claim in ${formatCountdown(claimRemaining)}`}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              loading={toggling}
              onClick={handleStop}
            >
              <Square className="h-4 w-4" /> Stop Mining
            </Button>
          </div>
        ) : (
          <Button
            variant="gold"
            className="w-full"
            size="lg"
            loading={toggling}
            onClick={handleStart}
          >
            <Play className="h-5 w-5" /> Start Mining
          </Button>
        )}
      </div>
    </Card>
  );
}
