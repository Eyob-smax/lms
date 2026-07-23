'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { accessToken, user } = res.data;

      if (accessToken) {
        localStorage.setItem('lms_access_token', accessToken);
        localStorage.setItem('lms_user', JSON.stringify(user));

        if (user.role === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    // Redirect to backend OAuth endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Side: Graphic / Illustration Panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-high items-center justify-center p-2xl overflow-hidden">
        {/* Abstract Decorative Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/15 via-surface-container-high to-primary-container/20">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary-container/30 blur-3xl" />
        </div>

        {/* Foreground Glass Card */}
        <div className="relative z-10 max-w-lg text-center bg-surface/85 backdrop-blur-xl p-xl rounded-xl border border-outline-variant shadow-2xl">
          <div className="mb-lg inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-primary/20">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-geist text-3xl font-bold text-on-surface mb-md tracking-tight">
            Empower Your Workforce
          </h2>
          <p className="font-inter text-base text-on-surface-variant leading-relaxed mb-lg">
            Access cutting-edge BPO training modules, track performance metrics in real time, and drive institutional excellence from a single unified portal.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider bg-primary-fixed/50 py-2 px-4 rounded-full w-fit mx-auto border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" /> Enterprise Compliance Verified
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-md sm:p-xl lg:p-3xl bg-surface-container-lowest relative z-10 shadow-[-12px_0_32px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-2xl">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-geist text-2xl font-black text-on-surface tracking-tight block">
                LMS Enterprise
              </span>
              <span className="text-xs text-on-surface-variant font-medium">BPO Training & Evaluation Portal</span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="mb-xl">
            <h1 className="font-geist text-3xl font-bold text-on-surface mb-xs tracking-tight">
              Welcome back
            </h1>
            <p className="font-inter text-base text-on-surface-variant">
              Please enter your details to sign in to your workspace.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-lg p-md rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-start gap-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-lg">
            {/* Email Input */}
            <div className="space-y-1">
              <label className="block font-geist text-sm font-semibold text-on-surface" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent.name@bpo.com"
                  className="block w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block font-geist text-sm font-semibold text-on-surface" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-outline hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                Remember me
              </label>
              <a href="#" className="text-sm font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-geist font-semibold text-sm text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Social OAuth Divider */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-outline-variant" />
                <span className="flex-shrink mx-4 font-geist text-xs text-on-surface-variant uppercase tracking-wider">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-outline-variant" />
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant rounded-lg font-geist font-medium text-sm text-on-surface hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin('github')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-outline-variant rounded-lg font-geist font-medium text-sm text-on-surface hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-xl text-center">
            <p className="font-inter text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link href="/signup" className="font-geist font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors">
                Sign up as Agent / Trainer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
