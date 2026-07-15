import { Link } from 'react-router-dom';
import {
  Cpu, Zap, Shield, Gift, TrendingUp, Users, ArrowRight, CheckCircle2,
  Wallet, Coins, Lock,
} from 'lucide-react';
import { PublicNavbar, Footer } from '../../components/Navigation';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AdSlot } from '../../components/AdSlot';
import { formatNumber } from '../../lib/utils';

const features = [
  { icon: Cpu, title: 'Cloud Mining Simulation', desc: 'Activate mining packages and earn CeylonRS tokens every 5 minutes. No hardware required.' },
  { icon: Shield, title: 'Secure Platform', desc: 'Bank-grade encryption with Supabase authentication. Your account and tokens are safe.' },
  { icon: Gift, title: 'Referral Rewards', desc: 'Invite friends and earn bonus CeylonRS when they activate a paid mining package.' },
  { icon: Wallet, title: 'Internal Wallet', desc: 'Track your balance, mining history, and request withdrawals to your wallet address.' },
];

const stats = [
  { label: 'Total Users', value: '12,847' },
  { label: 'Tokens Mined', value: '8.4B+' },
  { label: 'Active Miners', value: '3,210' },
  { label: 'Paid Out', value: '$1.2M' },
];

const steps = [
  { icon: Lock, title: 'Create Account', desc: 'Sign up free with your email and get your unique referral code instantly.' },
  { icon: Zap, title: 'Start Free Mining', desc: 'Claim up to 1,000 CeylonRS daily with our free mining package. No cost.' },
  { icon: TrendingUp, title: 'Upgrade & Earn More', desc: 'Activate paid packages with USDT TRC-20 for higher daily rewards.' },
  { icon: Coins, title: 'Withdraw Earnings', desc: 'Request withdrawals to your CeylonRS wallet address anytime.' },
];

export function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] opacity-30" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 h-64 w-[600px] bg-brand-500/10 blur-[120px] rounded-full" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-6 animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse" />
              Now live — Start mining in minutes
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Mine <span className="text-gradient-brand">CeylonRS</span> tokens.
              <br />Earn on autopilot.
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto mt-6">
              A professional crypto reward & mining simulation platform. Claim free tokens every 5 minutes,
              upgrade to premium packages, and grow your portfolio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button size="lg" onClick={() => (window.location.href = '/register')}>
                Start Free Mining <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="lg" onClick={() => (window.location.href = '/packages')}>
                View Packages
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{s.value}</p>
                  <p className="text-xs text-muted mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <AdSlot position="top" />

        {/* Features */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Why CeylonRS?</h2>
            <p className="text-muted mt-3">Everything you need to simulate a real mining operation</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Card key={f.title} hover className="p-6">
                <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-muted mt-2">{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        <AdSlot position="middle" />

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">How It Works</h2>
            <p className="text-muted mt-3">Four simple steps to start earning</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <Card className="p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-bold text-border font-mono">0{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                  <p className="text-sm text-muted mt-2">{s.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <Card className="relative overflow-hidden p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-gold-500/10" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white">Ready to start mining?</h2>
              <p className="text-muted mt-3 max-w-lg mx-auto">
                Join thousands of miners earning CeylonRS tokens daily. Free to start, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Link to="/register"><Button size="lg">Create Free Account</Button></Link>
                <Link to="/packages"><Button variant="ghost" size="lg">Explore Packages</Button></Link>
              </div>
            </div>
          </Card>
        </section>

        <AdSlot position="bottom" />
      </main>
      <Footer />
    </div>
  );
}

export function PackagesPage() {
  const packages = [
    { name: 'Free Mining', price: 0, daily: 1000, speed: '0.69/min', duration: 'Unlimited', free: true, features: ['1,000 CRS daily limit', 'Claim every 5 minutes', 'No payment required', 'Referral code included'] },
    { name: 'CeylonRS Starter', price: 23, daily: 217600, speed: '9,066/hr', duration: '365 days', free: false, popular: false, features: ['217,600 CRS daily', 'Auto-mining 24/7', 'Priority support', 'Referral bonus unlocked'] },
    { name: 'CeylonRS Bronze', price: 55, daily: 520348, speed: '21,681/hr', duration: '365 days', free: false, popular: true, features: ['520,348 CRS daily', 'Auto-mining 24/7', 'Priority support', 'Higher referral rate'] },
    { name: 'CeylonRS Silver', price: 115, daily: 1088000, speed: '45,333/hr', duration: '365 days', free: false, popular: false, features: ['1.08M CRS daily', 'Auto-mining 24/7', 'Priority support', 'Higher referral rate'] },
    { name: 'CeylonRS Gold', price: 550, daily: 5203478, speed: '216,811/hr', duration: '365 days', free: false, popular: false, features: ['5.2M CRS daily', 'Auto-mining 24/7', 'VIP support', 'Max referral rate'] },
    { name: 'CeylonRS Diamond', price: 1150, daily: 10880000, speed: '453,333/hr', duration: '365 days', free: false, popular: false, features: ['10.88M CRS daily', 'Auto-mining 24/7', 'VIP support', 'Max referral rate'] },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Mining Packages</h1>
            <p className="text-muted mt-3 max-w-lg mx-auto">
              Choose a package that fits your goals. Free mining available — upgrade anytime with USDT TRC-20.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <Card key={pkg.name} hover className={`p-6 relative ${pkg.popular ? 'border-brand-500/50' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge bg-brand-500 text-bg-base">Most Popular</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  {pkg.free ? (
                    <span className="badge bg-brand-500/15 text-brand-300 border border-brand-500/30">FREE</span>
                  ) : (
                    <span className="badge bg-gold-500/15 text-gold-400 border border-gold-500/30">PAID</span>
                  )}
                </div>
                <div className="mb-5">
                  {pkg.free ? (
                    <p className="text-3xl font-bold text-white">$0<span className="text-sm text-muted font-normal">/free</span></p>
                  ) : (
                    <p className="text-3xl font-bold text-white">${pkg.price}<span className="text-sm text-muted font-normal"> USDT</span></p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-xs text-muted">Daily Reward</p>
                    <p className="text-sm font-bold text-brand-400 font-mono">{formatNumber(pkg.daily)}</p>
                  </div>
                  <div className="bg-bg-elevated rounded-xl p-3">
                    <p className="text-xs text-muted">Mining Speed</p>
                    <p className="text-sm font-bold text-white font-mono">{pkg.speed}</p>
                  </div>
                </div>
                <p className="text-xs text-muted mb-3">Duration: <span className="text-white font-medium">{pkg.duration}</span></p>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button variant={pkg.popular ? 'primary' : 'ghost'} className="w-full">
                    {pkg.free ? 'Start Free' : 'Get Started'}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
        <AdSlot position="bottom" />
      </main>
      <Footer />
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center">About CeylonRS</h1>
          <div className="card p-6 sm:p-10 mt-8 space-y-6 text-gray-300 leading-relaxed">
            <p>
              <span className="text-brand-400 font-semibold">CeylonRS</span> is a next-generation crypto reward
              and mining simulation platform designed to provide users with a realistic, engaging mining experience
              without the need for expensive hardware or technical knowledge.
            </p>
            <p>
              Our platform uses a database-backed token reward system that simulates real blockchain mining.
              The architecture is designed to seamlessly connect to a live blockchain network in the future,
              making the transition from simulation to real mining smooth and transparent.
            </p>
            <h2 className="text-xl font-bold text-white pt-2">Key Features</h2>
            <ul className="space-y-3">
              {[
                'Free mining with up to 1,000 CeylonRS daily — claim every 5 minutes',
                'Five premium mining packages with proportional daily rewards',
                'USDT TRC-20 payment system with admin approval workflow',
                '8-digit activation PIN system for secure package activation',
                'Internal wallet with mining history and withdrawal requests',
                'Referral system with bonus rewards on paid package activation',
                'Secure admin dashboard for full platform management',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
            <h2 className="text-xl font-bold text-white pt-2">Our Vision</h2>
            <p>
              We aim to democratize access to crypto mining by removing barriers to entry. Whether you're a
              beginner or an experienced crypto enthusiast, CeylonRS provides the tools and infrastructure to
              participate in the digital economy.
            </p>
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Users className="h-5 w-5 text-brand-400" />
              <p className="text-sm text-muted">Join 12,000+ miners already earning with CeylonRS.</p>
            </div>
          </div>
        </section>
        <AdSlot position="bottom" />
      </main>
      <Footer />
    </div>
  );
}
