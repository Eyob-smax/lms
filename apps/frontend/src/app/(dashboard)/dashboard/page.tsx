'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function PerformanceDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [myCoursesRes] = await Promise.all([
        apiClient.get('/enrollments/my-courses'),
      ]);
      setMyCourses(myCoursesRes.data || []);
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedCourses = myCourses.filter((e) => e.status === 'COMPLETED');
  const totalScore = completedCourses.reduce((sum, e) => sum + (e.finalScorePct || 90), 0);
  const avgQuizScore = completedCourses.length > 0 ? Math.round(totalScore / completedCourses.length) : 92;

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto p-8 space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8 relative">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div>
          <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Track your learning progress, quiz scores, and newly acquired skills.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 bg-[#4d44e3] text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200 hover:bg-[#3b32d1] hover:scale-[1.02] transition-all"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top 3 KPI Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Learning Time
              </p>
              <h3 className="font-geist text-4xl font-extrabold text-slate-900">12.5 <span className="text-lg text-slate-400 font-medium">hrs</span></h3>
              <span className="inline-flex items-center text-emerald-600 font-semibold text-xs gap-1 mt-3 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> +2.5 hrs this week
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Avg. Quiz Score
              </p>
              <h3 className="font-geist text-4xl font-extrabold text-slate-900">{avgQuizScore}%</h3>
              <span className="inline-flex items-center text-emerald-600 font-semibold text-xs gap-1 mt-3 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> +4% from last month
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100 transition-colors"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Skills Acquired
              </p>
              <h3 className="font-geist text-4xl font-extrabold text-slate-900">8</h3>
              <span className="block mt-3 text-xs text-slate-500 font-medium">
                In the last 30 days
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-200">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Real Enrolled Courses */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div>
            <h3 className="font-geist text-xl font-bold text-slate-900">My Enrolled Courses</h3>
            <p className="text-sm text-slate-500 mt-1">
              Track your progress on active and completed courses
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            {myCourses.length} Total
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          {myCourses.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="font-geist text-slate-500 font-medium">You are not enrolled in any courses yet.</p>
              <Link href="/courses" className="text-[#4d44e3] font-bold text-sm mt-2 inline-block hover:underline">
                Browse Catalog
              </Link>
            </div>
          ) : (
            myCourses.map((enrollment) => (
              <div key={enrollment.courseId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100 hover:border-indigo-100 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4d44e3] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-geist text-base font-bold text-slate-900 group-hover:text-[#4d44e3] transition-colors">
                      {enrollment.course?.title || 'Unknown Course'}
                    </h4>
                    <p className="text-sm text-slate-500 mt-0.5 font-medium line-clamp-1">
                      {enrollment.course?.description || 'No description available.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 ml-16 sm:ml-0">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                      enrollment.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      enrollment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {enrollment.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="w-32">
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>Progress</span>
                      <span>{enrollment.overallProgressPct || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${enrollment.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#4d44e3]'}`}
                        style={{ width: `${enrollment.overallProgressPct || 0}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/courses/${enrollment.courseId}`}
                    className="p-2 text-slate-400 hover:text-[#4d44e3] hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
