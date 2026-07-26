'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../../../lib/api-client';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'SYSTEM' | 'COURSE'>('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, actionUrl?: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      if (actionUrl) {
        router.push(actionUrl);
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    if (filter === 'COURSE') {
      return (
        n.link?.includes('/courses') ||
        n.link?.includes('/certificates') ||
        n.actionUrl?.includes('/courses') ||
        n.actionUrl?.includes('/certificates') ||
        n.title?.toLowerCase().includes('course') ||
        n.title?.toLowerCase().includes('certificate')
      );
    }
    if (filter === 'SYSTEM') {
      const isCourseRelated =
        n.link?.includes('/courses') ||
        n.link?.includes('/certificates') ||
        n.actionUrl?.includes('/courses') ||
        n.actionUrl?.includes('/certificates') ||
        n.title?.toLowerCase().includes('course') ||
        n.title?.toLowerCase().includes('certificate');
      return !isCourseRelated;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Bell className="w-3.5 h-3.5" /> Notification Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-geist font-bold tracking-tight">
            Activity & Updates
          </h1>
          <p className="text-sm font-inter text-slate-300 max-w-xl">
            Stay informed about your course progress, certificate approvals, and system announcements.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-inter font-medium rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              filter === 'ALL'
                ? 'bg-[#4d44e3] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${filter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {notifications.length}
            </span>
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              filter === 'UNREAD'
                ? 'bg-[#4d44e3] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${filter === 'UNREAD' ? 'bg-indigo-700 text-white' : 'bg-red-100 text-red-600'}`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('READ')}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              filter === 'READ'
                ? 'bg-[#4d44e3] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => setFilter('COURSE')}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              filter === 'COURSE'
                ? 'bg-[#4d44e3] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Course & Certs
          </button>
          <button
            onClick={() => setFilter('SYSTEM')}
            className={`px-4 py-2 rounded-xl text-sm font-inter font-medium transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              filter === 'SYSTEM'
                ? 'bg-[#4d44e3] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-inter font-medium text-slate-600">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Bell className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-geist font-bold text-slate-900 mb-1">No notifications found</h3>
          <p className="text-sm font-inter text-slate-500 max-w-sm mx-auto">
            {filter === 'ALL'
              ? 'You have no notifications at this time.'
              : `No notifications matching the "${filter.toLowerCase()}" filter.`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
          {filteredNotifications.map((n) => {
            const linkUrl = n.actionUrl || n.link;
            return (
              <div
                key={n.id}
                className={`p-5 sm:p-6 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 ${
                  !n.isRead ? 'bg-indigo-50/40 border-l-4 border-[#4d44e3]' : ''
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'SUCCESS' ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    ) : n.type === 'WARNING' ? (
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-sm">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-[#4d44e3] flex items-center justify-center font-bold shadow-sm">
                        <Info className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm sm:text-base font-geist truncate ${
                          !n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-[#4d44e3] text-[10px] font-bold rounded-full uppercase tracking-wider">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-inter text-slate-600 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-inter text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(n.createdAt).toLocaleDateString()} at{' '}
                        {new Date(n.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-inter font-medium rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Mark read
                    </button>
                  )}
                  {linkUrl && (
                    <button
                      onClick={() => handleMarkAsRead(n.id, linkUrl)}
                      className="px-3 py-1.5 bg-[#4d44e3] hover:bg-[#3b32d1] text-white text-xs font-inter font-medium rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                    >
                      View Details <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
