export interface Profile {
  id: string;
  email: string;
  referral_code: string;
  referred_by: string | null;
  is_admin: boolean;
  wallet_balance: number;
  total_mined: number;
  referral_earnings: number;
  last_claim_at: string | null;
  free_mined_today: number;
  free_mined_date: string | null;
  mining_active: boolean;
  mining_started_at: string | null;
  mining_accumulated: number;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  price_usdt: number;
  daily_reward: number;
  mining_speed: string;
  duration_days: number;
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserPackage {
  id: string;
  user_id: string;
  package_id: string;
  status: 'pending' | 'active' | 'expired';
  activated_at: string | null;
  expires_at: string | null;
  daily_reward: number;
  mining_speed: string;
  created_at: string;
  package?: Package;
}

export interface MiningRecord {
  id: string;
  user_id: string;
  user_package_id: string | null;
  date: string;
  mined_amount: number;
  claimed_amount: number;
  created_at: string;
}

export interface Claim {
  id: string;
  user_id: string;
  amount: number;
  source: 'free' | 'paid';
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  package_id: string;
  email: string;
  amount_usdt: number;
  tx_hash: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  package?: Package;
  profile?: Pick<Profile, 'email' | 'referral_code'>;
}

export interface ActivationPin {
  id: string;
  user_id: string;
  payment_id: string | null;
  pin: string;
  status: 'unused' | 'used';
  created_at: string;
  used_at: string | null;
  profile?: Pick<Profile, 'email'>;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: 'pending' | 'activated';
  reward_amount: number;
  created_at: string;
  activated_at: string | null;
  referred?: Pick<Profile, 'email' | 'referral_code'>;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  profile?: Pick<Profile, 'email' | 'referral_code'>;
}

export interface Settings {
  id: number;
  referral_percentage: number;
  free_mining_limit: number;
  claim_interval_minutes: number;
  usdt_trc20_address: string;
  updated_at: string;
}

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
