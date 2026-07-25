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
          router.push('/admin/analytics');
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
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://lms.wearecerta.app/api';
    window.location.href = `${backendUrl}/auth/sign-in/${provider}`;
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen lg:h-screen lg:overflow-hidden font-inter bg-white">
      {/* Left Side: Soft Pastel Gradient Banner + Floating Card */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#dbe4ff] via-[#e8eeff] to-[#f4f7ff] items-center justify-center p-12 overflow-hidden">
        {/* Soft Background Radial Blurs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />

        {/* Floating Centered White Card */}
        <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl p-10 rounded-2xl border border-white/80 shadow-2xl shadow-indigo-100/60 text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4d44e3] text-white shadow-lg shadow-indigo-300/50">
            <Sparkles className="w-8 h-8" />
          </div>
          
          <h2 className="font-geist text-2xl font-bold text-slate-900 mb-3 tracking-tight">
            Empower Your Workforce
          </h2>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Access cutting-edge BPO training modules, track performance metrics in real time, and drive institutional excellence from a single unified portal.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4d44e3] bg-[#4d44e3]/10 py-2 px-4 rounded-full border border-[#4d44e3]/20">
            <ShieldCheck className="w-4 h-4 text-[#4d44e3]" /> Enterprise Compliance Verified
          </div>
        </div>
      </div>

      {/* Right Side: Clean Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-10 bg-white relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#4d44e3] flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-geist text-xl font-bold text-slate-900 tracking-tight block">
                LMS Enterprise
              </span>
              <span className="text-xs text-slate-500 font-medium">BPO Training & Evaluation Portal</span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="mb-5">
            <h1 className="font-geist text-3xl font-bold text-slate-900 mb-1 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500">
              Please enter your details to sign in.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#4d44e3] focus:ring-[#4d44e3]"
                />
                Remember me
              </label>
              <a href="#" className="text-sm font-semibold text-[#4d44e3] hover:text-[#3b32d1] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#4d44e3] hover:bg-[#3b32d1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4d44e3] transition-all shadow-lg shadow-[#4d44e3]/25 disabled:opacity-50 cursor-pointer mt-1"
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
            <div className="pt-1.5">
              <div className="relative flex items-center justify-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Or continue with
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
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
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-xl font-medium text-sm text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-current text-slate-800" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          </form>

          {/* Footer Link */}
          <div className="mt-5 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-[#4d44e3] hover:text-[#3b32d1] transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
