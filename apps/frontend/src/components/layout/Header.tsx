'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Menu,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  Sun,
  Moon,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import Swal from 'sweetalert2';

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
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('lms_theme') as 'light' | 'dark';
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const handleToggleTheme = () => {
    if (typeof window !== 'undefined') {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('lms_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Notification states
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [headerSearch, setHeaderSearch] = useState('');

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      router.push(`/courses?search=${encodeURIComponent(headerSearch.trim())}`);
    }
  };

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

  const fetchNotifications = async () => {
    if (typeof window === 'undefined' || !localStorage.getItem('lms_access_token')) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        apiClient.get('/notifications'),
        apiClient.get('/notifications/unread-count'),
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data?.count || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (actionUrl) {
        setNotifDropdownOpen(false);
        router.push(actionUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lms_access_token');
      localStorage.removeItem('lms_user');
      router.push('/login');
    }
  };

  const getRealRole = () => {
    if ((currentUser as any)?.realRole) return (currentUser as any).realRole;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.role;
        } catch {}
      }
    }
    return currentUser?.role;
  };
  const realRole = getRealRole();
  const isRealAdmin = realRole === 'ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isSimulatedAgent = isRealAdmin && currentUser?.role === 'AGENT';

  const handleSwitchRole = () => {
    if (typeof window !== 'undefined') {
      const currentSim = localStorage.getItem('lms_simulated_role');
      if (currentSim === 'AGENT') {
        localStorage.removeItem('lms_simulated_role');
        Swal.fire({
          title: 'Admin Role Restored',
          text: 'You are now viewing the platform with full Administrator privileges.',
          icon: 'info',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl shadow-lg' }
        }).then(() => window.location.reload());
      } else {
        localStorage.setItem('lms_simulated_role', 'AGENT');
        Swal.fire({
          title: 'Switched to Learner View',
          text: 'You are now previewing the LMS as an Agent/Learner. Admin controls are hidden.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl shadow-lg' }
        }).then(() => window.location.reload());
      }
    }
  };

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
            <span className="font-geist text-lg font-bold text-slate-900">LMS Enterprise</span>
          </div>

          {/* Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                !pathname?.startsWith('/admin')
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Training Center
            </Link>
            {isAdmin && (
              <Link
                href="/admin/analytics"
                className={`px-4 py-2 rounded-full text-sm font-inter font-medium transition-colors ${
                  pathname?.startsWith('/admin')
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleHeaderSearch} className="relative w-full">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              placeholder="Search courses, users, or reports..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-inter text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4d44e3] focus:ring-1 focus:ring-[#4d44e3] transition-all shadow-sm"
            />
          </form>
        </div>

        {/* Right Actions & User Menu */}
        <div className="flex items-center gap-4">
          {isRealAdmin && (
            <>
              <button
                onClick={handleSwitchRole}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-inter font-bold rounded-xl transition-all cursor-pointer ${
                  isSimulatedAgent
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 shadow-sm animate-pulse'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSimulatedAgent ? 'Exit Learner View' : 'Switch to Learner View'}</span>
              </button>
              {!isSimulatedAgent && (
                <Link
                  href="/admin/courses/builder"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#4d44e3] hover:bg-[#3b32d1] text-white rounded-lg text-sm font-inter font-medium transition-colors shadow-sm"
                >
                  Create Course
                </Link>
              )}
            </>
          )}

          <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

          {/* Theme Toggle Button */}
          <button
            onClick={handleToggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {/* Notifications & Help */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifDropdownOpen(!notifDropdownOpen);
                if (dropdownOpen) setDropdownOpen(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-geist text-sm font-bold text-slate-900">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-[#4d44e3] text-xs font-semibold rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-inter font-medium text-[#4d44e3] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center px-4">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-inter font-medium text-slate-500">
                        No notifications yet
                      </p>
                      <p className="text-xs font-inter text-slate-400 mt-0.5">
                        We'll let you know when important updates happen
                      </p>
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id, n.actionUrl || n.link)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                          !n.isRead ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'SUCCESS' ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : n.type === 'WARNING' ? (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-[#4d44e3] flex items-center justify-center font-bold text-xs">
                              <Info className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs font-geist truncate ${
                                !n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                              }`}
                            >
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#4d44e3] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs font-inter text-slate-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <span className="text-[10px] font-inter text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleDateString()} at{' '}
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-100 pt-2 px-4 pb-1 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setNotifDropdownOpen(false)}
                    className="text-xs font-inter font-semibold text-[#4d44e3] hover:underline block py-1"
                  >
                    View all notifications ({notifications.length})
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                if (notifDropdownOpen) setNotifDropdownOpen(false);
              }}
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
