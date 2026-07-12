import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { Toast, ToastType } from '../lib/types';

interface ToastCtx {
  toasts: Toast[];
  toast: (type: ToastType, message: string) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </Ctx.Provider>
  );
}

function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={[
            'animate-slide-up cursor-pointer rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md text-sm font-medium',
            t.type === 'success' && 'bg-brand-500/15 border-brand-500/40 text-brand-200',
            t.type === 'error' && 'bg-danger-500/15 border-danger-500/40 text-danger-400',
            t.type === 'info' && 'bg-bg-elevated border-border text-gray-200',
          ].filter(Boolean).join(' ')}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
