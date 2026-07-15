import { useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, ArrowDownToLine, Package, KeyRound,
  Settings as SettingsIcon, LogOut, Menu, X, Shield, Megaphone,
} from 'lucide-react';
import { Logo } from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { classNames } from '../../lib/utils';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowDownToLine },
  { to: '/admin/packages', label: 'Packages', icon: Package },
  { to: '/admin/pins', label: 'PINs', icon: KeyRound },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { to: '/admin/ads', label: 'Ads', icon: Megaphone },
];

export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-60 border-r border-border bg-bg-card flex-col fixed h-screen">
        <div className="p-4 border-b border-border">
          <Logo size="sm" />
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gold-400">
            <Shield className="h-3 w-3" /> Admin Panel
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => classNames(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                isActive ? 'bg-brand-500/15 text-brand-300' : 'text-muted hover:text-white hover:bg-bg-hover',
              )}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-bg-card border-b border-border h-14 flex items-center justify-between px-4">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gold-400 flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-bg-hover">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30 pt-14" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute top-14 left-0 right-0 bg-bg-card border-b border-border p-3 space-y-1 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) => classNames(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition',
                  isActive ? 'bg-brand-500/15 text-brand-300' : 'text-muted hover:text-white hover:bg-bg-hover',
                )}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </NavLink>
            ))}
            <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2.5 w-full text-left text-sm text-danger-400 hover:bg-bg-hover rounded-lg">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-2xl font-bold text-white mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
