import type { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  hover?: boolean;
}

export function Card({ children, className, elevated, hover }: CardProps) {
  return (
    <div className={classNames(
      elevated ? 'card-elevated' : 'card',
      hover && 'transition-all duration-200 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5',
      className,
    )}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: 'brand' | 'gold' | 'blue' | 'danger';
  sub?: string;
}

const accentMap = {
  brand: 'text-brand-400 bg-brand-500/10',
  gold: 'text-gold-400 bg-gold-500/10',
  blue: 'text-blue-400 bg-blue-500/10',
  danger: 'text-danger-400 bg-danger-500/10',
};

export function StatCard({ label, value, icon, accent = 'brand', sub }: StatCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">{label}</p>
          <p className="stat-value mt-2 truncate">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className={classNames('shrink-0 h-10 w-10 rounded-xl flex items-center justify-center', accentMap[accent])}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
