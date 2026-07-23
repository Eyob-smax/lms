'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Search,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function PerformanceDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
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
      const [myCoursesRes, certsRes] = await Promise.all([
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/certificates/my-certificates'),
      ]);

      setMyCourses(myCoursesRes.data || []);
      setMyCertificates(certsRes.data || []);
    } catch (err) {
      console.warn('Failed to load performance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const inProgressCourses = myCourses.filter(
    (e) => e.status === 'IN_PROGRESS' || e.status === 'NOT_STARTED'
  );
  const completedCourses = myCourses.filter((e) => e.status === 'COMPLETED');

  // Compute stats
  const totalScore = completedCourses.reduce((sum, e) => sum + (e.finalScorePct || 90), 0);
  const avgQuizScore = completedCourses.length > 0 ? Math.round(totalScore / completedCourses.length) : 92;

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto p-lg space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-surface-container-high rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl">
      {/* Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/40 pb-md">
        <div>
          <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            Performance Dashboard
          </h1>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            Track your learning progress, quiz scores, and newly acquired operational skills.
          </p>
        </div>

        <Link
          href="/courses"
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-xl font-geist font-semibold text-xs shadow-sm hover:bg-on-primary-fixed-variant transition-colors"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Top 3 KPI Bento Cards Row (Matching Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Card 1: Weekly Learning Hours */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex items-start justify-between">
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant mb-1">
              Weekly Learning Hours
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">12.5 hrs</h3>
            <span className="inline-flex items-center text-secondary font-geist text-xs font-bold gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> +2.5 hrs from last week
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Avg. Quiz Score */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex items-start justify-between">
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant mb-1">
              Avg. Quiz Score
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">{avgQuizScore}%</h3>
            <span className="inline-flex items-center text-secondary font-geist text-xs font-bold gap-1 mt-2">
              <TrendingUp className="w-3.5 h-3.5" /> +4% from last month
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
          </div>
        </div>

        {/* Card 3: Skills Acquired */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex items-start justify-between">
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant mb-1">
              Skills Acquired
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">8 New</h3>
            <span className="font-inter text-xs text-on-surface-variant block mt-2">
              In the last 30 days
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-tertiary-fixed/40 text-tertiary flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left Quiz Score Trends Chart (Span 2) + Right Top Skills & Recent Activity (Span 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column: Quiz Score Trends Chart (Span 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-xl">
            <div>
              <h3 className="font-geist text-xl font-bold text-on-surface">Quiz Score Trends</h3>
              <p className="font-inter text-xs text-on-surface-variant mt-0.5">
                Assessment quiz score evolution across training modules
              </p>
            </div>
            <span className="font-geist text-xs font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-lg">
              Last 6 Months
            </span>
          </div>

          {/* Visual Bar Chart Representation */}
          <div className="w-full h-64 bg-surface-container-low rounded-xl border border-outline-variant/40 flex items-end justify-between p-lg gap-md relative overflow-hidden">
            {[
              { label: 'Quiz 1', score: 78, color: 'bg-primary/40' },
              { label: 'Quiz 2', score: 84, color: 'bg-primary/60' },
              { label: 'Quiz 3', score: 88, color: 'bg-primary/80' },
              { label: 'Quiz 4', score: 92, color: 'bg-primary' },
              { label: 'Quiz 5', score: 96, color: 'bg-secondary' },
            ].map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="font-geist text-xs font-bold text-on-surface">{bar.score}%</span>
                <div className="w-full bg-surface-variant rounded-t-lg flex items-end h-40">
                  <div
                    className={`w-full ${bar.color} rounded-t-lg transition-all duration-500 group-hover:opacity-80`}
                    style={{ height: `${bar.score}%` }}
                  />
                </div>
                <span className="font-geist text-[11px] text-on-surface-variant">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Top Skills & Recorded Recent Activity Feed (Span 1) */}
        <div className="space-y-lg">
          {/* Top Skills Badges Card */}
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
            <h3 className="font-geist text-base font-bold text-on-surface border-b border-outline-variant/30 pb-xs">
              Top Acquired Skills
            </h3>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary-fixed text-on-primary-fixed font-geist text-xs font-bold rounded-lg">
                Customer Empathy
              </span>
              <span className="px-3 py-1 bg-secondary-container text-on-secondary-container font-geist text-xs font-bold rounded-lg">
                Conflict Resolution
              </span>
              <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed font-geist text-xs font-bold rounded-lg">
                Technical Support
              </span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface font-geist text-xs font-bold rounded-lg">
                Active Listening
              </span>
              <span className="px-3 py-1 bg-surface-container text-on-surface font-geist text-xs font-bold rounded-lg">
                Product Knowledge
              </span>
            </div>
          </div>

          {/* Recent Recorded Activity Feed */}
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-xs">
              <h3 className="font-geist text-base font-bold text-on-surface">Recent Activity</h3>
              <span className="font-geist text-xs font-semibold text-primary">Live Log</span>
            </div>

            <div className="space-y-md">
              {/* Activity Item 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-geist text-xs font-bold text-on-surface">
                    Completed 'Advanced De-escalation'
                  </p>
                  <p className="font-inter text-[11px] text-on-surface-variant">
                    Score: 95% • 2 hours ago
                  </p>
                </div>
              </div>

              {/* Activity Item 2 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <PlayCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-geist text-xs font-bold text-on-surface">
                    Started 'New Product Q3 Features'
                  </p>
                  <p className="font-inter text-[11px] text-on-surface-variant">
                    Module 1/4 • Yesterday
                  </p>
                </div>
              </div>

              {/* Activity Item 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-geist text-xs font-bold text-on-surface">
                    Earned 'Master Communicator' Badge
                  </p>
                  <p className="font-inter text-[11px] text-on-surface-variant">
                    Milestone • 3 days ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
