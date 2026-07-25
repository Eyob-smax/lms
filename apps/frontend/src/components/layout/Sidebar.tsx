'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Award,
  User,
  Settings,
  HelpCircle,
  Sparkles,
  Users,
  X,
} from 'lucide-react';

interface SidebarProps {
  userRole?: 'AGENT' | 'ADMIN';
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ userRole = 'AGENT', isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isAdmin = userRole === 'ADMIN';

  const navItems = isAdmin
    ? [
        { label: 'Executive Analytics', href: '/admin/analytics', icon: BarChart3 },
        { label: 'AI Course Builder', href: '/admin/courses/builder', icon: Sparkles },
        { label: 'User Directory', href: '/admin/users', icon: Users },
        { label: 'Course Catalog', href: '/courses', icon: BookOpen },
        { label: 'Certificates & Audit', href: '/certificates', icon: Award },
        { label: 'My Profile', href: '/profile', icon: User },
      ]
    : [
        { label: 'Performance Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Courses', href: '/courses', icon: BookOpen },
        { label: 'Certificates', href: '/certificates', icon: Award },
        { label: 'Profile Settings', href: '/profile', icon: User },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-6">
      {/* Brand Header */}
      <div className="px-6 pb-8 border-b border-slate-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4d44e3] flex items-center justify-center text-white shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-geist text-lg font-bold text-[#4d44e3] truncate leading-tight">
              LMS Enterprise
            </h1>
            <p className="font-inter text-xs text-slate-500 truncate">
              {isAdmin ? 'Trainer & Admin Panel' : 'BPO Learning Portal'}
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 overflow-y-auto px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-r-lg font-geist text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-l-4 border-[#4d44e3] text-[#4d44e3] bg-indigo-50 font-bold shadow-sm'
                  : 'border-l-4 border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#4d44e3]' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Secondary Actions */}
      <div className="px-6 mt-auto pt-6 border-t border-slate-200 space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-4 py-2 rounded-lg font-geist text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Account Settings</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen sticky left-0 top-0 bg-white border-r border-slate-200 flex-col z-30 shrink-0 shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-200 z-50 md:hidden transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
