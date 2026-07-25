'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Bell, Menu, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  onMenuToggle?: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (!currentUser && typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_access_token');
      localStorage.removeItem('lms_user');
      router.push('/login');
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 min-h-[72px] flex items-center px-6 lg:px-8 w-full shadow-sm">
      <div className="flex justify-between items-center w-full">
        {/* Left: Brand & Nav Tabs */}
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#4d44e3] flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="font-geist font-bold text-sm">L</span>
            </div>
            <span className="font-geist text-lg font-bold text-slate-900">LMS Admin</span>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/dashboard"
              className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                !pathname?.startsWith('/admin') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Training Center
            </Link>
            {isAdmin && (
              <Link 
                href="/admin/analytics"
                className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                  pathname?.startsWith('/admin') ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses, users, or reports..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-inter text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4d44e3] focus:ring-1 focus:ring-[#4d44e3] transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Right Actions & User Menu */}
        <div className="flex items-center gap-4">
          {isAdmin && (
            <>
              <button className="hidden sm:block px-4 py-2 text-sm font-inter font-medium text-slate-500 hover:text-slate-900 transition-colors">
                Switch Role
              </button>
              <Link 
                href="/admin/courses/builder"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#4d44e3] hover:bg-[#3b32d1] text-white rounded-lg text-sm font-inter font-medium transition-colors shadow-sm"
              >
                Create Course
              </Link>
            </>
          )}

          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

          {/* Notifications & Help */}
          <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-[#4d44e3] flex items-center justify-center font-geist font-bold text-sm shadow-sm border border-indigo-200">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block ml-1" />
            </button>

            {/* Menu Popover */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-geist text-sm font-bold text-slate-900">{currentUser?.name}</p>
                  <p className="font-inter text-xs text-slate-500 truncate">{currentUser?.email}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#4d44e3] uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md">
                    <ShieldCheck className="w-3 h-3" /> {currentUser?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm font-inter text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" /> My Profile
                  </Link>
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-inter text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
