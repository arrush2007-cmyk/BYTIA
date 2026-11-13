import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { X, Mail, Lock, User as UserIcon, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { ensureUserProfiles } from '../services/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'reset';

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const mapAuthError = (err: unknown): string => {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/operation-not-allowed') {
      return 'Email/Password sign-in is not yet enabled in Firebase Console (Authentication > Sign-in method). You can use Google Sign-In immediately, or enable Email/Password in Firebase Console.';
    }
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists. Please sign in instead.';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters long.';
    if (code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed before completing.';
    return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserProfiles(cred.user);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'reset') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessMessage(`Password reset link sent to ${email.trim()}. Check your inbox.`);
      } catch (err) {
        setError(mapAuthError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register' && name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Non-fatal if rate-limited
        }
        if (cred.user.emailVerified) {
          await ensureUserProfiles(cred.user, { name: name.trim(), location: location.trim() });
        }
        onSuccess?.();
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await ensureUserProfiles(cred.user);
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#263238]/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-[#263238]/10 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263238]/10">
          <div>
            <h2 id="auth-modal-title" className="font-display text-xl font-bold text-[#263238]">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'register' && 'Create your circular profile'}
              {mode === 'reset' && 'Reset your password'}
            </h2>
            <p className="text-xs text-[#263238]/70 mt-0.5">
              Save AI waste scans, exchange items locally, and track verified impact.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="p-2 rounded-lg text-[#263238]/70 hover:bg-[#E8F5E9] hover:text-[#1B5E20] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {mode !== 'reset' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-[#263238]/20 bg-white hover:bg-[#F7F9F5] text-sm font-semibold text-[#263238] flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.54-5.17 3.54-8.97z"
                  />
                  <path
                    fill="#34A853"
                    d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96h-3.98v3.14C3.535 21.31 7.605 24 12.255 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.535 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62h-3.98C.575 8.57 0 10.74 0 12s.575 3.43 1.555 5.38l3.98-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0 7.605 0 3.535 2.69 1.555 6.62l3.98 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 text-xs text-[#263238]/50">
                <span className="flex-1 h-px bg-[#263238]/10" />
                <span>or with email</span>
                <span className="flex-1 h-px bg-[#263238]/10" />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-[#E8F5E9] border border-[#4CAF50]/40 text-xs text-[#1B5E20] flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-medium text-[#263238] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Rivera"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-location" className="block text-xs font-medium text-[#263238] mb-1">
                    City / Region (optional)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Portland, OR"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[#263238] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="auth-password" className="block text-xs font-medium text-[#263238]">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        setMode('reset');
                      }}
                      className="text-xs font-medium text-[#1B5E20] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#263238]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#263238]/20 focus:outline-none focus:border-[#1B5E20]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1B5E20] hover:bg-[#144718] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading
                ? 'Working...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : 'Send Reset Link'}
            </button>
          </form>

          <div className="pt-2 border-t border-[#263238]/10 text-center text-xs text-[#263238]/75">
            {mode === 'login' && (
              <>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('register');
                  }}
                  className="font-semibold text-[#1B5E20] hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </>
            )}
            {mode === 'register' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMessage(null);
                    setMode('login');
                  }}
                  className="font-semibold text-[#1B5E20] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="font-semibold text-[#1B5E20] hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
