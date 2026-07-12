import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/packages', label: 'Mining' },
  { to: '/about', label: 'About' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center gap-1">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
              {profile?.is_admin && (
                <Button variant="gold" size="sm" onClick={() => navigate('/admin')}>
                  Admin
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" onClick={() => navigate('/register')}>Get Started</Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-bg-hover" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg-card animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {publicLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `nav-link block ${isActive ? 'nav-link-active' : ''}`}
              >
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-border mt-2 space-y-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setOpen(false); navigate('/dashboard'); }}>
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                  {profile?.is_admin && (
                    <Button variant="gold" size="sm" className="w-full" onClick={() => { setOpen(false); navigate('/admin'); }}>
                      Admin Panel
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => { setOpen(false); navigate('/login'); }}>
                    Login
                  </Button>
                  <Button size="sm" className="w-full" onClick={() => { setOpen(false); navigate('/register'); }}>
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function DashboardNavbar() {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/mining', label: 'Mining', icon: LayoutDashboard },
    { to: '/wallet', label: 'Wallet', icon: LayoutDashboard },
    { to: '/referral', label: 'Referral', icon: LayoutDashboard },
    { to: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg-base/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo size="sm" />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/dashboard'}
              className={({ isActive }) => `nav-link flex items-center gap-1.5 ${isActive ? 'nav-link-active' : ''}`}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </NavLink>
          ))}
          {profile?.is_admin && (
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted">{profile?.email}</p>
            <p className="text-sm font-mono text-brand-400">{profile?.wallet_balance.toFixed(2)} CRS</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
        <button className="md:hidden p-2 rounded-lg hover:bg-bg-hover" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-bg-card animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/dashboard'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `nav-link flex items-center gap-2 ${isActive ? 'nav-link-active' : ''}`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </NavLink>
            ))}
            {profile?.is_admin && (
              <NavLink to="/admin" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link block ${isActive ? 'nav-link-active' : ''}`}>
                Admin
              </NavLink>
            )}
            <button onClick={handleSignOut} className="nav-link flex items-center gap-2 w-full text-left text-danger-400">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-card mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="text-sm text-muted mt-3 max-w-xs">
              The next-generation crypto reward & mining simulation platform. Earn, refer, and grow.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/packages" className="hover:text-brand-400">Mining Packages</Link></li>
              <li><Link to="/about" className="hover:text-brand-400">About</Link></li>
              <li><Link to="/register" className="hover:text-brand-400">Get Started</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link to="/dashboard" className="hover:text-brand-400">Dashboard</Link></li>
              <li><Link to="/wallet" className="hover:text-brand-400">Wallet</Link></li>
              <li><Link to="/referral" className="hover:text-brand-400">Referrals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Network</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>USDT TRC-20 Payments</li>
              <li>Secure & Encrypted</li>
              <li>24/7 Support</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted">
          <p>© {new Date().getFullYear()} CeylonRS. All rights reserved.</p>
          <p>Simulation platform — not real blockchain mining.</p>
        </div>
      </div>
    </footer>
  );
}
