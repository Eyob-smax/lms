'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Award,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
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
    fetchData();
  }, [selectedCategory, selectedDifficulty]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'ALL') params.append('difficulty', selectedDifficulty);
      if (searchQuery) params.append('search', searchQuery);

      const [catalogRes, myCoursesRes, categoriesRes] = await Promise.all([
        apiClient.get(`/courses/catalog?${params.toString()}`),
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/courses/categories'),
      ]);

      const catalogData = catalogRes.data?.data || catalogRes.data || [];
      setCatalogCourses(catalogData);
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

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      const userStr = localStorage.getItem('lms_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return;

      await apiClient.post('/enrollments/assign', {
        courseId,
        userIds: [user.id],
      });

      // Refresh list
      await fetchData();
      setActiveTab('my-courses');
    } catch (err) {
      console.error('Enrollment error:', err);
    } finally {
      setEnrollingId(null);
    }
  };

  // Filtered Client Search
  const filteredCatalog = catalogCourses.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
  });

  const inProgressEnrollments = myCourses.filter(
    (e) => e.status === 'IN_PROGRESS' || e.status === 'NOT_STARTED'
  );
  const completedEnrollments = myCourses.filter((e) => e.status === 'COMPLETED');

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg pb-2xl">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-outline-variant/40 pb-md">
        <div>
          <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
            {activeTab === 'catalog' ? 'Course Catalog' : 'My Assigned Courses'}
          </h1>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            {activeTab === 'catalog'
              ? 'Explore and enroll in operational training modules across service lines.'
              : 'Track your active training progress and review completed certifications.'}
          </p>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/60">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all ${
              activeTab === 'catalog'
                ? 'bg-surface-container-lowest text-primary shadow-sm border border-outline-variant/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Training Catalog
          </button>
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all relative ${
              activeTab === 'my-courses'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock className="w-4 h-4" /> My Courses
            {inProgressEnrollments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-secondary text-on-secondary rounded-full text-[10px]">
                {inProgressEnrollments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Catalog Search & Filters Bar */}
      {activeTab === 'catalog' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or compliance requirement..."
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </form>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-sm w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Category Filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface py-2 pl-3.5 pr-8 rounded-lg font-geist text-xs font-semibold cursor-pointer hover:border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="ALL">All Categories</option>
                <option value="Sales">Sales</option>
                <option value="SDR">SDR / Outbound</option>
                <option value="Customer Support">Customer Support</option>
                <option value="Compliance">Compliance</option>
                <option value="Technical">Technical</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface py-2 pl-3.5 pr-8 rounded-lg font-geist text-xs font-semibold cursor-pointer hover:border-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="ALL">Any Difficulty</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Catalog Grid View */}
      {activeTab === 'catalog' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-72 rounded-xl bg-surface-container-low animate-pulse" />
              ))}
            </div>
          ) : filteredCatalog.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
              {filteredCatalog.map((course) => {
                const isEnrolled = course.enrollmentStatus && course.enrollmentStatus !== 'NOT_ENROLLED';

                return (
                  <div
                    key={course.id}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col group"
                  >
                    {/* Course Thumbnail */}
                    <div className="h-40 w-full relative overflow-hidden bg-surface-container-high flex items-center justify-center">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <BookOpen className="w-10 h-10 text-outline" />
                      )}

                      {/* Duration Tag */}
                      <div className="absolute top-2.5 right-2.5 bg-surface-container-lowest/90 backdrop-blur-sm px-2.5 py-1 rounded font-geist text-xs font-semibold text-on-surface flex items-center gap-1 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-outline" />
                        <span>{course.durationMinutes || 45}m</span>
                      </div>

                      {/* Mandatory Badge */}
                      {course.isMandatory && (
                        <div className="absolute top-2.5 left-2.5 bg-error-container text-on-error-container px-2 py-0.5 rounded font-geist text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <ShieldAlert className="w-3 h-3" /> Required
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-lg flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded font-geist text-[10px] font-bold uppercase tracking-wider">
                            {course.category || 'Training'}
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="font-geist text-xs text-on-surface-variant font-medium">
                            {course.difficulty || 'Beginner'}
                          </span>
                        </div>

                        <h3 className="font-geist text-lg font-bold text-on-surface mb-1.5 leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="font-inter text-xs text-on-surface-variant mb-md line-clamp-2">
                          {course.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-between mt-auto">
                        {isEnrolled ? (
                          <Link
                            href={`/courses/${course.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary py-2 px-4 rounded-lg font-geist font-semibold text-xs hover:bg-secondary-container hover:text-on-secondary-container transition-colors shadow-sm"
                          >
                            <span>Continue Course</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingId === course.id}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-lg font-geist font-semibold text-xs hover:bg-on-primary-fixed-variant transition-colors shadow-sm cursor-pointer disabled:opacity-50"
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
            <div className="bg-surface-container-lowest p-2xl rounded-xl border border-outline-variant text-center space-y-md">
              <BookOpen className="w-12 h-12 text-outline mx-auto" />
              <h3 className="font-geist text-lg font-bold text-on-surface">No Courses Found</h3>
              <p className="font-inter text-xs text-on-surface-variant">
                Try adjusting your search criteria or category filters.
              </p>
            </div>
          )}
        </>
      )}

      {/* My Courses View */}
      {activeTab === 'my-courses' && (
        <div className="space-y-xl">
          {/* Section 1: In Progress */}
          <div>
            <div className="flex items-center gap-2 mb-md">
              <h2 className="font-geist text-xl font-bold text-on-surface">In Progress</h2>
              <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-geist font-bold text-xs rounded-full">
                {inProgressEnrollments.length}
              </span>
            </div>

            {inProgressEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
                {inProgressEnrollments.map((e) => {
                  const course = e.course;
                  const progress = e.overallProgressPct || 0;

                  return (
                    <div
                      key={e.id}
                      className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-40 w-full relative overflow-hidden bg-surface-container-high flex items-center justify-center">
                        {course?.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course?.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-outline" />
                        )}

                        {e.dueDate && (
                          <div className="absolute top-2.5 right-2.5 bg-error-container text-on-error-container font-geist text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Due {new Date(e.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="p-md flex-1 flex flex-col justify-between">
                        <div>
                          <span className="font-geist text-[10px] font-bold text-primary uppercase tracking-wider">
                            {course?.category || 'Training'}
                          </span>
                          <h3 className="font-geist text-base font-bold text-on-surface mt-1 line-clamp-2">
                            {course?.title}
                          </h3>
                          <p className="font-inter text-xs text-on-surface-variant mt-1 line-clamp-2">
                            {course?.description}
                          </p>
                        </div>

                        <div className="mt-md pt-sm border-t border-outline-variant/30">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-geist text-xs text-on-surface-variant font-medium">
                              {progress}% Completed
                            </span>
                            <span className="font-inter text-xs text-on-surface-variant">
                              {course?.durationMinutes ? `${course.durationMinutes}m left` : 'Self-paced'}
                            </span>
                          </div>

                          <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden mb-md">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <Link
                            href={`/courses/${course?.id}`}
                            className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-lg font-geist font-semibold text-xs hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
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
              <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center space-y-sm">
                <CheckCircle2 className="w-10 h-10 text-secondary mx-auto" />
                <p className="font-geist text-sm font-bold text-on-surface">No In-Progress Courses</p>
                <p className="font-inter text-xs text-on-surface-variant">
                  Select a course from the training catalog to get started.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Completed Courses */}
          {completedEnrollments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-md">
                <h2 className="font-geist text-xl font-bold text-on-surface">Completed Training</h2>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-geist font-bold text-xs rounded-full">
                  {completedEnrollments.length}
                </span>
              </div>

              <div className="space-y-sm">
                {completedEnrollments.map((e) => (
                  <div
                    key={e.id}
                    className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between gap-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-geist text-sm font-bold text-on-surface">{e.course?.title}</h4>
                        <p className="font-inter text-xs text-on-surface-variant">
                          Completed on {new Date(e.completedAt || e.updatedAt).toLocaleDateString()} • Final Score: {e.finalScorePct || 100}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${e.course?.id}`}
                        className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high font-geist text-xs font-semibold rounded-lg transition-colors"
                      >
                        Review
                      </Link>
                    </div>
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

function PlusIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}
