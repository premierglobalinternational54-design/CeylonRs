import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Gift } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/Logo';

export function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast('error', error);
    } else {
      toast('success', 'Welcome back!');
      navigate('/dashboard');
    }
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to your CeylonRS account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />}
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input label="Password" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />}
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <Button type="submit" className="w-full" loading={loading} size="lg">Sign In</Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-400 font-semibold hover:text-brand-300">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const refCode = params.get('ref') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [referral, setReferral] = useState(refCode);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Min 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email, password, referral || undefined);
    setLoading(false);
    if (error) {
      toast('error', error);
    } else {
      toast('success', 'Account created! Check your email to verify.');
      navigate('/dashboard');
    }
  };

  return (
    <AuthShell title="Create Account" subtitle="Start mining CeylonRS tokens today">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />}
          value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <Input label="Password" type="password" placeholder="Min 6 characters" icon={<Lock className="h-4 w-4" />}
          value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <Input label="Confirm Password" type="password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <Input label="Referral Code (optional)" placeholder="e.g. AB12CD34" icon={<Gift className="h-4 w-4" />}
          value={referral} onChange={(e) => setReferral(e.target.value)} />
        {referral && (
          <p className="text-xs text-brand-400 flex items-center gap-1.5">
            <User className="h-3 w-3" /> Referred by {referral}
          </p>
        )}
        <Button type="submit" className="w-full" loading={loading} size="lg">Create Account</Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300">Sign in</Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          <div className="card p-6 sm:p-8 animate-slide-up">
            <h1 className="text-2xl font-bold text-white text-center">{title}</h1>
            <p className="text-sm text-muted text-center mt-1 mb-6">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
