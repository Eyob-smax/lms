'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<'AGENT' | 'ADMIN'>('AGENT');
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserData(parsed);
          if (parsed.role === 'ADMIN') {
            setUserRole('ADMIN');
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <Sidebar
        userRole={userRole}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          user={userData}
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-md md:p-lg xl:p-xl">
          {children}
        </main>
      </div>
    </div>
  );
}
