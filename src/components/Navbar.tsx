import {
  BarChart3,
  BookOpen,
  Camera,
  Home,
  Repeat,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { AppRoute, UserProfile } from '../types/sustainability';

interface NavbarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  user: User | null;
  profile: UserProfile | null;
  onOpenAuth: () => void;
  onResendVerification: () => Promise<void>;
  onRefreshVerification: () => Promise<void>;
  verificationNotice?: string | null;
}

const DESKTOP_LINKS: { route: AppRoute; label: string }[] = [
  { route: 'home', label: 'Home' },
  { route: 'scanner', label: 'AI Scanner' },
  { route: 'community', label: 'Exchange' },
  { route: 'guide', label: 'Recycling Guide' },
  { route: 'dashboard', label: 'Impact' },
];

const MOBILE_LINKS: { route: AppRoute; label: string; icon: typeof Home }[] = [
  { route: 'home', label: 'Home', icon: Home },
  { route: 'scanner', label: 'Scan', icon: Camera },
  { route: 'community', label: 'Exchange', icon: Repeat },
  { route: 'guide', label: 'Guide', icon: BookOpen },
  { route: 'dashboard', label: 'Impact', icon: BarChart3 },
  { route: 'profile', label: 'Profile', icon: UserIcon },
];

export function Navbar({
  activeRoute,
  onNavigate,
  user,
  profile,
  onOpenAuth,
  onResendVerification,
  onRefreshVerification,
  verificationNotice,
}: NavbarProps) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#F7F9F5]/95 backdrop-blur-sm border-b border-[#263238]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="font-display text-lg font-bold tracking-tight text-[#1B5E20] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#1B5E20] rounded"
          >
            Before You Throw It Away
          </a>

          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            {DESKTOP_LINKS.map((item) => {
              const isActive = activeRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`py-2 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B5E20] ${
                    isActive
                      ? 'text-[#1B5E20] border-[#1B5E20]'
                      : 'text-[#263238]/75 border-transparent hover:text-[#1B5E20]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B5E20] ${
                  activeRoute === 'profile'
                    ? 'bg-[#1B5E20] text-white'
                    : 'bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#1B5E20] hover:text-white'
                }`}
              >
                {profile?.name ? `${profile.name.split(' ')[0]} · Profile` : 'My Profile'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#1B5E20] text-white hover:bg-[#144718] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1B5E20]"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {user && !user.emailVerified && (
          <div className="bg-[#DCC9A3]/35 border-t border-[#263238]/10 px-4 py-2">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#263238]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#1B5E20] shrink-0" />
                <span>
                  Verify your email address (<strong>{user.email}</strong>) to unlock saving scans, posting listings, and earning eco-points.
                </span>
                {verificationNotice && <span className="font-medium text-[#1B5E20]">{verificationNotice}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onResendVerification}
                  className="px-3 py-1 rounded border border-[#263238]/20 bg-white hover:bg-[#E8F5E9] font-medium cursor-pointer"
                >
                  Resend Email
                </button>
                <button
                  type="button"
                  onClick={onRefreshVerification}
                  className="px-3 py-1 rounded bg-[#1B5E20] text-white hover:bg-[#144718] font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  I Verified
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[#263238]/10 px-1 py-1"
      >
        <div className="grid grid-cols-6 gap-0.5">
          {MOBILE_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[44px] flex flex-col items-center justify-center rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-[#1B5E20] bg-[#E8F5E9]' : 'text-[#263238]/70 hover:text-[#1B5E20]'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="truncate max-w-full px-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
