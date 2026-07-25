'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
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
  ArrowRight,
  ShieldCheck,
  Check,
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

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Lesson Completed!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      if (navigation?.nextLesson) {
        await loadLesson(navigation.nextLesson.id);
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to mark as complete.',
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="h-96 w-full bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-white shadow-xl shadow-slate-200/40 rounded-3xl text-center space-y-6 border border-slate-100">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h3 className="font-geist text-2xl font-extrabold text-slate-900 mb-2">Course Not Found</h3>
          <p className="font-inter text-sm text-slate-500">The requested training course does not exist or has been archived.</p>
        </div>
        <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-[#4d44e3] text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-[#3b32d1] transition-all">
          Back to Catalog
        </Link>
      </div>
    );
  }

  const quizzes = course.quizzes || [];
  const primaryQuiz = quizzes[0];

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-8 pb-20 relative">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none"></div>
      
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#4d44e3] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </Link>

        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-400 text-xs tracking-wide">
            VERSION {course.version || 1}.0
          </span>
          {enrollment?.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-xs shadow-sm">
              <CheckCircle2 className="w-4 h-4" /> Passed & Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Lesson Content Player */}
        <div className="lg:col-span-3 space-y-6">
          {currentLesson ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[700px] relative">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              
              {/* Lesson Header */}
              <div className="p-10 border-b border-slate-100 relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-indigo-50 text-[#4d44e3] font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-indigo-100 shadow-sm">
                    {currentLesson.lessonType || 'TEXT'}
                  </span>
                  <span className="font-semibold text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {currentLesson.durationMinutes || 10} mins
                  </span>
                </div>

                <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {currentLesson.title}
                </h1>
                {currentLesson.description && (
                  <p className="font-inter text-base text-slate-500 mt-3 max-w-3xl">
                    {currentLesson.description}
                  </p>
                )}
              </div>

              {/* Lesson Media Embeds */}
              {currentLesson.lessonType === 'VIDEO' && currentLesson.videoUrl && (
                <div className="w-full aspect-video bg-slate-900 flex items-center justify-center relative z-10">
                  <iframe
                    src={currentLesson.videoUrl}
                    className="w-full h-full"
                    allowFullScreen
                    title={currentLesson.title}
                  />
                </div>
              )}

              {currentLesson.lessonType === 'PDF_FILE' && currentLesson.fileAttachmentUrl && (
                <div className="p-6 bg-slate-50 flex items-center justify-between border-b border-slate-200 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#4d44e3]">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <span className="font-geist text-sm font-bold text-slate-700">Attached Training Document (PDF)</span>
                  </div>
                  <a
                    href={currentLesson.fileAttachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold rounded-xl shadow-sm transition-all hover:shadow-md"
                  >
                    Download File
                  </a>
                </div>
              )}

              {/* Rich Markdown Content Area */}
              <div className="p-10 flex-1 font-inter text-base text-slate-700 leading-relaxed space-y-6 relative z-10 prose prose-slate max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="font-geist text-3xl font-extrabold text-slate-900 mb-6 mt-8">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-geist text-2xl font-bold text-slate-900 mt-8 mb-4">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-geist text-xl font-bold text-slate-900 mt-6 mb-3">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 text-slate-600 text-[15px]">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-600">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-600">{children}</ol>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[#4d44e3] pl-6 py-3 my-6 bg-indigo-50/50 text-slate-800 rounded-r-2xl italic font-medium">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="bg-slate-100 px-2 py-1 rounded-md text-sm font-mono text-pink-600 border border-slate-200">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {currentLesson.content || 'No text content available for this lesson.'}
                </ReactMarkdown>
              </div>

              {/* Bottom Sequential Controls Bar */}
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-6 relative z-10 rounded-b-3xl">
                <button
                  disabled={!navigation?.previousLesson}
                  onClick={() => navigation?.previousLesson && loadLesson(navigation.previousLesson.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Lesson
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleMarkComplete}
                    disabled={marking}
                    className="flex items-center gap-2 px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-bold text-sm hover:bg-[#3b32d1] hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {marking ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Mark Complete & Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {primaryQuiz && (
                    <Link
                      href={`/quizzes/${primaryQuiz.id}?enrollmentId=${enrollment?.id}`}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-50 shadow-sm transition-all"
                    >
                      <Award className="w-4 h-4" /> Take Final Quiz
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-geist text-lg font-bold text-slate-900">Select a lesson to begin reading.</p>
              <p className="text-sm text-slate-500 mt-2">Use the outline panel on the right to navigate.</p>
            </div>
          )}
        </div>

        {/* Right Column: Outline Tree & Quiz Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Progress Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-60"></div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-geist text-sm font-bold text-slate-900">Course Progress</span>
                <span className="font-geist text-sm font-extrabold text-[#4d44e3]">{enrollment?.overallProgressPct || 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#4d44e3] to-[#8079ff] rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${enrollment?.overallProgressPct || 0}%` }}
                />
              </div>
            </div>

            {primaryQuiz && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
                <div>
                  <h4 className="font-geist text-sm font-bold text-slate-900">Assessment Quiz</h4>
                  <p className="font-inter text-xs text-slate-500 mt-1">
                    Passing threshold: <span className="font-semibold text-slate-700">{primaryQuiz.passingScorePct}%</span>
                  </p>
                </div>
                <Link
                  href={`/quizzes/${primaryQuiz.id}?enrollmentId=${enrollment?.id}`}
                  className="w-full text-center py-2.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                  Start Assessment
                </Link>
              </div>
            )}
          </div>

          {/* Module & Lesson Outline Tree */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-4">
            <h3 className="font-geist text-base font-extrabold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <BookOpen className="w-5 h-5 text-[#4d44e3]" />
              <span>Syllabus ({outline?.totalLessons || 0} Lessons)</span>
            </h3>

            <div className="space-y-6 pt-2">
              {outline?.modules?.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="space-y-3">
                  <p className="font-geist text-[10px] font-extrabold text-slate-500 uppercase tracking-widest pl-2 border-l-2 border-slate-200">
                    Module {mIdx + 1}: {mod.title}
                  </p>

                  <div className="space-y-1.5 pl-2 border-l-2 border-slate-100 ml-0.5">
                    {mod.lessons?.map((les: any) => {
                      const isActive = currentLesson?.id === les.id;
                      const isCompleted = completedLessonIds.includes(les.id);

                      return (
                         <button
                           key={les.id}
                           onClick={() => loadLesson(les.id)}
                           className={`w-full flex items-center justify-between p-3 rounded-xl text-left text-sm font-semibold transition-all group ${
                             isActive
                               ? 'bg-indigo-50 text-[#4d44e3] shadow-sm border border-indigo-100'
                               : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                           }`}
                         >
                           <div className="flex items-center gap-3 truncate pr-2">
                             {isCompleted ? (
                               <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                               </div>
                             ) : (
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-[#4d44e3] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                 {les.lessonType === 'VIDEO' ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                               </div>
                             )}
                             <span className="truncate">{les.title}</span>
                           </div>
                           <span className={`text-[10px] font-bold shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
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
