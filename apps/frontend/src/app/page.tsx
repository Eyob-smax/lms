'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
            router.push('/admin/dashboard');
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
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-geist text-sm text-on-surface-variant font-medium">Loading LMS Enterprise Portal...</p>
      </div>
    </div>
  );
}
