'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  BookOpen,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  ChevronDown,
  ShieldAlert,
  Plus as PlusIcon,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function CoursesPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-courses'>('catalog');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Data States
  const [catalogCourses, setCatalogCourses] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search');
      if (q) setSearchQuery(q);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const [catalogRes, myCoursesRes, categoriesRes] = await Promise.all([
        apiClient.get(`/courses/catalog?${params.toString()}`),
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/courses/categories'),
      ]);

      setCatalogCourses(catalogRes.data?.data || catalogRes.data || []);
      setMyCourses(myCoursesRes.data || []);

      if (Array.isArray(categoriesRes.data)) {
        const catNames = categoriesRes.data.map((c: any) => (typeof c === 'string' ? c : c.category));
        setCategories(catNames);
      }
    } catch (err) {
      console.warn('Failed to fetch courses data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    const result = await Swal.fire({
      title: 'Confirm Enrollment',
      text: `Are you sure you want to enroll in "${courseTitle}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4d44e3',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, enroll me!'
    });

    if (!result.isConfirmed) return;

    setEnrollingId(courseId);
    try {
      const userStr = localStorage.getItem('lms_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;

      await apiClient.post('/enrollments/assign', {
        courseId,
        userIds: [user.id],
      });

      Swal.fire({
        icon: 'success',
        title: 'Enrolled Successfully!',
        text: `You are now enrolled in ${courseTitle}.`,
        confirmButtonColor: '#4d44e3',
      });

      await fetchData();
      setActiveTab('my-courses');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Enrollment Failed',
        text: 'There was an error enrolling you in the course.',
        confirmButtonColor: '#ef4444',
      });
      console.error('Enrollment error:', err);
    } finally {
      setEnrollingId(null);
    }
  };

  const filteredCatalog = catalogCourses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const tagsStr = Array.isArray(c.targetAudience) ? c.targetAudience.join(' ').toLowerCase() : '';
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      tagsStr.includes(q)
    );
  });

  const inProgressEnrollments = myCourses.filter(
    (e) => e.status === 'IN_PROGRESS' || e.status === 'NOT_STARTED'
  );
  const completedEnrollments = myCourses.filter((e) => e.status === 'COMPLETED');

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-8 pb-20 relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-3xl -z-10 opacity-70"></div>
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'catalog' ? 'Course Catalog' : 'My Courses'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            {activeTab === 'catalog'
              ? 'Explore and enroll in operational training modules across service lines.'
              : 'Track your active training progress and review completed certifications.'}
          </p>
        </div>

        {/* Premium Tab Selector */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-md shadow-inner">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-geist text-xs font-bold transition-all duration-300 ${
              activeTab === 'catalog'
                ? 'bg-white text-[#4d44e3] shadow-md shadow-slate-200/50 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Training Catalog
          </button>
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-geist text-xs font-bold transition-all duration-300 relative ${
              activeTab === 'my-courses'
                ? 'bg-[#4d44e3] text-white shadow-md shadow-indigo-300/50 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Clock className="w-4 h-4" /> My Courses
            {inProgressEnrollments.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'my-courses' ? 'bg-white/20' : 'bg-[#4d44e3] text-white'}`}>
                {inProgressEnrollments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Catalog View */}
      {activeTab === 'catalog' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search training modules..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all"
              />
            </form>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <div className="relative shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl font-semibold text-xs cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/20 transition-all"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Sales">Sales</option>
                  <option value="SDR">SDR / Outbound</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Technical">Technical</option>
                  <option value="Soft Skills">Soft Skills</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative shrink-0">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-10 rounded-xl font-semibold text-xs cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4d44e3]/20 transition-all"
                >
                  <option value="ALL">Any Difficulty</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 rounded-3xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredCatalog.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCatalog.map((course) => {
                const isEnrolled = course.enrollmentStatus && course.enrollmentStatus !== 'NOT_ENROLLED';

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                  >
                    <div className="h-44 w-full relative overflow-hidden bg-slate-50 flex items-center justify-center">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <BookOpen className="w-12 h-12 text-slate-300" />
                      )}

                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full font-geist text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-[#4d44e3]" />
                        <span>{course.durationMinutes || 45}m</span>
                      </div>

                      {course.isMandatory && (
                        <div className="absolute top-3 left-3 bg-rose-500 text-white px-2.5 py-1 rounded-md font-geist text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <ShieldAlert className="w-3 h-3" /> Required
                        </div>
                      )}
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between relative">
                      <div className="absolute top-0 right-8 w-16 h-16 bg-blue-50 rounded-full blur-2xl -z-10 group-hover:bg-blue-100 transition-colors"></div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="bg-indigo-50 text-[#4d44e3] px-2.5 py-1 rounded-md font-geist text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                            {course.category || 'Training'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-geist text-xs text-slate-500 font-semibold">
                            {course.difficulty || 'Beginner'}
                          </span>
                          {Array.isArray(course.targetAudience) && course.targetAudience.length > 0 && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-100">
                                {course.targetAudience.join(', ')}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="font-geist text-xl font-extrabold text-slate-900 mb-2 leading-tight group-hover:text-[#4d44e3] transition-colors line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="font-inter text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-auto">
                        {isEnrolled ? (
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-3 px-4 rounded-xl font-semibold text-sm hover:bg-emerald-100 transition-colors border border-emerald-100"
                          >
                            <span>Continue Course</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id, course.title)}
                            disabled={enrollingId === course.id}
                            className="w-full flex items-center justify-center gap-2 bg-[#4d44e3] text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-[#3b32d1] hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50"
                          >
                            {enrollingId === course.id ? (
                              <span>Enrolling...</span>
                            ) : (
                              <>
                                <span>Enroll Now</span>
                                <PlusIcon className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 shadow-xl shadow-slate-200/40">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-geist text-xl font-bold text-slate-900">No Courses Found</h3>
              <p className="text-slate-500 font-medium">
                Try adjusting your search criteria or category filters.
              </p>
            </div>
          )}
        </div>
      )}

      {/* My Courses View */}
      {activeTab === 'my-courses' && (
        <div className="space-y-10 animate-fadeIn">
          {/* Section 1: In Progress */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-geist text-2xl font-extrabold text-slate-900">In Progress</h2>
              <span className="px-3 py-1 bg-indigo-50 text-[#4d44e3] border border-indigo-100 font-geist font-bold text-xs rounded-full shadow-sm">
                {inProgressEnrollments.length}
              </span>
            </div>

            {inProgressEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgressEnrollments.map((e) => {
                  const course = e.course;
                  const progress = e.overallProgressPct || 0;

                  return (
                    <div
                      key={e.id}
                      className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-slate-50 flex items-center justify-center">
                        {course?.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <BookOpen className="w-12 h-12 text-slate-300" />
                        )}

                        {e.dueDate && (
                          <div className="absolute top-3 right-3 bg-rose-500 text-white font-geist text-[10px] font-bold px-2.5 py-1 rounded-md shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" /> Due {new Date(e.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-geist text-[10px] font-bold text-[#4d44e3] bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">
                            {course?.category || 'Training'}
                          </span>
                          <h3 className="font-geist text-xl font-extrabold text-slate-900 mt-3 line-clamp-2 leading-tight">
                            {course?.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                            {course?.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-5 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="font-geist text-sm font-bold text-slate-900">
                              {progress}% Completed
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {course?.durationMinutes ? `${course.durationMinutes}m left` : 'Self-paced'}
                            </span>
                          </div>

                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6 shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-[#4d44e3] to-[#8079ff] rounded-full transition-all duration-700 shadow-sm"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <Link
                            href={`/courses/${course?.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-[#4d44e3] text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-[#3b32d1] hover:shadow-lg hover:shadow-indigo-200 transition-all"
                          >
                            <span>Resume Course</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 shadow-xl shadow-slate-200/40">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="font-geist text-xl font-bold text-slate-900">No In-Progress Courses</h3>
                <p className="text-slate-500 font-medium">
                  Select a course from the training catalog to get started.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Completed Courses */}
          {completedEnrollments.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="font-geist text-2xl font-extrabold text-slate-900">Completed Training</h2>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 font-geist font-bold text-xs rounded-full shadow-sm">
                  {completedEnrollments.length}
                </span>
              </div>

              <div className="space-y-4">
                {completedEnrollments.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-geist text-lg font-bold text-slate-900">{e.course?.title}</h4>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                          Completed on {new Date(e.completedAt || e.updatedAt).toLocaleDateString()} • Score: {e.finalScorePct || 100}%
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/courses/${e.course?.id}`}
                      className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold text-sm text-slate-700 rounded-xl transition-colors"
                    >
                      Review Material
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

