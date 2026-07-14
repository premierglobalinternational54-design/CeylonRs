import { useEffect, useRef, useState } from 'react';
import { Play, Square, Zap, Timer, Cpu, Activity } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatFull, formatCountdown, classNames } from '../../lib/utils';
import type { Settings } from '../../lib/types';

export function FreeMiningCard({ settings }: { settings: Settings | null }) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [toggling, setToggling] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local checkpoint: accumulated amount and timestamp at our last sync point.
  // Initialized from DB on profile change; updated on start, claim, and auto-save.
  // This prevents double-counting: live value = checkpointAmount + elapsed * rate.
  const [checkpointAmount, setCheckpointAmount] = useState(0);
  const [checkpointTime, setCheckpointTime] = useState(0);

  const dailyLimit = settings?.free_mining_limit ?? 1000;
  const intervalMs = (settings?.claim_interval_minutes ?? 5) * 60 * 1000;
  const ratePerMs = dailyLimit / (24 * 60 * 60 * 1000);

  const today = new Date().toISOString().slice(0, 10);
  const freeMinedToday = profile?.free_mined_date === today ? profile.free_mined_today : 0;
  const remainingToday = Math.max(0, dailyLimit - freeMinedToday);

  const isMining = profile?.mining_active ?? false;

  // Sync local checkpoint from DB whenever mining state or DB values change
  useEffect(() => {
    if (isMining && profile?.mining_started_at) {
      setCheckpointAmount(profile.mining_accumulated ?? 0);
      setCheckpointTime(new Date(profile.mining_started_at).getTime());
    } else {
      setCheckpointAmount(0);
      setCheckpointTime(0);
    }
  }, [isMining, profile?.mining_started_at, profile?.mining_accumulated]);

  // Tick every second for live display
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute live accumulated purely from checkpoint + elapsed time since checkpoint
  const liveAccumulated = isMining && checkpointTime
    ? Math.min(checkpointAmount + (now - checkpointTime) * ratePerMs, remainingToday)
    : 0;
  const elapsed = isMining && checkpointTime ? now - checkpointTime : 0;

  // Auto-save to DB every 30 seconds. Updates both mining_accumulated and
  // mining_started_at, then updates local checkpoint — no double-counting.
  useEffect(() => {
    if (!isMining || !profile) return;
    saveTimer.current = setInterval(async () => {
      const raw = checkpointAmount + (Date.now() - checkpointTime) * ratePerMs;
      const capped = Math.min(raw, remainingToday);
      const saveTime = new Date().toISOString();
      await supabase.from('profiles').update({
        mining_accumulated: capped,
        mining_started_at: saveTime,
      }).eq('id', profile.id);
      setCheckpointAmount(capped);
      setCheckpointTime(Date.now());
    }, 30000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [isMining, profile, checkpointAmount, checkpointTime, ratePerMs, remainingToday]);

  const progressPct = Math.min(100, (liveAccumulated / dailyLimit) * 100);

  // Claim cooldown
  const lastClaim = profile?.last_claim_at ? new Date(profile.last_claim_at).getTime() : 0;
  const nextClaimAt = lastClaim + intervalMs;
  const claimRemaining = Math.max(0, nextClaimAt - now);
  const canClaim = claimRemaining <= 0 && liveAccumulated > 0;

  const handleStart = async () => {
    if (!profile) return;
    if (remainingToday <= 0) {
      toast('error', 'Daily free mining limit reached. Try again tomorrow.');
      return;
    }
    setToggling(true);
    const startTime = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({
      mining_active: true,
      mining_started_at: startTime,
      mining_accumulated: 0,
    }).eq('id', profile.id);
    setToggling(false);
    if (error) {
      toast('error', 'Failed to start mining: ' + error.message);
      return;
    }
    setCheckpointAmount(0);
    setCheckpointTime(Date.now());
    await refreshProfile();
    toast('success', 'Mining started! Tokens are accumulating.');
  };

  const doClaim = async (stopAfter: boolean) => {
    if (!profile) return;
    const claimAmount = Math.floor(liveAccumulated);

    if (claimAmount <= 0) {
      if (stopAfter) {
        const { error } = await supabase.from('profiles').update({
          mining_active: false, mining_started_at: null, mining_accumulated: 0,
        }).eq('id', profile.id);
        if (error) { toast('error', error.message); return; }
        setCheckpointAmount(0);
        setCheckpointTime(0);
        await refreshProfile();
      }
      return;
    }

    const newFreeToday = (profile.free_mined_date === today ? profile.free_mined_today : 0) + claimAmount;
    const claimTime = new Date().toISOString();
    const claimMs = Date.now();

    const { error } = await supabase.from('profiles').update({
      mining_active: !stopAfter,
      mining_started_at: stopAfter ? null : claimTime,
      mining_accumulated: 0,
      wallet_balance: profile.wallet_balance + claimAmount,
      total_mined: profile.total_mined + claimAmount,
      last_claim_at: claimTime,
      free_mined_today: newFreeToday,
      free_mined_date: today,
    }).eq('id', profile.id);
    if (error) {
      toast('error', 'Claim failed: ' + error.message);
      return;
    }
    const { error: claimError } = await supabase.from('claims').insert({
      user_id: profile.id, amount: claimAmount, source: 'free',
    });
    if (claimError) {
      toast('error', 'Claim record failed: ' + claimError.message);
      return;
    }
    // Reset checkpoint so only new points accumulate after claim
    setCheckpointAmount(0);
    setCheckpointTime(stopAfter ? 0 : claimMs);
    await refreshProfile();
    toast('success', `Successfully claimed ${formatFull(claimAmount)} CRS!`);
  };

  const handleStop = async () => {
    if (!profile) return;
    setToggling(true);
    await doClaim(true);
    setToggling(false);
  };

  const handleClaim = async () => {
    if (!canClaim || !profile) return;
    setClaiming(true);
    await doClaim(false);
    setClaiming(false);
  };

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className={classNames(
        'absolute top-0 right-0 h-48 w-48 rounded-full blur-[80px] transition-opacity duration-500',
        isMining ? 'bg-brand-500/20 opacity-100' : 'bg-brand-500/5 opacity-50',
      )} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={classNames(
              'h-10 w-10 rounded-xl flex items-center justify-center transition-all',
              isMining ? 'bg-brand-500/20 text-brand-400 animate-pulse-glow' : 'bg-bg-elevated text-muted',
            )}>
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Free Mining</h2>
              <p className="text-xs text-muted">Earn up to {formatFull(dailyLimit)} CRS per day</p>
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
                <p className="text-4xl font-bold text-brand-400 font-mono tabular-nums">
                  {formatFull(liveAccumulated)}
                </p>
                <p className="text-xs text-muted mt-1">CRS accumulated</p>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>Progress to daily limit</span>
                  <span className="font-mono text-brand-400">{progressPct.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-bg-base rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear relative"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #2bbf7f, #16c474, #56dca0)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-muted mt-1.5">
                  <span className="font-mono">{formatFull(liveAccumulated)} CRS</span>
                  <span className="font-mono">{formatFull(dailyLimit)} CRS</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted">
                <Timer className="h-3.5 w-3.5" />
                <span className="font-mono">Elapsed: {formatCountdown(elapsed)}</span>
                <span className="text-border">·</span>
                <span>Rate: ~{formatFull(dailyLimit / 24)} CRS/hr</span>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-2xl bg-bg-base border border-border flex items-center justify-center mx-auto mb-4">
                <Cpu className="h-8 w-8 text-muted" />
              </div>
              <p className="text-sm text-white font-medium mb-1">Start Mining</p>
              <p className="text-xs text-muted mb-4">
                Press start to begin mining. Tokens accumulate automatically up to {formatFull(dailyLimit)} CRS over 24 hours.
              </p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-bg-base rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted">Remaining Today</p>
                  <p className="text-lg font-bold text-brand-400 font-mono">{formatFull(remainingToday)}</p>
                </div>
                <div className="bg-bg-base rounded-xl p-3 border border-border">
                  <p className="text-xs text-muted">Daily Limit</p>
                  <p className="text-lg font-bold text-white font-mono">{formatFull(dailyLimit)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {isMining ? (
          <div className="space-y-2">
            <Button
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
            className="w-full"
            size="lg"
            loading={toggling}
            disabled={remainingToday <= 0}
            onClick={handleStart}
          >
            <Play className="h-5 w-5" />
            {remainingToday <= 0 ? 'Daily Limit Reached' : 'Start Mining'}
          </Button>
        )}

        {isMining && !canClaim && (
          <p className="text-xs text-muted text-center mt-3">
            Wait {settings?.claim_interval_minutes ?? 5} minutes between claims
          </p>
        )}
      </div>
    </Card>
  );
}
