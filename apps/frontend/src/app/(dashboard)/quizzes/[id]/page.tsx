'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Sparkles,
  HelpCircle,
  RotateCcw,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiClient } from '../../../../lib/api-client';

export default function QuizPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const enrollmentId = searchParams.get('enrollmentId');

  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Timer State
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);

  // Result & Missed Questions State
  const [attemptResult, setAttemptResult] = useState<any>(null);
  const [attemptBreakdown, setAttemptBreakdown] = useState<any>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeftSeconds === null || timeLeftSeconds <= 0 || attemptResult) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeftSeconds, attemptResult]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/quizzes/${quizId}`);
      const data = res.data;
      setQuiz(data);

      if (data.timeLimitMinutes) {
        setTimeLeftSeconds(data.timeLimitMinutes * 60);
      }
    } catch (err) {
      console.warn('Failed to load quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number, optionId?: string, optionText?: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { index: optionIndex, id: optionId, text: optionText },
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleRequestCertificate = async (enrId?: string) => {
    const targetEnrId = enrId || attemptResult?.attempt?.enrollmentId || enrollmentId;
    try {
      await apiClient.post('/certificates/request', {
        enrollmentId: targetEnrId,
        courseId: quiz?.courseId,
      });
      Swal.fire({
        title: '🎓 Certificate Requested!',
        text: 'Your official certificate request has been submitted for admin review and PDF generation.',
        icon: 'success',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl font-inter' }
      }).then(() => {
        router.push('/certificates');
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Certificate Request',
        text: err?.response?.data?.message || 'Your certificate request has been recorded.',
        icon: 'info',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl font-inter' }
      }).then(() => {
        router.push('/certificates');
      });
    }
  };

  const handleSubmitQuiz = async () => {
    if (submitting || !quiz) return;

    const questions = quiz.questions || [];
    const unanswered = questions.filter((q: any) => !answers[q.id]);
    if (unanswered.length > 0) {
      Swal.fire({
        title: 'Incomplete Assessment',
        text: `Please answer all required questions before submitting. You have ${unanswered.length} unanswered question${unanswered.length > 1 ? 's' : ''}.`,
        icon: 'warning',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl font-inter', confirmButton: 'rounded-xl px-6 py-3 font-semibold' }
      });
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = questions.map((q: any) => {
        const val = answers[q.id];
        if (typeof val === 'object' && val !== null) {
          return {
            questionId: q.id,
            selectedOptionId: val.id,
            selectedOptionIndex: val.index,
            shortAnswerText: val.text,
          };
        }
        return {
          questionId: q.id,
          selectedOptionId: typeof val === 'string' && val.includes('-') ? val : undefined,
          selectedOptionIndex: typeof val === 'number' ? val : undefined,
          shortAnswerText: typeof val === 'string' ? val : undefined,
        };
      });

      const submitRes = await apiClient.post(`/quizzes/${quizId}/submit`, {
        quizId,
        enrollmentId: enrollmentId || undefined,
        answers: formattedAnswers,
      });

      const result = submitRes.data;
      setAttemptResult(result);

      if (result.attemptId) {
        const breakdownRes = await apiClient.get(`/quizzes/attempts/${result.attemptId}`).catch(() => ({ data: null }));
        if (breakdownRes.data) {
          setAttemptBreakdown(breakdownRes.data);
        }
      }

      if (result.isPassed || result.passed) {
        Swal.fire({
          title: '🎉 Assessment Passed!',
          text: `Congratulations! You scored ${result.scorePct}%. Would you like to request your official certification now?`,
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#94a3b8',
          confirmButtonText: 'Yes, Request Certificate!',
          cancelButtonText: 'Later',
          customClass: { popup: 'rounded-3xl shadow-xl font-inter', confirmButton: 'rounded-xl px-6 py-3 font-semibold', cancelButton: 'rounded-xl px-6 py-3 font-semibold' }
        }).then((res) => {
          if (res.isConfirmed) {
            handleRequestCertificate(result.attempt?.enrollmentId);
          }
        });
      }
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      Swal.fire({
        title: 'Submission Failed',
        text: err?.response?.data?.message || 'An error occurred while submitting your answers. Please try again.',
        icon: 'error',
        confirmButtonColor: '#e11d48',
        customClass: { popup: 'rounded-3xl shadow-xl font-inter' }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="h-96 w-full bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-white shadow-xl shadow-slate-200/40 rounded-3xl text-center space-y-6 border border-slate-100">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
          <HelpCircle className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h3 className="font-geist text-2xl font-extrabold text-slate-900 mb-2">Quiz Not Found</h3>
          <p className="font-inter text-sm text-slate-500">The requested assessment does not exist or has been archived.</p>
        </div>
        <Link href="/courses" className="inline-flex items-center justify-center gap-2 bg-[#4d44e3] text-white py-3 px-6 rounded-xl font-semibold text-sm hover:bg-[#3b32d1] transition-all">
          Back to Courses
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];

  return (
    <div className="max-w-[900px] mx-auto w-full space-y-10 pb-20 relative">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-[100px] -z-10 opacity-50 pointer-events-none"></div>

      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-6">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-[#4d44e3] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </Link>

        {timeLeftSeconds !== null && !attemptResult && (
          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full shadow-sm">
            <Clock className="w-4 h-4 text-rose-500" />
            <span className="font-mono text-sm font-bold text-rose-600 tracking-wide">{formatTime(timeLeftSeconds)}</span>
          </div>
        )}
      </div>

      {/* VIEW A: QUIZ EXECUTION PLAYER */}
      {!attemptResult ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 md:p-12 space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10"></div>
          
          <div className="border-b border-slate-100 pb-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <span className="inline-flex self-center md:self-auto bg-indigo-50 text-[#4d44e3] font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm">
                Assessment Quiz
              </span>
              <span className="font-inter text-sm font-medium text-slate-500">
                Passing Threshold: <span className="font-bold text-slate-700">{quiz.passingScorePct}%</span>
              </span>
            </div>

            <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="font-inter text-base text-slate-500 mt-3 max-w-2xl">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-10">
            {questions.map((q: any, qIdx: number) => {
              const selectedOpt = answers[q.id];

              return (
                <div key={q.id} className="space-y-6 p-8 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm relative group hover:border-indigo-100 transition-colors">
                  <div className="absolute left-0 top-8 w-1 h-12 bg-slate-200 rounded-r-md group-hover:bg-indigo-300 transition-colors"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-4">
                    <h3 className="font-geist text-lg font-bold text-slate-900 flex items-start gap-4">
                      <span className="w-8 h-8 rounded-xl bg-white text-[#4d44e3] border border-slate-200 shadow-sm flex items-center justify-center font-extrabold text-sm shrink-0">
                        {qIdx + 1}
                      </span>
                      <span className="pt-1 leading-snug">{q.questionText}</span>
                    </h3>
                    <span className="font-geist text-[11px] font-extrabold text-slate-400 uppercase tracking-widest shrink-0 sm:pt-1">
                      {q.points || 10} pts
                    </span>
                  </div>

                  {/* MCQ & True/False Options */}
                  {(q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE' || q.questionType === 'MCQ') && (
                    <div className="space-y-3 pl-12">
                      {q.options?.map((opt: any, oIdx: number) => {
                        const optionText = typeof opt === 'string' ? opt : opt?.optionText || `Option ${oIdx + 1}`;
                        const optionId = typeof opt === 'object' && opt?.id ? opt.id : undefined;
                        const isChecked = selectedOpt?.index === oIdx || selectedOpt?.id === optionId || selectedOpt === oIdx || selectedOpt === optionId;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, oIdx, optionId, optionText)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left font-inter text-sm transition-all duration-200 cursor-pointer border ${
                              isChecked
                                ? 'bg-indigo-50 border-[#4d44e3] shadow-md ring-1 ring-[#4d44e3]'
                                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                isChecked ? 'border-[#4d44e3] bg-[#4d44e3]' : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <span className={isChecked ? 'font-bold text-[#4d44e3]' : 'font-medium text-slate-700'}>{optionText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Input */}
                  {q.questionType === 'SHORT_ANSWER' && (
                    <div className="pl-12">
                      <textarea
                        rows={4}
                        value={typeof selectedOpt === 'string' ? selectedOpt : (selectedOpt?.text || '')}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        placeholder="Type your detailed response here..."
                        className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 p-4 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-y"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#4d44e3] to-[#8079ff] text-white font-geist font-extrabold text-sm rounded-xl hover:shadow-xl hover:shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <Award className="w-5 h-5" />
              <span>{submitting ? 'Grading Responses...' : 'Submit Assessment'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: GRADED RESULTS & MISSED QUESTIONS DRILL-DOWN ANALYSIS */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Result Banner Card */}
          <div
            className={`p-10 rounded-3xl border shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden ${
              attemptResult.passed || attemptResult.isPassed
                ? 'bg-emerald-50/80 border-emerald-100'
                : 'bg-rose-50/80 border-rose-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-50 pointer-events-none ${attemptResult.passed || attemptResult.isPassed ? 'bg-emerald-200' : 'bg-rose-200'}`}></div>

            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative z-10">
              <div
                className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border ${
                  attemptResult.passed || attemptResult.isPassed
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-emerald-500'
                    : 'bg-gradient-to-br from-rose-400 to-rose-600 text-white border-rose-500'
                }`}
              >
                {attemptResult.passed || attemptResult.isPassed ? (
                  <CheckCircle2 className="w-10 h-10" />
                ) : (
                  <XCircle className="w-10 h-10" />
                )}
              </div>

              <div>
                <span className={`font-geist text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${attemptResult.passed || attemptResult.isPassed ? 'bg-emerald-200/50 text-emerald-800' : 'bg-rose-200/50 text-rose-800'}`}>
                  {attemptResult.passed || attemptResult.isPassed ? 'Assessment Passed' : 'Retake Required'}
                </span>
                <h2 className={`font-geist text-4xl font-extrabold mt-3 ${attemptResult.passed || attemptResult.isPassed ? 'text-emerald-900' : 'text-rose-900'}`}>
                  Final Score: {attemptResult.scorePct}%
                </h2>
                <p className={`font-inter text-sm mt-2 font-medium ${attemptResult.passed || attemptResult.isPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                  Required passing threshold: {quiz.passingScorePct}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
              {attemptResult.passed || attemptResult.isPassed ? (
                <button
                  type="button"
                  onClick={() => handleRequestCertificate(attemptResult.attempt?.enrollmentId)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white font-geist font-extrabold text-sm rounded-xl hover:bg-emerald-700 shadow-xl hover:shadow-emerald-200 transition-all cursor-pointer"
                >
                  <Award className="w-5 h-5" /> Request Certificate
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAttemptResult(null);
                    setAttemptBreakdown(null);
                    setAnswers({});
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white font-geist font-extrabold text-sm rounded-xl hover:bg-rose-700 shadow-xl hover:shadow-rose-200 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" /> Retake Quiz
                </button>
              )}
            </div>
          </div>

          {/* Missed Questions Breakdown Analysis */}
          {attemptBreakdown?.questions && (
            <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
              <div className="border-b border-slate-100 pb-6">
                <h3 className="font-geist text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[#4d44e3]" />
                  <span>Performance Breakdown</span>
                </h3>
                <p className="font-inter text-sm text-slate-500 mt-2">
                  Review your responses, correct answers, and instructional feedback for missed questions.
                </p>
              </div>

              <div className="space-y-6">
                {attemptBreakdown.questions.map((item: any, idx: number) => {
                  const isCorrect = item.isCorrect;

                  return (
                    <div
                      key={idx}
                      className={`p-6 md:p-8 rounded-2xl border space-y-6 transition-colors ${
                        isCorrect
                          ? 'bg-slate-50/50 border-slate-100 hover:border-emerald-200'
                          : 'bg-rose-50/30 border-rose-100 hover:border-rose-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                              <XCircle className="w-5 h-5" />
                            </div>
                          )}
                          <h4 className="font-geist text-base font-bold text-slate-900 pt-1 leading-relaxed">
                            <span className="text-slate-500 mr-2 font-extrabold">Q{idx + 1}.</span> {item.questionText}
                          </h4>
                        </div>
                        <span className="font-geist text-[11px] font-extrabold uppercase tracking-widest shrink-0 pt-2 sm:pt-1 text-slate-400">
                          <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{item.pointsEarned}</span> / {item.maxPoints} pts
                        </span>
                      </div>

                      {/* Options & Selected comparison */}
                      {item.options && (
                        <div className="space-y-2.5 pl-11">
                          {item.options.map((optText: string, oIdx: number) => {
                            const isSelected = item.selectedOptionIndex === oIdx;
                            const isRightOption = item.correctOptionIndex === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-4 rounded-xl text-sm font-inter flex items-center justify-between ${
                                  isRightOption
                                    ? 'bg-emerald-50 font-bold text-emerald-900 border border-emerald-200 ring-1 ring-emerald-500/20'
                                    : isSelected
                                    ? 'bg-rose-50 font-bold text-rose-900 border border-rose-200 ring-1 ring-rose-500/20'
                                    : 'bg-white text-slate-600 border border-slate-200'
                                }`}
                              >
                                <span>{optText}</span>
                                <div className="flex gap-2">
                                  {isRightOption && (
                                    <span className="font-geist text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-100/50 px-2 py-1 rounded-md">
                                      Correct
                                    </span>
                                  )}
                                  {isSelected && !isRightOption && (
                                    <span className="font-geist text-[10px] font-extrabold text-rose-600 uppercase tracking-wider bg-rose-100/50 px-2 py-1 rounded-md">
                                      Your Choice
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation Rationale Box */}
                      {item.explanation && (
                        <div className="pl-11 pt-2">
                          <div className="p-5 bg-indigo-50/50 rounded-xl font-inter text-sm text-slate-700 border border-indigo-100 shadow-sm space-y-2">
                            <span className="font-geist text-[11px] font-extrabold text-[#4d44e3] uppercase tracking-widest block flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4" /> Instructional Rationale
                            </span>
                            <p className="leading-relaxed">{item.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
