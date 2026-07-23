'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline-variant min-h-[64px] flex items-center px-md lg:px-lg w-full">
      <div className="flex justify-between items-center w-full max-w-container-max mx-auto">
        {/* Left: Mobile Menu Toggle & Mobile Brand */}
        <div className="flex items-center gap-md md:hidden">
          <button
            onClick={onMenuToggle}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-geist text-xl font-bold text-primary">LMS Enterprise</span>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mr-lg">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Search courses, modules, skills..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-full text-xs font-inter text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Right Actions & User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/60"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-geist font-bold text-xs shadow-sm">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="font-geist text-xs font-semibold text-on-surface leading-tight truncate max-w-[120px]">
                  {currentUser?.name || 'User'}
                </p>
                <p className="font-inter text-[10px] text-on-surface-variant font-medium">
                  {currentUser?.department || currentUser?.role || 'Agent'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-outline hidden sm:block" />
            </button>

            {/* Menu Popover */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-outline-variant/30">
                  <p className="font-geist text-sm font-bold text-on-surface">{currentUser?.name}</p>
                  <p className="font-inter text-xs text-on-surface-variant truncate">{currentUser?.email}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider bg-primary-fixed/50 px-2 py-0.5 rounded-md border border-primary/20">
                    <ShieldCheck className="w-3 h-3" /> {currentUser?.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-geist text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    <User className="w-4 h-4 text-outline" /> My Profile
                  </Link>
                </div>

                <div className="border-t border-outline-variant/30 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-geist text-error hover:bg-error-container/30 transition-colors text-left cursor-pointer"
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
