'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lms_access_token');
      const userStr = localStorage.getItem('lms_user');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.role === 'ADMIN') {
            router.push('/admin/analytics');
          } else {
            router.push('/dashboard');
          }
          return;
        } catch {
          // Fallback to login if parsing fails
        }
      }
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-100/50 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl -z-10" />
      
      <div className="flex flex-col items-center gap-6 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-[#4d44e3] flex items-center justify-center text-white shadow-xl shadow-indigo-200 animate-bounce">
          <GraduationCap className="w-8 h-8" />
        </div>
        <p className="font-geist text-lg text-slate-600 font-bold tracking-tight">Loading LMS Enterprise Portal...</p>
      </div>
    </div>
  );
}
