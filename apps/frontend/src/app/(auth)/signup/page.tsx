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
          router.push('/admin/dashboard');
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
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Left Side: Graphic / Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface-container-high items-center justify-center p-2xl overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/15 via-surface-container-high to-secondary-container/20">
          <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-primary-container/20 blur-3xl" />
        </div>

        {/* Glass Card */}
        <div className="relative z-10 max-w-lg text-center bg-surface/85 backdrop-blur-xl p-xl rounded-xl border border-outline-variant shadow-2xl">
          <div className="mb-lg inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container shadow-lg ring-4 ring-secondary-container/30">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="font-geist text-3xl font-bold text-on-surface mb-md tracking-tight">
            Join the LMS Portal
          </h2>
          <p className="font-inter text-base text-on-surface-variant leading-relaxed mb-lg">
            Create your account to start interactive onboarding courses, access AI-generated skill assessments, and track your career growth.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider bg-secondary-container/40 py-2 px-4 rounded-full w-fit mx-auto border border-secondary/20">
            <ShieldCheck className="w-4 h-4" /> Seamless Role-Based Access Control
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-md sm:p-xl lg:p-3xl bg-surface-container-lowest relative z-10 shadow-[-12px_0_32px_rgba(0,0,0,0.03)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center gap-3 mb-xl">
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

          <div className="mb-lg">
            <h1 className="font-geist text-3xl font-bold text-on-surface mb-xs tracking-tight">
              Create an account
            </h1>
            <p className="font-inter text-base text-on-surface-variant">
              Select your role and department to set up your workspace.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-md p-md rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-start gap-3 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSignUp} className="space-y-md">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block font-geist text-sm font-semibold text-on-surface" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full pl-11 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface placeholder:text-outline-variant focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block font-geist text-sm font-semibold text-on-surface" htmlFor="email">
                Work Email Address
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
                  placeholder="jane.doe@bpo.com"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Role & Department Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Account Role Selector */}
              <div className="space-y-1">
                <label className="block font-geist text-sm font-semibold text-on-surface">
                  Account Role
                </label>
                <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setRole('AGENT')}
                    className={`flex-1 py-1.5 px-2 text-xs font-geist font-semibold rounded-md transition-all ${
                      role === 'AGENT'
                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Frontline Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`flex-1 py-1.5 px-2 text-xs font-geist font-semibold rounded-md transition-all ${
                      role === 'ADMIN'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Trainer / Admin
                  </button>
                </div>
              </div>

              {/* Department / BPO Service Line */}
              <div className="space-y-1">
                <label className="block font-geist text-sm font-semibold text-on-surface" htmlFor="department">
                  Department / Team
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all text-xs font-semibold shadow-sm cursor-pointer"
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
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-geist font-semibold text-sm text-on-primary bg-primary hover:bg-on-primary-fixed-variant focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-md disabled:opacity-50 cursor-pointer mt-4"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-lg text-center">
            <p className="font-inter text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link href="/login" className="font-geist font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
