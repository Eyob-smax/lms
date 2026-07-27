'use client';

import { useState, useEffect } from 'react';
import Header from '../../components/layout/Header';
import Sidebar from '../../components/layout/Sidebar';
import ReactQueryProvider from '../providers';

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserData(parsed);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <ReactQueryProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        {/* Sidebar Navigation */}
        <Sidebar userRole={userData?.role} />
        
        {/* Main Column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Navigation */}
          <Header user={userData} />

          {/* Main Workspace Area */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 xl:p-12">
            <div className="max-w-[1440px] mx-auto w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ReactQueryProvider>
  );
}
