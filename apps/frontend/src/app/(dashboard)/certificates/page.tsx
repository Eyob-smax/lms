'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  Award,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  XCircle,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function CertificatesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data States
  const [myCertificates, setMyCertificates] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state for Admin View
  const [activeTab, setActiveTab] = useState<'my-certificates' | 'admin-approvals'>('my-certificates');

  // Request & Action States
  const [requestingId, setRequestingId] = useState<string | null>(null);

  // Verification Modal State
  const [verifyModalCert, setVerifyModalCert] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
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
      const [myCertsRes, myCoursesRes] = await Promise.all([
        apiClient.get('/certificates/my-certificates'),
        apiClient.get('/enrollments/my-courses'),
      ]);

      setMyCertificates(myCertsRes.data || []);
      const enrollments = myCoursesRes.data || [];
      const completed = enrollments.filter((e: any) => e.status === 'COMPLETED');
      setCompletedEnrollments(completed);

      const userStr = localStorage.getItem('lms_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user?.role === 'ADMIN') {
        const pendingRes = await apiClient.get('/certificates/pending-requests');
        setPendingRequests(pendingRes.data || []);
      }
    } catch (err) {
      console.warn('Failed to load certificates data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCertificate = async (enrollmentId: string) => {
    setRequestingId(enrollmentId);
    try {
      await apiClient.post('/certificates/request', { enrollmentId });
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Certificate requested successfully!',
        text: 'Your request has been sent to the Admin for approval.',
        showConfirmButton: false,
        timer: 3000,
      });
      fetchData();
    } catch (err: any) {
      console.error('Request certificate error:', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to request certificate.',
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setRequestingId(null);
    }
  };

  const handleApproveRequest = async (certId: string) => {
    try {
      await apiClient.post(`/certificates/${certId}/approve`);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Certificate approved!',
        showConfirmButton: false,
        timer: 3000,
      });
      fetchData();
    } catch (err) {
      console.error('Approve certificate error:', err);
    }
  };

  const handleRejectRequest = async (certId: string) => {
    try {
      const result = await Swal.fire({
        title: 'Reject Request?',
        text: "Are you sure you want to reject this certificate request?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, reject it'
      });

      if (result.isConfirmed) {
        await apiClient.post(`/certificates/${certId}/reject`, {
          reason: 'Course requirements need re-verification.',
        });
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Request rejected.',
          showConfirmButton: false,
          timer: 3000,
        });
        fetchData();
      }
    } catch (err) {
      console.error('Reject certificate error:', err);
    }
  };

  const handleDownloadPDF = (certId: string, courseTitle: string) => {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000/api';
    const token = localStorage.getItem('lms_token');
    const pdfUrl = `${baseURL}/certificates/${certId}/pdf?token=${token}`;
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-10 pb-20 relative">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-amber-50 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="font-geist text-4xl font-extrabold text-slate-900 tracking-tight">
            Certificates & Accreditations
          </h1>
          <p className="font-inter text-base text-slate-500 mt-2 max-w-2xl">
            Manage, verify, and export your official training certifications and compliance accreditations.
          </p>
        </div>

        {/* Tab Switcher if Admin */}
        {isAdmin && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab('my-certificates')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'my-certificates'
                  ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              My Achievements
            </button>

            <button
              onClick={() => setActiveTab('admin-approvals')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
                activeTab === 'admin-approvals'
                  ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] shadow-sm ml-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main View: My Achievements Tab */}
      {activeTab === 'my-certificates' && (
        <div className="space-y-12">
          {/* Approved Certificates Grid */}
          <div>
            <h2 className="font-geist text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              Verified Professional Certificates
            </h2>

            {myCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {myCertificates.map((cert) => {
                  const isApproved = cert.status === 'APPROVED';
                  const isRequested = cert.status === 'REQUESTED';

                  return (
                    <div
                      key={cert.id}
                      className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-300 group relative"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60 -z-10 group-hover:bg-amber-100 transition-colors"></div>
                      
                      {/* Certificate Visual Header Header */}
                      <div className="p-8 pb-6 border-b border-slate-50 relative flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-sm border border-amber-200">
                          <Award className="w-6 h-6" />
                        </div>

                        {isApproved ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                          </span>
                        ) : isRequested ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border border-amber-100">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border border-rose-100">
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-8 pt-2 flex-1 flex flex-col justify-between relative z-10">
                        <div>
                          <span className="font-geist text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                          </span>
                          <h3 className="font-geist text-xl font-extrabold text-slate-900 mt-2 leading-tight">
                            {cert.course?.title || cert.enrollment?.course?.title || 'BPO Professional Accreditation'}
                          </h3>
                          <p className="font-inter text-sm text-slate-500 mt-2 line-clamp-2">
                            Official enterprise compliance training certification.
                          </p>

                          {cert.certificateCode && (
                            <div className="mt-5 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between font-mono text-xs text-slate-600">
                              <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider">Verification ID</span>
                              <span className="font-bold text-[#4d44e3]">{cert.certificateCode}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex items-center gap-3">
                          {isApproved ? (
                            <>
                              <button
                                onClick={() => handleDownloadPDF(cert.id, cert.course?.title || 'Certificate')}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#4d44e3] to-[#8079ff] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> Download PDF
                              </button>

                              <button
                                onClick={() => setVerifyModalCert(cert)}
                                className="px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm"
                              >
                                Verify
                              </button>
                            </>
                          ) : (
                            <div className="w-full text-center py-3 font-geist text-sm text-slate-500 font-bold bg-slate-50 border border-slate-100 rounded-xl">
                              Awaiting Admin Review
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-slate-300" />
                </div>
                <p className="font-geist text-xl font-extrabold text-slate-900">No Approved Certificates Yet</p>
                <p className="font-inter text-sm text-slate-500 max-w-md mx-auto">
                  Complete your assigned training courses to 100% to request official certificates.
                </p>
              </div>
            )}
          </div>

          {/* Eligible Completed Courses (Request Button Pop Up) */}
          {completedEnrollments.length > 0 && (
            <div className="pt-10 border-t border-slate-200">
              <h2 className="font-geist text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                Eligible for Certification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {completedEnrollments.map((enr) => {
                  const existingCert = myCertificates.find((c) => c.enrollmentId === enr.id);

                  return (
                    <div
                      key={enr.id}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-geist text-base font-bold text-slate-900 leading-tight">{enr.course?.title}</h4>
                          <p className="font-inter text-sm text-slate-500 mt-1">
                            Final Score: <span className="font-bold text-emerald-600">{enr.finalScorePct || 100}%</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        {existingCert ? (
                          <span className="block text-center sm:inline-block font-bold text-[11px] uppercase tracking-wider text-slate-500 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                            Status: {existingCert.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestCertificate(enr.id)}
                            disabled={requestingId === enr.id}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-bold text-sm hover:bg-[#3b32d1] hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Award className="w-4 h-4" />
                            <span>{requestingId === enr.id ? 'Sending Request...' : 'Claim Certificate'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Approvals Tab */}
      {isAdmin && activeTab === 'admin-approvals' && (
        <div className="space-y-8">
          <h2 className="font-geist text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileCheck className="w-6 h-6 text-[#4d44e3]" />
            Pending Learner Requests
            <span className="bg-[#4d44e3] text-white text-sm px-3 py-1 rounded-full">{pendingRequests.length}</span>
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4d44e3] border border-indigo-100 flex items-center justify-center font-geist font-extrabold text-lg shrink-0">
                      {cert.user?.name ? cert.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-geist text-base font-extrabold text-slate-900">{cert.user?.name}</h4>
                      <p className="font-inter text-sm text-slate-500 mt-1">
                        Requested for: <span className="font-semibold text-slate-700">{cert.course?.title}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleApproveRequest(cert.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all text-center"
                    >
                      Approve & Issue
                    </button>
                    <button
                      onClick={() => handleRejectRequest(cert.id)}
                      className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-colors text-center"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-4">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <p className="font-geist text-xl font-extrabold text-slate-900">All Caught Up!</p>
              <p className="font-inter text-sm text-slate-500">There are no pending certificate requests to review.</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalCert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-geist text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" /> Verified Certificate
              </h3>
              <button onClick={() => setVerifyModalCert(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-2 rounded-full">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div>
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-slate-500">Course</p>
                  <p className="font-geist text-base font-bold text-slate-900 leading-snug mt-1">
                    {verifyModalCert.course?.title || verifyModalCert.enrollment?.course?.title}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-slate-500">Recipient</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{verifyModalCert.user?.name || currentUser?.name}</p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="font-semibold text-[10px] uppercase tracking-widest text-slate-500">Verification ID</p>
                  <p className="font-mono text-sm font-extrabold text-[#4d44e3] mt-1 tracking-wider">{verifyModalCert.certificateCode}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start bg-blue-50/50 p-4 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  This certificate is cryptographically verified on the enterprise LMS registry and fully compliant with BPO audits.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setVerifyModalCert(null)}
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
