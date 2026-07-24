'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Mail, Lock, User, Building2, UserCheck, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
  const [department, setDepartment] = useState('SDR');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        role,
        department,
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
      const msg = err.response?.data?.message || 'Registration failed. Please check your information and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen font-inter bg-white">
      {/* Left Side: Soft Pastel Gradient Banner + Floating Card */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#dbe4ff] via-[#e8eeff] to-[#f4f7ff] items-center justify-center p-12 overflow-hidden">
        {/* Soft Background Radial Blurs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />

        {/* Floating Centered White Card */}
        <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl p-10 rounded-2xl border border-white/80 shadow-2xl shadow-indigo-100/60 text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#4d44e3] text-white shadow-lg shadow-indigo-300/50">
            <UserCheck className="w-8 h-8" />
          </div>
          
          <h2 className="font-geist text-2xl font-bold text-slate-900 mb-3 tracking-tight">
            Join the LMS Portal
          </h2>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Create your account to start interactive onboarding courses, access AI-generated skill assessments, and track your career growth.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4d44e3] bg-[#4d44e3]/10 py-2 px-4 rounded-full border border-[#4d44e3]/20">
            <ShieldCheck className="w-4 h-4 text-[#4d44e3]" /> Role-Based Access Control Enabled
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
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

          <div className="mb-6">
            <h1 className="font-geist text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-slate-500">
              Select your role and department to set up your workspace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                Work Email Address
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
                  placeholder="jane.doe@bpo.com"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Role & Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account Role
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      role === 'AGENT'
                        ? 'bg-white text-[#4d44e3] shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      role === 'ADMIN'
                        ? 'bg-[#4d44e3] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              {/* Department / BPO Service Line */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="department">
                  Department
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="BDR">BDR (Business Dev)</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="IT">IT Support</option>
                    <option value="HR">HR & Management</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#4d44e3] hover:bg-[#3b32d1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4d44e3] transition-all shadow-lg shadow-[#4d44e3]/25 disabled:opacity-50 cursor-pointer mt-4"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-[#4d44e3] hover:text-[#3b32d1] transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
