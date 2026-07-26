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
  const [allCertificates, setAllCertificates] = useState<any[]>([]);
  const [completedEnrollments, setCompletedEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab state for Admin View
  const [activeTab, setActiveTab] = useState<'my-achievements' | 'eligible' | 'verified' | 'admin-management'>('my-achievements');
  const [adminSubTab, setAdminSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Request & Action States
  const [requestingId, setRequestingId] = useState<string | null>(null);

  // Verification Modal State
  const [verifyModalCert, setVerifyModalCert] = useState<any>(null);

  const handleVerifyLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput.trim()) return;
    setVerifyLoading(true);
    try {
      const res = await apiClient.get(`/certificates/verify/${encodeURIComponent(verificationCodeInput.trim())}`);
      if (res.data && res.data.valid) {
        setVerifyModalCert(res.data);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: 'No valid certificate found with that code.',
          confirmButtonColor: '#ef4444',
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: 'Invalid or expired certificate code.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setVerifyLoading(false);
    }
  };

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
        const [pendingRes, allRes] = await Promise.all([
          apiClient.get('/certificates/requests').catch(() => apiClient.get('/certificates/pending-requests')),
          apiClient.get('/certificates/all').catch(() => ({ data: [] })),
        ]);
        setPendingRequests(pendingRes.data || []);
        setAllCertificates(allRes.data || []);
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
    const baseURL = apiClient.defaults.baseURL || 'https://lms.wearecerta.app/api';
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

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('my-achievements')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'my-achievements'
                ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            My Achievements
          </button>

          <button
            onClick={() => setActiveTab('eligible')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'eligible'
                ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Eligible for Certification
            {completedEnrollments.length > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] shadow-sm ml-1">
                {completedEnrollments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('verified')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'verified'
                ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Award className="w-4 h-4" /> Verified Professional Certificates
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin-management')}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
                activeTab === 'admin-management'
                  ? 'bg-white text-[#4d44e3] shadow-md border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Admin Management
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] shadow-sm ml-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
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
        </div>
      )}

      {/* Tab 2: Eligible for Certification */}
      {activeTab === 'eligible' && (
        <div className="space-y-8 animate-fadeIn">
          <div>
            <h2 className="font-geist text-2xl font-extrabold text-slate-900 mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              Eligible for Certification
            </h2>

            {completedEnrollments.length > 0 ? (
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
            ) : (
              <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-4">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-10 h-10 text-slate-300" />
                </div>
                <p className="font-geist text-xl font-extrabold text-slate-900">No Eligible Courses Available</p>
                <p className="font-inter text-sm text-slate-500 max-w-md mx-auto">
                  You have no newly completed courses awaiting certification. Complete training modules in the Training Center to qualify.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Verified Professional Certificates */}
      {activeTab === 'verified' && (
        <div className="space-y-12 animate-fadeIn">
          {/* Interactive Hash Lookup */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full font-geist text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4 border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5" /> Compliance Verification Ledger
              </span>
              <h2 className="font-geist text-3xl font-extrabold tracking-tight">Verify Certificate Hash</h2>
              <p className="font-inter text-sm text-slate-300 mt-2">
                Enter any official LMS certificate ID or verification hash (e.g. <code>CERT-...</code>) to validate authenticity and review compliance credentials instantly.
              </p>

              <form onSubmit={handleVerifyLookup} className="mt-6 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={verificationCodeInput}
                    onChange={(e) => setVerificationCodeInput(e.target.value)}
                    placeholder="Enter verification ID..."
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl font-mono text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifyLoading || !verificationCodeInput.trim()}
                  className="px-8 py-3 bg-[#4d44e3] hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify Authenticity'}
                </button>
              </form>
            </div>
          </div>

          {/* Ledger Grid */}
          <div>
            <h3 className="font-geist text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4d44e3]" />
              Professional Certificate Directory ({isAdmin ? allCertificates.filter(c => c.status === 'APPROVED').length : myCertificates.filter(c => c.status === 'APPROVED').length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isAdmin ? allCertificates.filter(c => c.status === 'APPROVED') : myCertificates.filter(c => c.status === 'APPROVED')).map((cert) => (
                <div key={cert.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4d44e3] flex items-center justify-center font-bold">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border border-emerald-100">
                      Verified
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-[#4d44e3] font-bold">{cert.certificateCode || cert.id}</span>
                    <h4 className="font-geist text-base font-extrabold text-slate-900 mt-1">{cert.course?.title || cert.enrollment?.course?.title || 'Professional Certification'}</h4>
                    <p className="font-inter text-xs text-slate-500 mt-1">Recipient: <strong className="text-slate-700">{cert.user?.name || currentUser?.name || 'Authorized Member'}</strong></p>
                    <p className="font-inter text-[10px] text-slate-400 mt-0.5">Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => { setVerificationCodeInput(cert.certificateCode || cert.id); setVerifyModalCert(cert); }}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors border border-slate-200 cursor-pointer"
                  >
                    View Audit Trail
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Approvals Tab */}
      {isAdmin && activeTab === 'admin-management' && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <h2 className="font-geist text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-[#4d44e3]" />
              Certificate Administration
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 self-start sm:self-auto">
              <button
                onClick={() => setAdminSubTab('pending')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  adminSubTab === 'pending'
                    ? 'bg-white text-[#4d44e3] shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                onClick={() => setAdminSubTab('approved')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  adminSubTab === 'approved'
                    ? 'bg-white text-emerald-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Approved ({allCertificates.filter(c => c.status === 'APPROVED').length})
              </button>
              <button
                onClick={() => setAdminSubTab('rejected')}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  adminSubTab === 'rejected'
                    ? 'bg-white text-rose-600 shadow-sm border border-slate-100'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Rejected ({allCertificates.filter(c => c.status === 'REJECTED').length})
              </button>
            </div>
          </div>

          {adminSubTab === 'pending' && (
            pendingRequests.length > 0 ? (
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
                        <h4 className="font-geist text-base font-extrabold text-slate-900">{cert.user?.name} ({cert.user?.email})</h4>
                        <p className="font-inter text-sm text-slate-500 mt-1">
                          Requested for: <span className="font-semibold text-slate-700">{cert.course?.title || cert.enrollment?.course?.title}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button
                        onClick={() => handleApproveRequest(cert.id)}
                        className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all text-center cursor-pointer"
                      >
                        Approve & Issue
                      </button>
                      <button
                        onClick={() => handleRejectRequest(cert.id)}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-200 text-rose-600 font-bold text-sm rounded-xl hover:bg-rose-50 transition-colors text-center cursor-pointer"
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
            )
          )}

          {adminSubTab === 'approved' && (
            (() => {
              const approvedCerts = allCertificates.filter(c => c.status === 'APPROVED');
              return approvedCerts.length > 0 ? (
                <div className="space-y-4">
                  {approvedCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-geist font-extrabold text-lg shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-geist text-base font-extrabold text-slate-900">{cert.user?.name || cert.enrollment?.user?.name}</h4>
                            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">{cert.certificateCode}</span>
                          </div>
                          <p className="font-inter text-sm text-slate-500 mt-1">
                            Course: <span className="font-semibold text-slate-700">{cert.course?.title || cert.enrollment?.course?.title}</span> • Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                          onClick={() => handleDownloadPDF(cert.id, cert.course?.title || 'Certificate')}
                          className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-[#4d44e3] to-[#8079ff] text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </button>
                        <button
                          onClick={() => setVerifyModalCert(cert)}
                          className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-4">
                  <p className="font-geist text-xl font-extrabold text-slate-900">No Approved Certificates Found</p>
                  <p className="font-inter text-sm text-slate-500">No certificates have been issued yet.</p>
                </div>
              );
            })()
          )}

          {adminSubTab === 'rejected' && (
            (() => {
              const rejectedCerts = allCertificates.filter(c => c.status === 'REJECTED');
              return rejectedCerts.length > 0 ? (
                <div className="space-y-4">
                  {rejectedCerts.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-rose-100 transition-colors opacity-80"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-geist font-extrabold text-lg shrink-0">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-geist text-base font-extrabold text-slate-900">{cert.user?.name || cert.enrollment?.user?.name}</h4>
                          <p className="font-inter text-sm text-slate-500 mt-1">
                            Course: <span className="font-semibold text-slate-700">{cert.course?.title || cert.enrollment?.course?.title}</span>
                          </p>
                          {cert.rejectionReason && (
                            <p className="font-inter text-xs text-rose-600 mt-1 font-medium bg-rose-50 px-3 py-1 rounded-lg inline-block border border-rose-100">
                              Reason: {cert.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <span className="font-geist font-bold text-xs text-slate-400">
                          Rejected on {new Date(cert.updatedAt || cert.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-4">
                  <p className="font-geist text-xl font-extrabold text-slate-900">No Rejected Requests</p>
                  <p className="font-inter text-sm text-slate-500">No certificate requests have been rejected.</p>
                </div>
              );
            })()
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
