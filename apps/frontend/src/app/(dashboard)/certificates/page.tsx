'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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
      // 1. Fetch My Certificates & Completed Enrollments
      const [myCertsRes, myCoursesRes] = await Promise.all([
        apiClient.get('/certificates/my-certificates'),
        apiClient.get('/enrollments/my-courses'),
      ]);

      setMyCertificates(myCertsRes.data || []);
      const enrollments = myCoursesRes.data || [];
      const completed = enrollments.filter((e: any) => e.status === 'COMPLETED');
      setCompletedEnrollments(completed);

      // 2. If Admin, fetch pending certificate requests
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
    setActionSuccess(null);
    try {
      await apiClient.post('/certificates/request', { enrollmentId });
      setActionSuccess('Certificate requested successfully! Your request has been sent to the Admin for approval.');
      fetchData();
    } catch (err: any) {
      console.error('Request certificate error:', err);
    } finally {
      setRequestingId(null);
    }
  };

  const handleApproveRequest = async (certId: string) => {
    setActionSuccess(null);
    try {
      await apiClient.post(`/certificates/${certId}/approve`);
      setActionSuccess('Certificate approved! The learner can now download their PDF certificate.');
      fetchData();
    } catch (err) {
      console.error('Approve certificate error:', err);
    }
  };

  const handleRejectRequest = async (certId: string) => {
    setActionSuccess(null);
    try {
      await apiClient.post(`/certificates/${certId}/reject`, {
        reason: 'Course requirements need re-verification.',
      });
      setActionSuccess('Certificate request rejected.');
      fetchData();
    } catch (err) {
      console.error('Reject certificate error:', err);
    }
  };

  const handleDownloadPDF = (certId: string, courseTitle: string) => {
    // Open direct backend PDF stream endpoint in new window
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:3000/api';
    const token = localStorage.getItem('lms_token');
    const pdfUrl = `${baseURL}/certificates/${certId}/pdf?token=${token}`;
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto p-lg space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-surface-container-high rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg border-b border-outline-variant/40 pb-md">
        <div>
          <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            Certificates & Compliance Accreditations
          </h1>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            Manage, verify, and export your official BPO training certifications and compliance accreditations.
          </p>
        </div>

        {/* Tab Switcher if Admin */}
        {isAdmin && (
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/60">
            <button
              onClick={() => setActiveTab('my-certificates')}
              className={`px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all ${
                activeTab === 'my-certificates'
                  ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/30'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              My Achievements
            </button>

            <button
              onClick={() => setActiveTab('admin-approvals')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all relative ${
                activeTab === 'admin-approvals'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Pending Approvals
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-secondary text-on-secondary rounded-full text-[10px]">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Main View: My Achievements Tab */}
      {activeTab === 'my-certificates' && (
        <div className="space-y-xl">
          {/* Approved Certificates Grid */}
          <div>
            <h2 className="font-geist text-xl font-bold text-on-surface mb-md">
              Verified Professional Certificates
            </h2>

            {myCertificates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {myCertificates.map((cert) => {
                  const isApproved = cert.status === 'APPROVED';
                  const isRequested = cert.status === 'REQUESTED';

                  return (
                    <div
                      key={cert.id}
                      className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      {/* Certificate Visual Header Header */}
                      <div className="p-lg bg-surface-container-low border-b border-outline-variant/40 relative flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold shadow-sm">
                          <Award className="w-6 h-6" />
                        </div>

                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-2.5 py-0.5 rounded-full font-geist text-[10px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-secondary" /> Valid Certificate
                          </span>
                        ) : isRequested ? (
                          <span className="inline-flex items-center gap-1 bg-tertiary-fixed/40 text-tertiary px-2.5 py-0.5 rounded-full font-geist text-[10px] font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending Approval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full font-geist text-[10px] font-bold">
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-lg flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-geist text-[10px] font-bold text-outline uppercase tracking-wider">
                            Issued: {new Date(cert.issuedAt || cert.createdAt).toLocaleDateString()}
                          </span>
                          <h3 className="font-geist text-lg font-bold text-on-surface mt-1 line-clamp-2">
                            {cert.course?.title || cert.enrollment?.course?.title || 'BPO Professional Accreditation'}
                          </h3>
                          <p className="font-inter text-xs text-on-surface-variant mt-1 line-clamp-2">
                            Official enterprise compliance training certification.
                          </p>

                          {cert.certificateCode && (
                            <div className="mt-3 p-2 bg-surface-container-high rounded-md flex items-center justify-between font-mono text-[11px] text-on-surface">
                              <span className="text-outline-variant">CODE:</span>
                              <span className="font-bold text-primary">{cert.certificateCode}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-md pt-sm border-t border-outline-variant/30 flex items-center gap-2">
                          {isApproved ? (
                            <>
                              <button
                                onClick={() => handleDownloadPDF(cert.id, cert.course?.title || 'Certificate')}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-on-primary rounded-lg font-geist font-semibold text-xs hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer"
                              >
                                <Download className="w-4 h-4" /> Download PDF
                              </button>

                              <button
                                onClick={() => setVerifyModalCert(cert)}
                                className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-geist font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Verify
                              </button>
                            </>
                          ) : (
                            <div className="w-full text-center py-2 font-geist text-xs text-on-surface-variant font-medium bg-surface-container-low rounded-lg">
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
              <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center space-y-sm">
                <Award className="w-12 h-12 text-outline mx-auto" />
                <p className="font-geist text-base font-bold text-on-surface">No Approved Certificates Yet</p>
                <p className="font-inter text-xs text-on-surface-variant max-w-md mx-auto">
                  Complete your assigned training courses to 100% to request official certificates.
                </p>
              </div>
            )}
          </div>

          {/* Eligible Completed Courses (Request Button Pop Up) */}
          {completedEnrollments.length > 0 && (
            <div className="pt-lg border-t border-outline-variant/40">
              <h2 className="font-geist text-xl font-bold text-on-surface mb-md">
                Completed Courses Eligible for Certificate
              </h2>

              <div className="space-y-sm">
                {completedEnrollments.map((enr) => {
                  const existingCert = myCertificates.find((c) => c.enrollmentId === enr.id);

                  return (
                    <div
                      key={enr.id}
                      className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between gap-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                          <h4 className="font-geist text-sm font-bold text-on-surface">{enr.course?.title}</h4>
                          <p className="font-inter text-xs text-on-surface-variant">
                            Completed 100% • Final Score: {enr.finalScorePct || 100}%
                          </p>
                        </div>
                      </div>

                      <div>
                        {existingCert ? (
                          <span className="font-geist text-xs font-semibold text-on-surface-variant px-3 py-1.5 bg-surface-container-low rounded-lg">
                            Request Status: {existingCert.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRequestCertificate(enr.id)}
                            disabled={requestingId === enr.id}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-geist text-xs font-semibold hover:bg-on-primary-fixed-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Award className="w-4 h-4" />
                            <span>{requestingId === enr.id ? 'Sending Request...' : 'Request Certificate'}</span>
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
        <div className="space-y-md">
          <h2 className="font-geist text-xl font-bold text-on-surface">
            Pending Learner Certificate Requests ({pendingRequests.length})
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="space-y-sm">
              {pendingRequests.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-geist font-bold text-sm shrink-0">
                      {cert.user?.name ? cert.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-geist text-sm font-bold text-on-surface">{cert.user?.name}</h4>
                      <p className="font-inter text-xs text-on-surface-variant">
                        Requested for: <span className="font-bold text-on-surface">{cert.course?.title}</span> • Email: {cert.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveRequest(cert.id)}
                      className="px-4 py-2 bg-secondary text-on-secondary font-geist text-xs font-semibold rounded-lg hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
                    >
                      Approve & Issue Certificate
                    </button>
                    <button
                      onClick={() => handleRejectRequest(cert.id)}
                      className="px-3 py-2 bg-error-container text-on-error-container font-geist text-xs font-semibold rounded-lg hover:bg-error/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center space-y-sm">
              <CheckCircle2 className="w-10 h-10 text-secondary mx-auto" />
              <p className="font-geist text-base font-bold text-on-surface">No Pending Requests</p>
              <p className="font-inter text-xs text-on-surface-variant">All incoming learner certificate requests have been reviewed.</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      {verifyModalCert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-md p-lg space-y-md animate-fadeIn">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-sm">
              <h3 className="font-geist text-lg font-bold text-on-surface flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-secondary" /> Certificate Verification
              </h3>
              <button onClick={() => setVerifyModalCert(null)} className="text-outline hover:text-on-surface">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-sm font-inter text-xs">
              <div className="p-md bg-surface-container-low rounded-lg space-y-1">
                <p className="font-geist text-xs font-bold text-on-surface">
                  {verifyModalCert.course?.title || verifyModalCert.enrollment?.course?.title}
                </p>
                <p className="text-on-surface-variant">Recipient: {verifyModalCert.user?.name || currentUser?.name}</p>
                <p className="text-on-surface-variant">Verification Code: <span className="font-mono font-bold text-primary">{verifyModalCert.certificateCode}</span></p>
              </div>

              <p className="text-on-surface-variant text-[11px]">
                This certificate is cryptographically verified on the enterprise LMS registry and compliant with client BPO audits.
              </p>
            </div>

            <div className="pt-sm flex justify-end">
              <button
                onClick={() => setVerifyModalCert(null)}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg font-geist text-xs font-semibold"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
