'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  ShieldCheck,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  BarChart2,
  AlertCircle,
  FileText,
  Calendar,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  XCircle,
  ChevronRight,
  Layers,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { apiClient } from '../../../../../lib/api-client';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes' | 'certificates'>('courses');

  // Modal states for admin actions
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');

  useEffect(() => {
    if (userId) {
      fetchAgentDetails();
    }
  }, [userId]);

  const fetchAgentDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/users/${userId}`);
      setAgent(res.data);
      if (res.data?.department) {
        setNewDepartment(res.data.department);
      }
    } catch (err: any) {
      console.error('Failed to load agent details:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Could not load agent profile details.',
        confirmButtonColor: '#4d44e3',
      }).then(() => router.push('/admin/users'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!agent) return;
    const newStatus = !agent.isActive;
    try {
      await apiClient.patch(`/users/${agent.id}/status`, { isActive: newStatus });
      setAgent((prev: any) => ({ ...prev, isActive: newStatus }));
      Swal.fire({
        icon: 'success',
        title: 'Status Updated',
        text: `Agent is now ${newStatus ? 'Active' : 'Inactive'}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not update agent status.' });
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !newDepartment) return;
    try {
      await apiClient.patch(`/users/${agent.id}/department`, { department: newDepartment });
      setAgent((prev: any) => ({ ...prev, department: newDepartment }));
      setDeptModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Department Updated',
        text: `Agent reassigned to ${newDepartment}.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Failed to update department:', err);
      Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Could not update department.' });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-inter font-medium text-slate-600">Loading agent profile & history...</p>
      </div>
    );
  }

  if (!agent) return null;

  const stats = agent.stats || {};
  const enrollments = agent.enrollments || [];
  const quizAttempts = agent.quizAttempts || [];
  const certificates = agent.certificates || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Top Nav / Back Button */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-inter font-medium transition-all shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users List
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDeptModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-inter font-semibold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <Building className="w-4 h-4 text-[#4d44e3]" /> Reassign Department
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-semibold transition-all shadow-2xs flex items-center gap-2 cursor-pointer ${
              agent.isActive
                ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {agent.isActive ? (
              <>
                <XCircle className="w-4 h-4" /> Deactivate Agent
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Activate Agent
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agent Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-geist font-extrabold text-3xl sm:text-4xl text-white shadow-lg border-2 border-white/20 shrink-0">
            {agent.name ? agent.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-geist font-bold tracking-tight">
                {agent.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-geist font-bold uppercase tracking-wider border ${
                  agent.isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                }`}
              >
                {agent.isActive ? 'Active Agent' : 'Inactive'}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-geist font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                {agent.role}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm font-inter text-slate-300 flex-wrap">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" /> {agent.email}
              </span>
              <span className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" /> Department: {agent.department || 'General'}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> Joined {new Date(agent.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* High level progress ring or badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center shrink-0 min-w-[180px]">
          <span className="text-xs font-inter font-medium text-indigo-200 block uppercase tracking-wider mb-1">
            Overall Completion
          </span>
          <div className="font-geist font-extrabold text-3xl text-white">
            {stats.completionRate || 0}%
          </div>
          <span className="text-[11px] font-inter text-slate-300 mt-1 block">
            {stats.completedCourses || 0} of {stats.totalEnrolled || 0} courses passed
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4d44e3] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.totalEnrolled || 0}</p>
            <p className="text-xs font-inter font-medium text-slate-500">Total Enrolled</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.completedCourses || 0}</p>
            <p className="text-xs font-inter font-medium text-slate-500">Completed Courses</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.averageProgressPct || 0}%</p>
            <p className="text-xs font-inter font-medium text-slate-500">Avg Progress</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.averageQuizScore || 0}%</p>
            <p className="text-xs font-inter font-medium text-slate-500">Avg Quiz Score</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.totalCertificates || 0}</p>
            <p className="text-xs font-inter font-medium text-slate-500">Certificates</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-geist font-bold text-slate-900">{stats.totalLearningHours || 0}h</p>
            <p className="text-xs font-inter font-medium text-slate-500">Learning Time</p>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-5 py-2.5 rounded-xl font-geist text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-[#4d44e3] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Course Enrollments ({enrollments.length})
          </button>
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`px-5 py-2.5 rounded-xl font-geist text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'quizzes'
                ? 'bg-[#4d44e3] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Assessment History ({quizAttempts.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-5 py-2.5 rounded-xl font-geist text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-[#4d44e3] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> Certificates ({certificates.length})
          </button>
        </div>

        {/* TAB 1: COURSES */}
        {activeTab === 'courses' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {enrollments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-inter">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No Course Enrollments</p>
                <p className="text-sm mt-1 text-slate-400">This agent is not enrolled in any training courses yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-geist text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Course Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Progress</th>
                      <th className="px-6 py-4">Final Score</th>
                      <th className="px-6 py-4">Enrolled Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-inter text-sm">
                    {enrollments.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-geist font-bold text-slate-900">{e.course?.title || 'Unknown Course'}</p>
                          <span className="text-xs text-slate-400 font-mono">{e.course?.courseCode || 'CRS-000'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                            {e.course?.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-geist text-xs font-bold uppercase tracking-wider ${
                              e.status === 'COMPLETED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : e.status === 'IN_PROGRESS'
                                ? 'bg-indigo-50 text-[#4d44e3] border border-indigo-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {e.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                            {e.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 w-48">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  e.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#4d44e3]'
                                }`}
                                style={{ width: `${e.overallProgressPct || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 min-w-[32px]">
                              {e.overallProgressPct || 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-geist font-bold text-slate-800">
                          {e.finalScorePct !== null && e.finalScorePct !== undefined
                            ? `${e.finalScorePct}%`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(e.enrolledAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/courses/${e.courseId}`}
                            className="text-xs font-inter font-semibold text-[#4d44e3] hover:underline inline-flex items-center gap-1"
                          >
                            View Course <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZ ATTEMPTS */}
        {activeTab === 'quizzes' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {quizAttempts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-inter">
                <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No Assessment Attempts</p>
                <p className="text-sm mt-1 text-slate-400">This agent has not taken any quizzes yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-geist text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Assessment Title</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Score</th>
                      <th className="px-6 py-4">Result</th>
                      <th className="px-6 py-4">Date Attempted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-inter text-sm">
                    {quizAttempts.map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-geist font-bold text-slate-900">
                          {q.quiz?.title || 'Course Quiz'}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {q.enrollment?.course?.title || 'Unknown Course'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-geist font-extrabold text-base ${
                              q.isPassed ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {q.scorePct}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-geist text-xs font-bold uppercase tracking-wider ${
                              q.isPassed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {q.isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {q.isPassed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(q.createdAt || q.startedAt).toLocaleDateString()} at{' '}
                          {new Date(q.createdAt || q.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CERTIFICATES */}
        {activeTab === 'certificates' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {certificates.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-inter">
                <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No Certificates</p>
                <p className="text-sm mt-1 text-slate-400">No certificates have been requested or issued for this agent.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-geist text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Certificate ID</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Requested Date</th>
                      <th className="px-6 py-4">Approved Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-inter text-sm">
                    {certificates.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-800">
                          {c.certificateCode || c.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-geist font-bold text-slate-900">
                          {c.enrollment?.course?.title || 'Unknown Course'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-geist text-xs font-bold uppercase tracking-wider ${
                              c.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : c.status === 'REQUESTED'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {c.requestedAt ? new Date(c.requestedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {c.approvedAt ? new Date(c.approvedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {c.status === 'APPROVED' && (
                            <Link
                              href="/admin/certificates"
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4d44e3] text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              Manage Cert <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEPARTMENT MODAL */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-geist font-bold text-lg text-slate-900">Reassign Department</h3>
              <button
                onClick={() => setDeptModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-inter font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Select Team / Department
                </label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-inter text-slate-900 focus:outline-none focus:border-[#4d44e3] focus:ring-1 focus:ring-[#4d44e3]"
                >
                  <option value="Sales">Sales Team</option>
                  <option value="Support">Customer Support</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product Management</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="HR">Human Resources</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-inter font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4d44e3] hover:bg-[#3b32d1] text-white rounded-xl text-sm font-inter font-medium transition-colors shadow-md cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
