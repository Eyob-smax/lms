'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Send,
  Users,
  AlertCircle,
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
      Swal.fire({
        title: 'Error',
        text: 'Please enter a course topic or objective.',
        icon: 'error',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl', confirmButton: 'rounded-xl px-6 py-3 font-semibold' }
      });
      return;
    }

    setIsGenerating(true);

    try {
      const res = await apiClient.post('/ai-courses/generate-draft', {
        topic,
        targetRole,
        durationMinutes: parseInt(durationMinutes, 10),
        moduleCount: parseInt(moduleCount, 10),
      });

      setDraft(res.data);
      setActiveTab('preview');
      
      Swal.fire({
        title: 'Draft Generated!',
        text: 'Your AI course draft is ready for review.',
        icon: 'success',
        confirmButtonColor: '#4d44e3',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-3xl shadow-xl' }
      });
    } catch (err: any) {
      console.error('AI generation error:', err);
      Swal.fire({
        title: 'Generation Failed',
        text: err.response?.data?.message || 'Failed to generate AI course draft. Please try again.',
        icon: 'error',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl', confirmButton: 'rounded-xl px-6 py-3 font-semibold' }
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishCourse = async () => {
    if (!draft) return;
    
    const result = await Swal.fire({
      title: 'Publish Course?',
      text: `Are you sure you want to publish this course to ${publishTarget.toLowerCase()}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4d44e3',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, Publish!',
      customClass: {
        popup: 'rounded-3xl shadow-xl border border-slate-100',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm'
      }
    });

    if (!result.isConfirmed) return;

    setIsPublishing(true);

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

      Swal.fire({
        title: 'Success!',
        text: 'AI Course and Quiz published successfully!',
        icon: 'success',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl', confirmButton: 'rounded-xl px-6 py-3 font-semibold' }
      }).then(() => {
        router.push('/dashboard');
      });
    } catch (err: any) {
      console.error('Publish error:', err);
      Swal.fire({
        title: 'Publish Failed',
        text: err.response?.data?.message || 'Failed to publish course. Please try again.',
        icon: 'error',
        confirmButtonColor: '#4d44e3',
        customClass: { popup: 'rounded-3xl shadow-xl', confirmButton: 'rounded-xl px-6 py-3 font-semibold' }
      });
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
    <div className="max-w-[1200px] mx-auto w-full space-y-10 pb-20 relative">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              AI Course & Quiz Studio
            </h1>
            <span className="px-3 py-1 bg-indigo-50 text-[#4d44e3] font-geist font-extrabold text-[10px] uppercase tracking-widest rounded-lg flex items-center gap-1 border border-indigo-100 shadow-sm">
              <Sparkles className="w-3 h-3" /> Gemini AI
            </span>
          </div>
          <p className="font-inter text-sm text-slate-500 mt-2">
            Leverage AI to scaffold high-impact operational courses and graded assessment quizzes in seconds.
          </p>
        </div>
      </div>

      {/* Main Studio Grid: Left Generator Form + Right Live Draft Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Prompt Form (4 Cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
          <h2 className="font-geist text-lg font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Sparkles className="w-5 h-5 text-[#4d44e3]" />
            <span>Course Definition Prompt</span>
          </h2>

          <form onSubmit={handleGenerateAIDraft} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                Course Topic or Operational Objective
              </label>
              <textarea
                rows={4}
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Advanced Cold Call Objection Handling for Remote SDR Teams..."
                className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 p-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Target Audience
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="SDR">SDR (Sales Dev)</option>
                  <option value="Sales">Outbound Sales</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Telemarketing">Telemarketing</option>
                  <option value="IT Operations">IT & Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Est. Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                >
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                  <option value="90">90 Minutes</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                Module Breakdown Count
              </label>
              <select
                value={moduleCount}
                onChange={(e) => setModuleCount(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
              >
                <option value="2">2 Modules (Quick Training)</option>
                <option value="3">3 Modules (Standard Syllabus)</option>
                <option value="4">4 Modules (Deep Dive)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#4d44e3] text-white font-geist font-bold text-sm rounded-xl shadow-lg hover:shadow-indigo-200 hover:bg-[#3b32d1] transition-all cursor-pointer disabled:opacity-50 mt-4"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Synthesizing Draft...' : 'Generate AI Syllabus'}</span>
            </button>
          </form>

          {/* Publishing Target Card */}
          {draft && (
            <div className="pt-6 border-t border-slate-100 space-y-6 animate-in fade-in">
              <h3 className="font-geist text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#4d44e3]" />
                <span>Publishing Assignment</span>
              </h3>

              <div className="space-y-2">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Assign To
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishTarget('DEPARTMENT')}
                    className={`py-2 px-3 rounded-xl font-geist text-xs font-bold border transition-colors ${
                      publishTarget === 'DEPARTMENT'
                        ? 'bg-indigo-50 text-[#4d44e3] border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Department
                  </button>

                  <button
                    type="button"
                    onClick={() => setPublishTarget('SINGLE_AGENT')}
                    className={`py-2 px-3 rounded-xl font-geist text-xs font-bold border transition-colors ${
                      publishTarget === 'SINGLE_AGENT'
                        ? 'bg-indigo-50 text-[#4d44e3] border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Agent
                  </button>
                </div>

                {publishTarget === 'DEPARTMENT' && (
                  <select
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer animate-in fade-in"
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
                    className="w-full mt-2 bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer animate-in fade-in"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.department || 'Agent'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />

                <label className="flex items-center gap-3 cursor-pointer pt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#4d44e3] focus:ring-[#4d44e3]"
                  />
                  <span className="font-geist text-sm font-bold text-slate-900">Mark as Mandatory Training</span>
                </label>
              </div>

              <button
                onClick={handlePublishCourse}
                disabled={isPublishing}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white font-geist font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-200 hover:bg-emerald-500 transition-all cursor-pointer disabled:opacity-50 mt-4"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Publish Course'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Draft Preview & Interactive Editor (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {draft ? (
            <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl shadow-indigo-900/10 overflow-hidden flex flex-col min-h-[600px]">
              {/* Studio Header Tabs */}
              <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-lg font-geist text-sm font-bold transition-all ${
                      activeTab === 'preview'
                        ? 'bg-[#4d44e3] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Course Outline
                  </button>
                  <button
                    onClick={() => setActiveTab('edit-quiz')}
                    className={`px-4 py-2 rounded-lg font-geist text-sm font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'edit-quiz'
                        ? 'bg-[#4d44e3] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" /> Quiz ({draft.quiz?.questions?.length || 0})
                  </button>
                </div>

                <span className="font-geist text-[11px] font-extrabold tracking-widest text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-md border border-emerald-900">
                  AI DRAFT READY
                </span>
              </div>

              {/* Tab 1: Course Markdown Preview */}
              {activeTab === 'preview' && (
                <div className="p-6 md:p-8 flex-1 space-y-8 overflow-y-auto">
                  <div>
                    <input
                      type="text"
                      value={draft.course.title}
                      onChange={(e) => handleUpdateCourseTitle(e.target.value)}
                      className="w-full font-geist text-2xl font-extrabold text-white bg-transparent border-b border-slate-800 pb-2 focus:outline-none focus:border-[#4d44e3] transition-colors"
                    />
                    <p className="font-inter text-sm text-slate-400 mt-3 leading-relaxed">
                      {draft.course.description}
                    </p>
                  </div>

                  {/* Modules List */}
                  <div className="space-y-6">
                    {draft.course.modules?.map((mod: any, mIdx: number) => (
                      <div key={mIdx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                        <h3 className="font-geist text-base font-extrabold text-white flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-[#4d44e3]" />
                          <span>Module {mIdx + 1}: {mod.title}</span>
                        </h3>

                        <div className="space-y-4 pl-7 border-l border-slate-800 ml-2.5">
                          {mod.lessons?.map((les: any, lIdx: number) => (
                            <div key={lIdx} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3 relative">
                              <div className="absolute top-1/2 -translate-y-1/2 -left-[30px] w-4 h-px bg-slate-800" />
                              <h4 className="font-geist text-sm font-bold text-slate-200">
                                Lesson {lIdx + 1}: {les.title} <span className="text-slate-500 font-medium ml-2">({les.durationMinutes}m)</span>
                              </h4>
                              <div className="font-inter text-sm text-slate-300 bg-slate-950 p-6 rounded-xl border border-slate-800 leading-relaxed space-y-4">
                                <ReactMarkdown
                                  components={{
                                    h1: ({ children }) => <h1 className="font-geist text-2xl font-extrabold text-white mb-4 mt-6">{children}</h1>,
                                    h2: ({ children }) => <h2 className="font-geist text-xl font-bold text-slate-100 mt-6 mb-3">{children}</h2>,
                                    h3: ({ children }) => <h3 className="font-geist text-lg font-bold text-slate-200 mt-4 mb-2">{children}</h3>,
                                    p: ({ children }) => <p className="mb-4 text-slate-300 text-sm leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1.5 text-slate-300 text-sm">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-slate-300 text-sm">{children}</ol>,
                                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-[#4d44e3] pl-4 py-2 my-4 bg-indigo-950/30 text-indigo-200 rounded-r-xl italic text-sm font-medium">
                                        {children}
                                      </blockquote>
                                    ),
                                    code: ({ children }) => (
                                      <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs font-mono text-pink-400 border border-slate-700">
                                        {children}
                                      </code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto my-4 border border-slate-800">
                                        {children}
                                      </pre>
                                    ),
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto my-4 border border-slate-800 rounded-xl">
                                        <table className="w-full text-left border-collapse text-xs">{children}</table>
                                      </div>
                                    ),
                                    thead: ({ children }) => <thead className="bg-slate-800 text-slate-300 uppercase font-geist font-bold">{children}</thead>,
                                    th: ({ children }) => <th className="p-3 border-b border-slate-700">{children}</th>,
                                    tbody: ({ children }) => <tbody className="divide-y divide-slate-800">{children}</tbody>,
                                    tr: ({ children }) => <tr className="hover:bg-slate-800/50 transition-colors">{children}</tr>,
                                    td: ({ children }) => <td className="p-3 text-slate-300">{children}</td>,
                                  }}
                                >
                                  {les.content || ''}
                                </ReactMarkdown>
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
                <div className="p-6 md:p-8 flex-1 space-y-8 overflow-y-auto">
                  <div className="border-b border-slate-800 pb-6">
                    <h3 className="font-geist text-2xl font-extrabold text-white">
                      {draft.quiz?.title || 'Generated Assessment Quiz'}
                    </h3>
                    <p className="font-inter text-sm text-slate-400 mt-2">
                      Passing threshold: <span className="text-white font-bold">{draft.quiz?.passingScorePct || 80}%</span> • Review and edit questions before publishing.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {draft.quiz?.questions?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-5">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-geist text-sm font-bold text-[#4d44e3]">Question {qIdx + 1}</span>
                          <span className="font-geist text-[10px] font-extrabold uppercase tracking-widest bg-indigo-900/50 text-indigo-400 border border-indigo-800 px-2 py-1 rounded-md">
                            {q.questionType}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={q.questionText}
                          onChange={(e) =>
                            handleUpdateQuestion(qIdx, { ...q, questionText: e.target.value })
                          }
                          className="w-full font-geist text-base font-bold text-white bg-slate-900 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-[#4d44e3] transition-colors shadow-inner"
                        />

                        {/* Options List */}
                        <div className="space-y-3 pl-2">
                          {q.options?.map((opt: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={q.correctOptionIndex === optIdx}
                                onChange={() =>
                                  handleUpdateQuestion(qIdx, { ...q, correctOptionIndex: optIdx })
                                }
                                className="w-4 h-4 text-[#4d44e3] bg-slate-900 border-slate-700 focus:ring-[#4d44e3] focus:ring-offset-slate-900 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = e.target.value;
                                  handleUpdateQuestion(qIdx, { ...q, options: newOpts });
                                }}
                                className={`flex-1 font-inter text-sm px-4 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                                  q.correctOptionIndex === optIdx
                                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-100 font-medium'
                                    : 'bg-slate-900 border-slate-800 text-slate-300 focus:border-slate-600'
                                }`}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                          <label className="block font-geist text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Missed Question Rationale
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) =>
                              handleUpdateQuestion(qIdx, { ...q, explanation: e.target.value })
                            }
                            className="w-full font-inter text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3 focus:outline-none focus:border-slate-600 transition-colors"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 text-center min-h-[600px] flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-indigo-50 text-[#4d44e3] flex items-center justify-center border border-indigo-100 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Sparkles className="w-10 h-10 relative z-10" />
              </div>
              <div>
                <h3 className="font-geist text-2xl font-extrabold text-slate-900 mb-2">Course Studio Idle</h3>
                <p className="font-inter text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Enter your course topic on the left and click "Generate AI Syllabus" to construct a complete operational course draft in seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
