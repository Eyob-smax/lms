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
  PlusCircle,
  Users,
  LogOut,
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
        { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'All Courses', href: '/admin/courses', icon: BookOpen },
        { label: 'AI Course Builder', href: '/admin/courses/builder', icon: Sparkles },
        { label: 'Analytics & Reports', href: '/admin/analytics', icon: BarChart3 },
        { label: 'User Directory', href: '/admin/users', icon: Users },
        { label: 'Certificates', href: '/admin/certificates', icon: Award },
        { label: 'Profile', href: '/profile', icon: User },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Courses', href: '/courses', icon: BookOpen },
        { label: 'Certificates', href: '/certificates', icon: Award },
        { label: 'My Performance', href: '/analytics', icon: BarChart3 },
        { label: 'Profile', href: '/profile', icon: User },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-lg">
      {/* Brand Header */}
      <div className="px-lg pb-xl border-b border-outline-variant/30 mb-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-md shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-geist text-lg font-bold text-primary dark:text-inverse-primary truncate leading-tight">
              LMS Enterprise
            </h1>
            <p className="font-inter text-xs text-on-surface-variant truncate">
              {isAdmin ? 'Trainer & Admin Panel' : 'BPO Learning Portal'}
            </p>
          </div>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 overflow-y-auto px-sm space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-md py-2.5 rounded-r-lg font-geist text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-l-4 border-primary text-primary bg-surface-container-low font-bold shadow-sm'
                  : 'border-l-4 border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Secondary Actions */}
      <div className="px-md mt-auto pt-md border-t border-outline-variant/30 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-md py-2 rounded-lg font-geist text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <Link
          href="/help"
          className="flex items-center gap-3 px-md py-2 rounded-lg font-geist text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help & Support</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-sidebar-width h-screen sticky left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex-col z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-72 bg-surface-container-lowest border-r border-outline-variant z-50 md:hidden transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
