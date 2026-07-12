import { classNames } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'pending' | 'danger' | 'info' | 'gold';
  className?: string;
}

const variants = {
  success: 'bg-brand-500/15 text-brand-300 border border-brand-500/30',
  pending: 'bg-gold-500/15 text-gold-400 border border-gold-500/30',
  danger: 'bg-danger-500/15 text-danger-400 border border-danger-500/30',
  info: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  gold: 'bg-gold-500/15 text-gold-400 border border-gold-500/30',
};

export function Badge({ children, variant = 'info', className }: BadgeProps) {
  return <span className={classNames('badge', variants[variant], className)}>{children}</span>;
}
