'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Timer,
  Building2,
  Star,
  Download,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Users,
  Award,
  Lock,
} from 'lucide-react';
import { apiClient } from '../../../../lib/api-client';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          if (parsed.role !== 'ADMIN') {
            // Redirect non-admin users to learner dashboard
            router.push('/dashboard');
            return;
          }
        } catch {
          // ignore
        }
      }
    }
    fetchAnalyticsData();
  }, [router]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/analytics/overview');
      setOverview(res.data);
    } catch (err) {
      console.warn('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setExporting(true);
    setExportSuccess(null);
    try {
      const res = await apiClient.get('/analytics/export');
      const data = res.data;

      // Trigger browser download of CSV/JSON report
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LMS_Enterprise_Training_Report_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportSuccess('Analytics report generated & downloaded successfully!');
    } catch (err) {
      console.error('Failed to export report:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto p-lg space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-36 bg-surface-container-high rounded-xl" />
          ))}
        </div>
        <div className="h-96 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  // Fallback metrics if empty
  const stats = overview?.overview || {
    totalUsers: 142,
    activeCourses: 18,
    overallCompletionRatePct: 88,
  };

  const departmentData = overview?.departmentPerformance || [
    { department: 'SDR / Sales Dev', activeLearners: 45, completionRatePct: 92, averageScorePct: 89 },
    { department: 'Outbound Sales', activeLearners: 38, completionRatePct: 85, averageScorePct: 86 },
    { department: 'Customer Support', activeLearners: 54, completionRatePct: 94, averageScorePct: 91 },
    { department: 'IT & Operations', activeLearners: 22, completionRatePct: 78, averageScorePct: 84 },
  ];

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg border-b border-outline-variant/40 pb-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
              Analytics & Executive Reports
            </h1>
            <span className="px-2.5 py-0.5 bg-primary text-on-primary font-geist font-bold text-[10px] uppercase tracking-wider rounded-md">
              Admin Exclusive
            </span>
          </div>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            Detailed performance insights, completion trends, and skill gap audits across all BPO service lines.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-md">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl font-geist text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all shadow-sm">
            <Calendar className="w-4 h-4 text-outline" />
            <span>Last 30 Days</span>
          </button>

          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-geist text-xs font-semibold shadow-md hover:bg-on-primary-fixed-variant transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Generating Report...' : 'Export Report'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{exportSuccess}</span>
        </div>
      )}

      {/* Metric High Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Card 1: Average Completion Time */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-md">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Timer className="w-6 h-6" />
            </div>
            <span className="flex items-center text-secondary font-geist text-xs font-bold gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3.5 h-3.5" /> 12% faster
            </span>
          </div>
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Average Completion Time
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">4h 22m</h3>
            <div className="mt-md h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
            </div>
          </div>
        </div>

        {/* Card 2: Top Performing Dept */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex justify-between items-start mb-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6 text-secondary" />
            </div>
            <span className="flex items-center text-secondary font-geist text-xs font-bold gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +8.4%
            </span>
          </div>
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Top Performing Dept.
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">Customer Support</h3>
            <p className="font-inter text-xs text-on-surface-variant mt-1">
              94% Average course completion rate
            </p>
          </div>
        </div>

        {/* Card 3: Platform Satisfaction & Quiz Average */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm border-l-4 border-l-tertiary-fixed-dim flex flex-col justify-between">
          <div className="flex justify-between items-start mb-md">
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/40 flex items-center justify-center text-tertiary shadow-sm">
              <Star className="w-6 h-6" />
            </div>
            <span className="flex items-center text-secondary font-geist text-xs font-bold gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +2.1%
            </span>
          </div>
          <div>
            <p className="font-geist text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Average Quiz Pass Score
            </p>
            <h3 className="font-geist text-3xl font-bold text-on-surface">89.4%</h3>
            <p className="font-inter text-xs text-on-surface-variant mt-1">
              Based on {stats.totalUsers * 8} graded assessment attempts
            </p>
          </div>
        </div>
      </div>

      {/* Main Bento Grid: Completion Trends + Skill Gap Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
        {/* Course Completion Trends Chart (Span 3) */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-xl">
            <div>
              <h4 className="font-geist text-xl font-bold text-on-surface">Course Completion Trends</h4>
              <p className="font-inter text-xs text-on-surface-variant mt-0.5">
                Monthly breakdown of course enrollments vs completions
              </p>
            </div>
            <div className="flex gap-md">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="font-geist text-xs text-on-surface-variant font-medium">Enrollments</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary" />
                <span className="font-geist text-xs text-on-surface-variant font-medium">Completions</span>
              </div>
            </div>
          </div>

          {/* Visual Bar Chart Representation */}
          <div className="flex-1 w-full relative min-h-[280px]">
            <div className="absolute inset-0 flex items-end justify-between gap-md px-lg">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, idx) => {
                const heights = [
                  { e: '60%', c: '40%' },
                  { e: '75%', c: '55%' },
                  { e: '85%', c: '70%' },
                  { e: '65%', c: '50%' },
                  { e: '95%', c: '82%' },
                  { e: '80%', c: '68%' },
                ];
                const h = heights[idx];
                const isCurrent = idx === 4;

                return (
                  <div key={month} className="flex flex-col items-center gap-2 w-full group">
                    <div className="w-full flex items-end gap-1.5 h-48">
                      <div
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${
                          isCurrent ? 'bg-primary' : 'bg-primary/20 group-hover:bg-primary/40'
                        }`}
                        style={{ height: h.e }}
                      />
                      <div
                        className={`flex-1 rounded-t-sm transition-all duration-300 ${
                          isCurrent ? 'bg-secondary' : 'bg-secondary/20 group-hover:bg-secondary/40'
                        }`}
                        style={{ height: h.c }}
                      />
                    </div>
                    <span className={`font-geist text-xs ${isCurrent ? 'font-bold text-on-surface' : 'text-outline'}`}>
                      {month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skill Gap Analysis Widget (Span 1) */}
        <div className="lg:col-span-1 bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-geist text-lg font-bold text-on-surface mb-1">Skill Gap Analysis</h4>
            <p className="font-inter text-xs text-on-surface-variant mb-lg">
              Identified proficiency deficits across operational domains.
            </p>

            <div className="space-y-md">
              {/* Skill 1 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-geist text-xs font-semibold text-on-surface">Data Privacy & GDPR</span>
                  <span className="font-geist text-[10px] font-bold text-error uppercase">Critical</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '32%' }} />
                </div>
                <p className="font-inter text-[10px] text-on-surface-variant mt-1">32% Current vs 85% Target</p>
              </div>

              {/* Skill 2 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-geist text-xs font-semibold text-on-surface">Cold Call Objections</span>
                  <span className="font-geist text-[10px] font-bold text-tertiary uppercase">Medium</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary-container rounded-full" style={{ width: '58%' }} />
                </div>
                <p className="font-inter text-[10px] text-on-surface-variant mt-1">58% Current vs 75% Target</p>
              </div>

              {/* Skill 3 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-geist text-xs font-semibold text-on-surface">CRM Navigation</span>
                  <span className="font-geist text-[10px] font-bold text-secondary uppercase">Stable</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '78%' }} />
                </div>
                <p className="font-inter text-[10px] text-on-surface-variant mt-1">78% Current vs 80% Target</p>
              </div>

              {/* Skill 4 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-geist text-xs font-semibold text-on-surface">Phishing Detection</span>
                  <span className="font-geist text-[10px] font-bold text-error uppercase">Critical</span>
                </div>
                <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-error rounded-full" style={{ width: '24%' }} />
                </div>
                <p className="font-inter text-[10px] text-on-surface-variant mt-1">24% Current vs 90% Target</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Department Breakdown Table & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Department Performance Table (Span 2) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="px-xl py-lg border-b border-outline-variant/40 flex justify-between items-center">
            <h4 className="font-geist text-lg font-bold text-on-surface">Department Performance</h4>
            <span className="font-geist text-xs font-semibold text-primary">Live BPO Service Lines</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/40">
                  <th className="px-xl py-3 font-geist text-xs font-semibold text-on-surface-variant">Department</th>
                  <th className="px-xl py-3 font-geist text-xs font-semibold text-on-surface-variant">Active Learners</th>
                  <th className="px-xl py-3 font-geist text-xs font-semibold text-on-surface-variant">Completion Rate</th>
                  <th className="px-xl py-3 font-geist text-xs font-semibold text-on-surface-variant">Avg. Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {departmentData.map((row: any) => (
                  <tr key={row.department} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="px-xl py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-geist text-xs font-bold text-on-surface">{row.department}</span>
                      </div>
                    </td>
                    <td className="px-xl py-3.5 font-inter text-xs text-on-surface-variant">{row.activeLearners} agents</td>
                    <td className="px-xl py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-geist text-xs font-bold text-on-surface">{row.completionRatePct}%</span>
                        <div className="w-20 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: `${row.completionRatePct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-xl py-3.5 font-geist text-xs font-bold text-primary">{row.averageScorePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Generated Reports (Span 1) */}
        <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-geist text-lg font-bold text-on-surface mb-lg pb-sm border-b border-outline-variant/30">
              Recent Generated Reports
            </h4>

            <div className="space-y-md">
              <div
                onClick={handleExportReport}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-geist text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    Q3_Compliance_Audit.json
                  </p>
                  <p className="font-inter text-[11px] text-on-surface-variant">Exported Today • 4.2 MB</p>
                </div>
              </div>

              <div
                onClick={handleExportReport}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary-container/30 text-secondary flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-geist text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                    SDR_Cohort_Matrix_2026.json
                  </p>
                  <p className="font-inter text-[11px] text-on-surface-variant">Exported Yesterday • 840 KB</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="w-full mt-xl flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Generate New Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}
