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

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleTextAnswer = (questionId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (submitting || !quiz) return;
    setSubmitting(true);

    try {
      // Format answers payload
      const formattedAnswers = Object.keys(answers).map((qId) => ({
        questionId: qId,
        selectedOptionIndex: typeof answers[qId] === 'number' ? answers[qId] : undefined,
        textAnswer: typeof answers[qId] === 'string' ? answers[qId] : undefined,
      }));

      const submitRes = await apiClient.post('/quizzes/submit', {
        quizId,
        enrollmentId: enrollmentId || undefined,
        answers: formattedAnswers,
      });

      const result = submitRes.data;
      setAttemptResult(result);

      // Fetch detailed attempt breakdown & missed questions analysis
      if (result.attemptId) {
        const breakdownRes = await apiClient.get(`/quizzes/attempts/${result.attemptId}`);
        setAttemptBreakdown(breakdownRes.data);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
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
      <div className="max-w-[800px] mx-auto p-lg space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="h-96 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-md mx-auto my-2xl p-xl bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-md">
        <HelpCircle className="w-12 h-12 text-outline mx-auto" />
        <h3 className="font-geist text-xl font-bold text-on-surface">Quiz Not Found</h3>
        <Link href="/courses" className="inline-flex items-center gap-2 bg-primary text-on-primary py-2 px-4 rounded-lg font-geist text-xs font-semibold">
          Back to Courses
        </Link>
      </div>
    );
  }

  const questions = quiz.questions || [];

  return (
    <div className="max-w-[800px] mx-auto w-full space-y-xl pb-2xl">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-outline-variant/40 pb-sm">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1 text-xs font-geist font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </Link>

        {timeLeftSeconds !== null && !attemptResult && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-outline-variant/60 rounded-full font-mono text-xs font-bold text-primary">
            <Clock className="w-4 h-4 text-primary" />
            <span>Time Remaining: {formatTime(timeLeftSeconds)}</span>
          </div>
        )}
      </div>

      {/* VIEW A: QUIZ EXECUTION PLAYER */}
      {!attemptResult ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg md:p-xl space-y-xl">
          <div className="border-b border-outline-variant/40 pb-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary-fixed text-on-primary-fixed font-geist text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                Assessment Quiz
              </span>
              <span className="font-inter text-xs text-on-surface-variant">
                Passing Threshold: {quiz.passingScorePct}%
              </span>
            </div>

            <h1 className="font-geist text-2xl font-bold text-on-surface tracking-tight">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="font-inter text-xs text-on-surface-variant mt-1">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-xl">
            {questions.map((q: any, qIdx: number) => {
              const selectedOpt = answers[q.id];

              return (
                <div key={q.id} className="space-y-md p-md bg-surface-container-low/60 rounded-xl border border-outline-variant/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-geist text-sm font-bold text-on-surface flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {qIdx + 1}
                      </span>
                      <span>{q.questionText}</span>
                    </h3>
                    <span className="font-geist text-[10px] font-bold text-outline uppercase shrink-0">
                      {q.points || 10} pts
                    </span>
                  </div>

                  {/* MCQ & True/False Options */}
                  {(q.questionType === 'MULTIPLE_CHOICE' || q.questionType === 'TRUE_FALSE') && (
                    <div className="space-y-2 pl-8">
                      {q.options?.map((optionText: string, oIdx: number) => {
                        const isChecked = selectedOpt === oIdx;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSelectOption(q.id, oIdx)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left font-inter text-xs transition-all cursor-pointer border ${
                              isChecked
                                ? 'bg-primary-fixed/30 border-primary text-on-surface font-semibold shadow-sm'
                                : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface hover:bg-surface-container-high'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isChecked ? 'border-primary bg-primary' : 'border-outline'
                              }`}
                            >
                              {isChecked && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span>{optionText}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Input */}
                  {q.questionType === 'SHORT_ANSWER' && (
                    <div className="pl-8">
                      <textarea
                        rows={3}
                        value={selectedOpt || ''}
                        onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                        placeholder="Type your response..."
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface p-3 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="pt-md border-t border-outline-variant/40 flex justify-end">
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-geist font-bold text-xs rounded-xl hover:bg-on-primary-fixed-variant shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>{submitting ? 'Grading Responses...' : 'Submit Assessment'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW B: GRADED RESULTS & MISSED QUESTIONS DRILL-DOWN ANALYSIS */
        <div className="space-y-xl animate-fadeIn">
          {/* Result Banner Card */}
          <div
            className={`p-xl rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-md ${
              attemptResult.passed
                ? 'bg-secondary-container/30 border-secondary text-on-secondary-container'
                : 'bg-error-container/30 border-error text-on-error-container'
            }`}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-bold ${
                  attemptResult.passed
                    ? 'bg-secondary-container text-secondary'
                    : 'bg-error-container text-error'
                }`}
              >
                {attemptResult.passed ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>

              <div>
                <span className="font-geist text-xs font-bold uppercase tracking-wider">
                  {attemptResult.passed ? 'Assessment Passed!' : 'Assessment Retake Required'}
                </span>
                <h2 className="font-geist text-3xl font-bold mt-0.5">
                  Final Score: {attemptResult.scorePct}%
                </h2>
                <p className="font-inter text-xs mt-1 opacity-90">
                  Required passing threshold: {quiz.passingScorePct}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {attemptResult.passed ? (
                <Link
                  href="/certificates"
                  className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-on-secondary font-geist font-bold text-xs rounded-lg hover:bg-secondary-container hover:text-on-secondary-container shadow-md transition-all"
                >
                  <Award className="w-4 h-4" /> Request Certificate Now
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setAttemptResult(null);
                    setAttemptBreakdown(null);
                    setAnswers({});
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-error text-on-error font-geist font-bold text-xs rounded-lg hover:opacity-90 shadow-md transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>
              )}
            </div>
          </div>

          {/* Missed Questions Breakdown Analysis */}
          {attemptBreakdown?.questions && (
            <div className="bg-surface-container-lowest p-lg md:p-xl rounded-xl border border-outline-variant shadow-sm space-y-lg">
              <div>
                <h3 className="font-geist text-xl font-bold text-on-surface flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span>Question Breakdown & Missed Questions Analysis</span>
                </h3>
                <p className="font-inter text-xs text-on-surface-variant mt-1">
                  Review your responses, correct answers, and instructional feedback for missed questions.
                </p>
              </div>

              <div className="space-y-lg">
                {attemptBreakdown.questions.map((item: any, idx: number) => {
                  const isCorrect = item.isCorrect;

                  return (
                    <div
                      key={idx}
                      className={`p-md rounded-xl border space-y-md ${
                        isCorrect
                          ? 'bg-surface-container-low border-outline-variant/40'
                          : 'bg-error-container/10 border-error/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-error shrink-0" />
                          )}
                          <h4 className="font-geist text-sm font-bold text-on-surface">
                            Question {idx + 1}: {item.questionText}
                          </h4>
                        </div>
                        <span className="font-geist text-xs font-bold text-on-surface-variant">
                          {item.pointsEarned} / {item.maxPoints} pts
                        </span>
                      </div>

                      {/* Options & Selected comparison */}
                      {item.options && (
                        <div className="space-y-1.5 pl-7">
                          {item.options.map((optText: string, oIdx: number) => {
                            const isSelected = item.selectedOptionIndex === oIdx;
                            const isRightOption = item.correctOptionIndex === oIdx;

                            return (
                              <div
                                key={oIdx}
                                className={`p-2.5 rounded-lg text-xs font-inter flex items-center justify-between ${
                                  isRightOption
                                    ? 'bg-secondary-container/40 font-semibold text-on-secondary-container border border-secondary/30'
                                    : isSelected
                                    ? 'bg-error-container/40 font-semibold text-on-error-container border border-error/30'
                                    : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
                                }`}
                              >
                                <span>{optText}</span>
                                {isRightOption && (
                                  <span className="font-geist text-[10px] font-bold text-secondary uppercase">
                                    Correct Answer
                                  </span>
                                )}
                                {isSelected && !isRightOption && (
                                  <span className="font-geist text-[10px] font-bold text-error uppercase">
                                    Your Choice
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation Rationale Box */}
                      {item.explanation && (
                        <div className="pl-7 pt-1">
                          <div className="p-3 bg-surface-container-high rounded-lg font-inter text-xs text-on-surface border-l-4 border-primary space-y-0.5">
                            <span className="font-geist font-bold text-primary block">
                              Instructional Rationale:
                            </span>
                            <p className="text-on-surface-variant">{item.explanation}</p>
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
