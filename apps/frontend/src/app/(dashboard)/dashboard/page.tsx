'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function AgentDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [coursesRes, analyticsRes] = await Promise.all([
        apiClient.get('/enrollments/my-courses'),
        apiClient.get('/analytics/learner'),
      ]);

      setEnrollments(coursesRes.data || []);
      setMetrics(analyticsRes.data || null);
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
    }
  };

  // Identify featured active course (highest overallProgressPct < 100 or first in-progress course)
  const activeEnrollment =
    enrollments.find((e) => e.status === 'IN_PROGRESS' || (e.overallProgressPct > 0 && e.overallProgressPct < 100)) ||
    enrollments[0];

  const activeCourse = activeEnrollment?.course;

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <h2 className="font-geist text-3xl md:text-4xl font-bold text-on-background tracking-tight">
            Hello {user?.name ? user.name.split(' ')[0] : 'Agent'},
          </h2>
          <p className="font-inter text-base text-on-surface-variant mt-1">
            Ready to continue your learning journey and boost your performance metrics today?
          </p>
        </div>
        <div className="flex items-center gap-2 font-geist text-xs text-on-surface-variant bg-surface-container py-1.5 px-3 rounded-full self-start md:self-end border border-outline-variant/30 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
          <span>Last login: Today, 08:45 AM</span>
        </div>
      </div>

      {/* Hero Section: Continue Learning */}
      {activeCourse ? (
        <section className="relative bg-surface-container-lowest rounded-xl border border-outline-variant shadow-md overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-container/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex flex-col md:flex-row">
            {/* Thumbnail Area */}
            <div className="w-full md:w-2/5 lg:w-1/3 relative h-48 md:h-auto overflow-hidden bg-surface-container-high flex items-center justify-center">
              {activeCourse.thumbnailUrl ? (
                <img
                  src={activeCourse.thumbnailUrl}
                  alt={activeCourse.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 p-md text-primary">
                  <BookOpen className="w-12 h-12" />
                  <span className="font-geist font-bold text-xs uppercase tracking-wider">{activeCourse.category}</span>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-secondary text-on-secondary font-geist text-xs font-semibold px-2.5 py-1 rounded shadow-md flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4" /> In Progress
              </div>
            </div>

            {/* Content Area */}
            <div className="w-full md:w-3/5 lg:w-2/3 p-lg md:p-xl flex flex-col justify-between relative z-10 bg-surface-container-lowest">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-md">
                  <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed rounded font-geist text-xs font-semibold">
                    {activeCourse.category || 'Core Training'}
                  </span>
                  <span className="font-inter text-xs text-on-surface-variant flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {activeCourse.durationMinutes || 45} mins total
                  </span>
                </div>
                <h3 className="font-geist text-2xl font-bold text-on-surface mb-2 tracking-tight">
                  {activeCourse.title}
                </h3>
                <p className="font-inter text-sm text-on-surface-variant mb-lg max-w-2xl line-clamp-2">
                  {activeCourse.description}
                </p>
              </div>

              {/* Progress Section */}
              <div className="mt-auto">
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-geist text-xs font-semibold text-on-surface-variant">Overall Course Progress</span>
                  <span className="font-geist text-sm font-bold text-primary">
                    {activeEnrollment.overallProgressPct || 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden mb-lg">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${activeEnrollment.overallProgressPct || 0}%` }}
                  />
                </div>
                <Link
                  href={`/courses/${activeCourse.id}`}
                  className="bg-primary text-on-primary font-geist font-semibold text-sm px-6 py-3 rounded-lg hover:bg-on-primary-fixed-variant transition-all duration-200 shadow-md flex items-center gap-2 w-full md:w-fit justify-center cursor-pointer"
                >
                  <span>Resume Course</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center space-y-md">
          <BookOpen className="w-12 h-12 text-primary mx-auto" />
          <h3 className="font-geist text-xl font-bold text-on-surface">No Active Courses Enrolled</h3>
          <p className="font-inter text-sm text-on-surface-variant max-w-md mx-auto">
            Explore available BPO operational training tracks in the course catalog.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 bg-primary text-on-primary font-geist font-semibold text-sm px-5 py-2.5 rounded-lg shadow-sm"
          >
            Browse Course Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* 3-Column Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg xl:gap-xl">
        {/* Left Column (Span 2): Assigned Training Grid */}
        <div className="lg:col-span-2 space-y-md">
          <div className="flex items-center justify-between">
            <h3 className="font-geist text-xl font-bold text-on-surface">Assigned Training</h3>
            <Link
              href="/courses"
              className="font-geist text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>View all catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md xl:gap-lg">
            {enrollments.length > 0 ? (
              enrollments.map((item) => {
                const course = item.course;
                const progress = item.overallProgressPct || 0;
                const isDone = item.status === 'COMPLETED';

                return (
                  <div
                    key={item.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
                  >
                    <div className="h-40 relative overflow-hidden bg-surface-container-high flex items-center justify-center">
                      {course?.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <BookOpen className="w-10 h-10 text-outline" />
                      )}
                      {course?.isMandatory && (
                        <span className="absolute top-2.5 right-2.5 bg-error text-on-error font-geist text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                          Mandatory
                        </span>
                      )}
                    </div>

                    <div className="p-md flex flex-col flex-1 justify-between">
                      <div>
                        <span className="font-geist text-[11px] font-semibold text-primary uppercase tracking-wider">
                          {course?.category || 'Training'}
                        </span>
                        <h4 className="font-geist text-sm font-bold text-on-surface mt-1 line-clamp-2">
                          {course?.title}
                        </h4>
                        <p className="font-inter text-xs text-on-surface-variant mt-1 line-clamp-2">
                          {course?.description}
                        </p>
                      </div>

                      <div className="mt-md pt-sm border-t border-outline-variant/30">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-geist text-xs text-on-surface-variant font-medium">
                            {isDone ? 'Completed' : progress > 0 ? 'In progress' : 'Not started'}
                          </span>
                          <span className="font-geist text-xs font-bold text-on-surface">{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDone ? 'bg-secondary' : progress > 0 ? 'bg-primary' : 'bg-outline'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <Link
                          href={`/courses/${course?.id}`}
                          className="mt-3 block text-center py-2 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-geist text-xs font-semibold rounded-lg transition-colors"
                        >
                          {isDone ? 'Review Content' : progress > 0 ? 'Continue' : 'Start Course'}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="col-span-2 text-sm text-on-surface-variant py-lg text-center">
                No courses assigned yet. Browse the course catalog to get started.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (Span 1): Sidebar Info Widgets */}
        <div className="space-y-lg">
          {/* Upcoming Deadlines Widget */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-geist text-sm font-bold text-on-surface flex items-center gap-2 mb-md pb-sm border-b border-outline-variant/30">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span>Upcoming Deadlines</span>
            </h3>

            <ul className="space-y-sm">
              {enrollments.filter((e) => e.dueDate || e.isMandatory).length > 0 ? (
                enrollments
                  .filter((e) => e.dueDate || e.isMandatory)
                  .map((e) => (
                    <li key={e.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-container transition-colors">
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-error shrink-0" />
                      <div>
                        <p className="font-geist text-xs font-bold text-on-surface line-clamp-1">
                          {e.course?.title}
                        </p>
                        <p className="font-inter text-xs text-error font-medium mt-0.5">
                          {e.dueDate ? `Due ${new Date(e.dueDate).toLocaleDateString()}` : 'Mandatory Completion'}
                        </p>
                      </div>
                    </li>
                  ))
              ) : (
                <li className="p-2 text-xs text-on-surface-variant">No overdue or upcoming deadlines.</li>
              )}
            </ul>
          </div>

          {/* Recent Achievements & Badges Widget */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-geist text-sm font-bold text-on-surface flex items-center gap-2 mb-md pb-sm border-b border-outline-variant/30">
              <Award className="w-4 h-4 text-secondary" />
              <span>Certificates & Badges</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-surface-container transition-colors text-center cursor-pointer"
                title="Customer Support Excellence"
              >
                <div className="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="font-geist text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  CS L1
                </span>
              </div>

              <div
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-surface-container transition-colors text-center cursor-pointer"
                title="InfoSec Foundation"
              >
                <div className="w-11 h-11 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="font-geist text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  InfoSec
                </span>
              </div>

              <Link
                href="/certificates"
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-outline-variant text-center hover:bg-surface-container transition-colors"
              >
                <Award className="w-5 h-5 text-outline" />
                <span className="font-geist text-[10px] font-semibold text-outline">View All</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
