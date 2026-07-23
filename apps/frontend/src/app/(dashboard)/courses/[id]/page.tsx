'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Video,
  FileDown,
  Award,
  PlayCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../../../lib/api-client';

export default function CourseReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [outline, setOutline] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [navigation, setNavigation] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Course details & outline
      const [courseRes, outlineRes, myCoursesRes] = await Promise.all([
        apiClient.get(`/courses/${courseId}`),
        apiClient.get(`/lessons/course/${courseId}/outline`),
        apiClient.get('/enrollments/my-courses'),
      ]);

      setCourse(courseRes.data);
      setOutline(outlineRes.data);

      const userEnrollments = myCoursesRes.data || [];
      const currentEnr = userEnrollments.find((e: any) => e.courseId === courseId);
      setEnrollment(currentEnr);

      // Select initial lesson (first lesson of first module)
      const firstModule = outlineRes.data?.modules?.[0];
      const firstLesson = firstModule?.lessons?.[0];

      if (firstLesson) {
        loadLesson(firstLesson.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn('Failed to load course reader:', err);
      setLoading(false);
    }
  };

  const loadLesson = async (lessonId: string) => {
    try {
      const [lessonRes, navRes] = await Promise.all([
        apiClient.get(`/lessons/${lessonId}`),
        apiClient.get(`/lessons/${lessonId}/navigation`),
      ]);

      setCurrentLesson(lessonRes.data);
      setNavigation(navRes.data);
    } catch (err) {
      console.error('Failed to load lesson details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !enrollment) return;
    setMarking(true);

    try {
      const res = await apiClient.post('/enrollments/mark-lesson', {
        enrollmentId: enrollment.id,
        lessonId: currentLesson.id,
      });

      setEnrollment(res.data);
      if (!completedLessonIds.includes(currentLesson.id)) {
        setCompletedLessonIds([...completedLessonIds, currentLesson.id]);
      }

      // Automatically advance to next lesson if available
      if (navigation?.nextLesson) {
        await loadLesson(navigation.nextLesson.id);
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto p-xl space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="h-96 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-2xl p-xl bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-md">
        <BookOpen className="w-12 h-12 text-outline mx-auto" />
        <h3 className="font-geist text-xl font-bold text-on-surface">Course Not Found</h3>
        <p className="font-inter text-xs text-on-surface-variant">The requested training course does not exist or has been archived.</p>
        <Link href="/courses" className="inline-flex items-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-lg font-geist text-xs font-semibold">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const quizzes = course.quizzes || [];
  const primaryQuiz = quizzes[0];

  return (
    <div className="max-w-container-max mx-auto w-full space-y-lg pb-2xl">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-xs font-geist font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="flex items-center gap-3">
          <span className="font-geist text-xs font-semibold text-on-surface-variant">
            Course Version v{course.version || 1}.0
          </span>
          {enrollment?.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 font-geist text-xs font-bold text-secondary bg-secondary-container px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Passed & Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Left Lesson Reader (Span 2) + Right Outline Sidebar (Span 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg xl:gap-xl">
        {/* Left Column: Lesson Content Player */}
        <div className="lg:col-span-2 space-y-md">
          {currentLesson ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              {/* Lesson Header */}
              <div className="p-lg bg-surface-container-low border-b border-outline-variant/40">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-primary-fixed text-on-primary-fixed font-geist text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    {currentLesson.lessonType || 'TEXT'}
                  </span>
                  <span className="font-inter text-xs text-on-surface-variant flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {currentLesson.durationMinutes || 10} mins
                  </span>
                </div>

                <h1 className="font-geist text-2xl font-bold text-on-surface tracking-tight">
                  {currentLesson.title}
                </h1>
                {currentLesson.description && (
                  <p className="font-inter text-xs text-on-surface-variant mt-1">
                    {currentLesson.description}
                  </p>
                )}
              </div>

              {/* Lesson Media Embeds */}
              {currentLesson.lessonType === 'VIDEO' && currentLesson.videoUrl && (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <iframe
                    src={currentLesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={currentLesson.title}
                  />
                </div>
              )}

              {currentLesson.lessonType === 'PDF_FILE' && currentLesson.fileAttachmentUrl && (
                <div className="p-md bg-surface-container-high flex items-center justify-between border-b border-outline-variant">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-5 h-5 text-primary" />
                    <span className="font-geist text-xs font-semibold text-on-surface">Attached Training PDF Document</span>
                  </div>
                  <a
                    href={currentLesson.fileAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-primary text-on-primary text-xs font-geist font-semibold rounded-lg"
                  >
                    Download File
                  </a>
                </div>
              )}

              {/* Rich Markdown Content Area */}
              <div className="p-lg md:p-xl flex-1 font-inter text-sm text-on-surface leading-relaxed space-y-md">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="font-geist text-2xl font-bold text-on-surface mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-geist text-xl font-bold text-on-surface mt-4 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-geist text-base font-bold text-on-surface mt-3 mb-1">{children}</h3>,
                    p: ({ children }) => <p className="mb-3 text-on-surface-variant">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary pl-4 py-2 my-3 bg-surface-container-low text-on-surface rounded-r-lg font-mono text-xs">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {currentLesson.content || 'No text content available for this lesson.'}
                </ReactMarkdown>
              </div>

              {/* Bottom Sequential Controls Bar */}
              <div className="p-md bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between gap-md">
                <button
                  disabled={!navigation?.previousLesson}
                  onClick={() => navigation?.previousLesson && loadLesson(navigation.previousLesson.id)}
                  className="flex items-center gap-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-geist text-xs font-semibold hover:bg-on-primary-fixed-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{marking ? 'Saving...' : 'Mark Complete & Next'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {primaryQuiz && (
                    <Link
                      href={`/quizzes/${primaryQuiz.id}?enrollmentId=${enrollment?.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-on-secondary rounded-lg font-geist text-xs font-semibold hover:bg-secondary-container hover:text-on-secondary-container shadow-sm transition-all"
                    >
                      <Award className="w-4 h-4" /> Take Quiz
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-xl rounded-xl border border-outline-variant text-center">
              <p className="font-geist text-sm font-semibold text-on-surface-variant">Select a lesson from the outline tree to begin reading.</p>
            </div>
          )}
        </div>

        {/* Right Column: Outline Tree & Quiz Card */}
        <div className="space-y-lg">
          {/* Progress Overview Card */}
          <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm space-y-md">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-geist text-xs font-bold text-on-surface">Course Completion</span>
                <span className="font-geist text-xs font-bold text-primary">{enrollment?.overallProgressPct || 0}%</span>
              </div>
              <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${enrollment?.overallProgressPct || 0}%` }}
                />
              </div>
            </div>

            {primaryQuiz && (
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant/60 flex items-center justify-between">
                <div>
                  <h4 className="font-geist text-xs font-bold text-on-surface">Assessment Quiz</h4>
                  <p className="font-inter text-[11px] text-on-surface-variant mt-0.5">
                    Passing threshold: {primaryQuiz.passingScorePct}%
                  </p>
                </div>
                <Link
                  href={`/quizzes/${primaryQuiz.id}?enrollmentId=${enrollment?.id}`}
                  className="px-3 py-1.5 bg-primary text-on-primary font-geist text-xs font-semibold rounded-lg shadow-sm hover:bg-on-primary-fixed-variant"
                >
                  Start Assessment
                </Link>
              </div>
            )}
          </div>

          {/* Module & Lesson Outline Tree */}
          <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm space-y-sm">
            <h3 className="font-geist text-sm font-bold text-on-surface flex items-center gap-2 pb-sm border-b border-outline-variant/30">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Course Modules ({outline?.totalLessons || 0} Lessons)</span>
            </h3>

            <div className="space-y-md pt-1">
              {outline?.modules?.map((mod: any) => (
                <div key={mod.id} className="space-y-1">
                  <p className="font-geist text-xs font-bold text-on-surface uppercase tracking-wider px-2 py-1 bg-surface-container-low rounded-md">
                    {mod.title}
                  </p>

                  <div className="space-y-1 pl-2">
                    {mod.lessons?.map((les: any) => {
                      const isActive = currentLesson?.id === les.id;
                      const isCompleted = completedLessonIds.includes(les.id);

                      return (
                        <button
                          key={les.id}
                          onClick={() => loadLesson(les.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs font-geist transition-all ${
                            isActive
                              ? 'bg-primary-fixed text-on-primary-fixed font-bold shadow-sm'
                              : 'text-on-surface hover:bg-surface-container-high'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 text-outline shrink-0" />
                            )}
                            <span className="truncate">{les.title}</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant font-medium shrink-0">
                            {les.durationMinutes}m
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
