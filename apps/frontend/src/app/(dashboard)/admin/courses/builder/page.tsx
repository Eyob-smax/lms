'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Plus,
  Trash2,
  Save,
  Send,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  ShieldCheck,
  X,
  Edit3,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from '../../../../../lib/api-client';

export default function AICourseBuilderPage() {
  const router = useRouter();

  // AI Prompt Inputs
  const [topic, setTopic] = useState('');
  const [targetRole, setTargetRole] = useState('SDR');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [moduleCount, setModuleCount] = useState('3');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Generated & Editable Draft State
  const [draft, setDraft] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'edit-course' | 'edit-quiz'>('preview');

  // Users List for Targeted Assignment
  const [usersList, setUsersList] = useState<any[]>([]);

  // Publishing State
  const [publishTarget, setPublishTarget] = useState<'ALL' | 'DEPARTMENT' | 'SINGLE_AGENT'>('DEPARTMENT');
  const [targetDepartment, setTargetDepartment] = useState('SDR');
  const [targetUserId, setTargetUserId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setUsersList(data);
      if (data.length > 0) setTargetUserId(data[0].id);
    } catch (err) {
      console.warn('Failed to load users for assignment:', err);
    }
  };

  const handleGenerateAIDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please enter a course topic or objective.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setPublishSuccess(null);

    try {
      const res = await apiClient.post('/ai-courses/generate-draft', {
        topic,
        targetRole,
        durationMinutes: parseInt(durationMinutes, 10),
        moduleCount: parseInt(moduleCount, 10),
      });

      setDraft(res.data);
      setActiveTab('preview');
    } catch (err: any) {
      console.error('AI generation error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to generate AI course draft. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!draft) return;
    setIsPublishing(true);
    setErrorMsg(null);
    setPublishSuccess(null);

    try {
      const payload: any = {
        course: draft.course,
        quiz: draft.quiz,
        isMandatory,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      };

      if (publishTarget === 'DEPARTMENT') {
        payload.department = targetDepartment;
      } else if (publishTarget === 'SINGLE_AGENT' && targetUserId) {
        payload.userIds = [targetUserId];
      }

      await apiClient.post('/ai-courses/publish-draft', payload);

      setPublishSuccess('AI Course and Quiz published successfully to assigned agents!');
      setTimeout(() => {
        router.push('/courses');
      }, 2000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to publish course. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Inline Draft Editors
  const handleUpdateCourseTitle = (newTitle: string) => {
    setDraft({
      ...draft,
      course: { ...draft.course, title: newTitle },
    });
  };

  const handleUpdateQuestion = (qIndex: number, updatedQ: any) => {
    const updatedQuestions = [...draft.quiz.questions];
    updatedQuestions[qIndex] = updatedQ;
    setDraft({
      ...draft,
      quiz: { ...draft.quiz, questions: updatedQuestions },
    });
  };

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg border-b border-outline-variant/40 pb-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
              AI Course & Quiz Authoring Suite
            </h1>
            <span className="px-2.5 py-0.5 bg-primary-container text-on-primary-container font-geist font-bold text-xs rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Gemini AI Omni
            </span>
          </div>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            Leverage AI to scaffold high-impact operational courses and graded assessment quizzes in seconds.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-md rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center gap-3 text-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-error shrink-0" />
          <span className="font-geist font-semibold">{errorMsg}</span>
        </div>
      )}

      {publishSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{publishSuccess}</span>
        </div>
      )}

      {/* Main Studio Grid: Left Generator Form + Right Live Draft Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
        {/* Left Column: AI Prompt Form (4 Cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
          <h2 className="font-geist text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-sm">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Course Definition Prompt</span>
          </h2>

          <form onSubmit={handleGenerateAIDraft} className="space-y-md">
            <div className="space-y-1">
              <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                Course Topic or Operational Objective
              </label>
              <textarea
                rows={4}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Advanced Cold Call Objection Handling for Remote SDR Teams, focusing on pricing pushbacks, competitor comparisons, and gatekeeper navigation..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface p-3 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                >
                  <option value="SDR">SDR (Sales Dev)</option>
                  <option value="Sales">Outbound Sales</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Telemarketing">Telemarketing</option>
                  <option value="IT Operations">IT & Operations</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Estimated Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                >
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                Module Breakdown Count
              </label>
              <select
                value={moduleCount}
                onChange={(e) => setModuleCount(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
              >
                <option value="2">2 Modules (Quick Training)</option>
                <option value="3">3 Modules (Standard Syllabus)</option>
                <option value="4">4 Modules (Deep Dive)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary font-geist font-bold text-xs rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Synthesizing Course & Quiz...' : 'Generate AI Syllabus & Quiz'}</span>
            </button>
          </form>

          {/* Publishing Target Card */}
          {draft && (
            <div className="pt-md border-t border-outline-variant/40 space-y-md animate-fadeIn">
              <h3 className="font-geist text-sm font-bold text-on-surface flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Publishing & Target Assignment</span>
              </h3>

              <div className="space-y-sm">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Assign To
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishTarget('DEPARTMENT')}
                    className={`py-2 px-3 rounded-lg font-geist text-xs font-bold border ${
                      publishTarget === 'DEPARTMENT'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant'
                    }`}
                  >
                    Entire Department
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishTarget('SINGLE_AGENT')}
                    className={`py-2 px-3 rounded-lg font-geist text-xs font-bold border ${
                      publishTarget === 'SINGLE_AGENT'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant'
                    }`}
                  >
                    Specific Agent
                  </button>
                </div>

                {publishTarget === 'DEPARTMENT' && (
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                  >
                    <option value="SDR">All SDR Agents</option>
                    <option value="Sales">All Outbound Sales Agents</option>
                    <option value="Customer Support">Customer Support Team</option>
                    <option value="Telemarketing">Telemarketing Department</option>
                  </select>
                )}

                {publishTarget === 'SINGLE_AGENT' && (
                  <select
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="w-full mt-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department || 'Agent'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-sm">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Due Date & Mandate
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2"
                />

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span className="font-geist text-xs font-bold text-on-surface">Mark as Mandatory Training</span>
                </label>
              </div>

              <button
                onClick={handlePublishCourse}
                disabled={isPublishing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-on-secondary font-geist font-bold text-xs rounded-xl shadow-md hover:bg-secondary-container hover:text-on-secondary-container transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing Course...' : 'Publish Course to Agents'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Draft Preview & Interactive Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-md">
          {draft ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[600px]">
              {/* Studio Header Tabs */}
              <div className="p-md bg-surface-container-low border-b border-outline-variant/40 flex items-center justify-between">
                <div className="flex bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/60">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all ${
                      activeTab === 'preview'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Course Outline & Markdown Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('edit-quiz')}
                    className={`px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'edit-quiz'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" /> Quiz Questions ({draft.quiz?.questions?.length || 0})
                  </button>
                </div>

                <span className="font-geist text-xs font-bold text-secondary bg-secondary-container/40 px-2.5 py-1 rounded-full">
                  AI Draft Ready
                </span>
              </div>

              {/* Tab 1: Course Markdown Preview */}
              {activeTab === 'preview' && (
                <div className="p-lg md:p-xl flex-1 space-y-lg">
                  <div>
                    <input
                      type="text"
                      value={draft.course.title}
                      onChange={(e) => handleUpdateCourseTitle(e.target.value)}
                      className="w-full font-geist text-2xl font-bold text-on-surface border-b border-outline-variant/40 pb-1 focus:outline-none focus:border-primary"
                    />
                    <p className="font-inter text-xs text-on-surface-variant mt-2">
                      {draft.course.description}
                    </p>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-md">
                    {draft.course.modules?.map((mod: any, mIdx: number) => (
                      <div key={mIdx} className="bg-surface-container-low p-md rounded-xl border border-outline-variant/60 space-y-sm">
                        <h3 className="font-geist text-sm font-bold text-on-surface flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          <span>Module {mIdx + 1}: {mod.title}</span>
                        </h3>

                        <div className="space-y-sm pl-4">
                          {mod.lessons?.map((les: any, lIdx: number) => (
                            <div key={lIdx} className="bg-surface-container-lowest p-md rounded-lg border border-outline-variant/40 space-y-2">
                              <h4 className="font-geist text-xs font-bold text-on-surface">
                                Lesson {lIdx + 1}: {les.title} ({les.durationMinutes}m)
                              </h4>
                              <div className="font-inter text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-md font-mono">
                                <ReactMarkdown>{les.content || ''}</ReactMarkdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Quiz & Questions Editor */}
              {activeTab === 'edit-quiz' && (
                <div className="p-lg md:p-xl flex-1 space-y-lg">
                  <div className="border-b border-outline-variant/40 pb-md">
                    <h3 className="font-geist text-xl font-bold text-on-surface">
                      {draft.quiz?.title || 'Generated Assessment Quiz'}
                    </h3>
                    <p className="font-inter text-xs text-on-surface-variant mt-1">
                      Passing threshold: {draft.quiz?.passingScorePct || 80}% • Review and edit questions before publishing.
                    </p>
                  </div>

                  <div className="space-y-lg">
                    {draft.quiz?.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-surface-container-low p-md rounded-xl border border-outline-variant/60 space-y-md">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-geist text-xs font-bold text-primary">Question {qIdx + 1}</span>
                          <span className="font-geist text-[10px] font-bold bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded">
                            {q.questionType}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) =>
                            handleUpdateQuestion(qIdx, { ...q, questionText: e.target.value })
                          }
                          className="w-full font-geist text-sm font-bold text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg p-2.5"
                        />

                        {/* Options List */}
                        <div className="space-y-2 pl-2">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() =>
                                  handleUpdateQuestion(qIdx, { ...q, correctOptionIndex: optIdx })
                                }
                                className="text-primary focus:ring-primary cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = e.target.value;
                                  handleUpdateQuestion(qIdx, { ...q, options: newOpts });
                                }}
                                className={`flex-1 font-inter text-xs px-3 py-1.5 rounded-lg border ${
                                  q.correctOptionIndex === optIdx
                                    ? 'bg-secondary-container/30 border-secondary font-semibold text-on-surface'
                                    : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant'
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1 pt-1">
                          <label className="block font-geist text-[11px] font-semibold text-on-surface-variant">
                            Missed Question Explanation / Rationale
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(qIdx, { ...q, explanation: e.target.value })
                            }
                            className="w-full font-inter text-xs text-on-surface-variant bg-surface-container-lowest border border-outline-variant rounded-lg p-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container-lowest p-2xl rounded-xl border border-outline-variant shadow-sm text-center min-h-[500px] flex flex-col items-center justify-center space-y-md">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-geist text-xl font-bold text-on-surface">Course Studio Idle</h3>
              <p className="font-inter text-xs text-on-surface-variant max-w-sm">
                Enter your course topic on the left and click "Generate AI Syllabus & Quiz" to construct a complete operational course draft.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
