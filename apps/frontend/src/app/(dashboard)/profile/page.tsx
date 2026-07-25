'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Edit2,
  Save,
  X,
  Sparkles,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { apiClient } from '../../../lib/api-client';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Personal Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);

  // Notification Toggles State
  const [notifyCourseAssigned, setNotifyCourseAssigned] = useState(true);
  const [notifyDueDateReminder, setNotifyDueDateReminder] = useState(true);
  const [notifyWeeklySummary, setNotifyWeeklySummary] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/users/me');
      const data = res.data;
      setUser(data);
      setEditName(data.name || '');
      setEditDepartment(data.department || 'SDR');
    } catch (err) {
      console.warn('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveProfileLoading(true);

    try {
      const res = await apiClient.patch('/users/me', {
        name: editName,
        department: editDepartment,
      });

      setUser(res.data);
      localStorage.setItem('lms_user', JSON.stringify(res.data));
      setIsEditing(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your personal details have been updated successfully!',
        confirmButtonColor: '#4d44e3',
        customClass: {
          popup: 'rounded-3xl shadow-xl border border-slate-100',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update profile. Please try again.',
        confirmButtonColor: '#ef4444',
        customClass: {
          popup: 'rounded-3xl shadow-xl border border-slate-100',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
    } finally {
      setSaveProfileLoading(false);
    }
  };

  const showChangePasswordModal = () => {
    Swal.fire({
      title: 'Change Password',
      html: `
        <div class="space-y-4 text-left mt-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Current Password</label>
            <input type="password" id="swal-current-password" class="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-3 text-sm focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all outline-none" placeholder="••••••••">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
            <input type="password" id="swal-new-password" class="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-3 text-sm focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all outline-none" placeholder="••••••••">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Confirm New Password</label>
            <input type="password" id="swal-confirm-password" class="w-full bg-slate-50 border border-slate-200 rounded-xl text-slate-900 px-4 py-3 text-sm focus:border-[#4d44e3] focus:ring-2 focus:ring-[#4d44e3]/20 transition-all outline-none" placeholder="••••••••">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Password',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4d44e3',
      cancelButtonColor: '#94a3b8',
      customClass: {
        popup: 'rounded-3xl shadow-xl border border-slate-100',
        confirmButton: 'rounded-xl px-6 py-3 font-semibold',
        cancelButton: 'rounded-xl px-6 py-3 font-semibold'
      },
      preConfirm: () => {
        const currentPassword = (document.getElementById('swal-current-password') as HTMLInputElement).value;
        const newPassword = (document.getElementById('swal-new-password') as HTMLInputElement).value;
        const confirmPassword = (document.getElementById('swal-confirm-password') as HTMLInputElement).value;

        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('All fields are required');
          return false;
        }

        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('New passwords do not match');
          return false;
        }

        if (newPassword.length < 6) {
          Swal.showValidationMessage('New password must be at least 6 characters');
          return false;
        }

        return { currentPassword, newPassword };
      },
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading()
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.post('/users/me/change-password', result.value);
          
          Swal.fire({
            icon: 'success',
            title: 'Password Changed!',
            text: 'Your password has been updated successfully.',
            confirmButtonColor: '#4d44e3',
            customClass: {
              popup: 'rounded-3xl shadow-xl border border-slate-100',
              confirmButton: 'rounded-xl px-6 py-3 font-semibold'
            }
          });
        } catch (err: any) {
          const msg = err.response?.data?.message || 'Failed to change password. Please verify your current password.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg,
            confirmButtonColor: '#ef4444',
            customClass: {
              popup: 'rounded-3xl shadow-xl border border-slate-100',
              confirmButton: 'rounded-xl px-6 py-3 font-semibold'
            }
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto p-8 space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-lg" />
        <div className="h-64 w-full bg-slate-200 rounded-3xl" />
        <div className="h-48 w-full bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto w-full space-y-10 pb-20 relative">
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-geist text-3xl font-extrabold text-slate-900 tracking-tight">
            User Profile
          </h1>
          <span className="px-3 py-1 bg-indigo-50 text-[#4d44e3] font-geist font-extrabold text-[10px] uppercase tracking-widest rounded-lg border border-indigo-100 shadow-sm">
            {user?.role || 'AGENT'}
          </span>
        </div>
        <p className="font-inter text-sm text-slate-500 mt-2">
          Manage your personal information, security credentials, and notification preferences.
        </p>
      </div>

      {/* Card 1: Personal Details */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10"></div>
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8">
          <h2 className="font-geist text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4d44e3]">
              <User className="w-5 h-5" />
            </div>
            Personal Details
          </h2>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 font-geist text-sm font-bold text-[#4d44e3] hover:text-[#3b32d1] transition-colors cursor-pointer bg-indigo-50 px-4 py-2 rounded-xl"
            >
              <Edit2 className="w-4 h-4" /> Edit Details
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 font-geist text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer bg-slate-50 px-4 py-2 rounded-xl"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>

        {/* Profile Avatar & Form */}
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          {/* Large Avatar Circle */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#4d44e3] to-indigo-400 text-white flex items-center justify-center font-geist font-extrabold text-4xl shadow-xl shadow-indigo-200 shrink-0 mx-auto sm:mx-0 border-4 border-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-4 py-3 focus:ring-2 focus:ring-[#4d44e3]/20 focus:border-[#4d44e3] transition-all outline-none shadow-sm"
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full bg-slate-50 border-none rounded-xl font-inter text-sm font-semibold text-slate-900 px-4 py-3 cursor-not-allowed shadow-inner"
                  />
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-50 border-none rounded-xl font-inter text-sm font-semibold text-slate-500 px-4 py-3 cursor-not-allowed shadow-inner"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Department
                </label>
                {isEditing ? (
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-4 py-3 focus:ring-2 focus:ring-[#4d44e3]/20 focus:border-[#4d44e3] transition-all outline-none shadow-sm cursor-pointer"
                  >
                    <option value="SDR">SDR</option>
                    <option value="Sales">Sales</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={user?.department || 'SDR'}
                    className="w-full bg-slate-50 border-none rounded-xl font-inter text-sm font-semibold text-slate-900 px-4 py-3 cursor-not-allowed shadow-inner"
                  />
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  System Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role || 'AGENT'}
                  className="w-full bg-slate-50 border-none rounded-xl font-inter text-sm font-semibold text-slate-500 px-4 py-3 cursor-not-allowed shadow-inner"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={saveProfileLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-geist text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-[#3b32d1] hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  {saveProfileLoading ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Card 2: Security & Password */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden flex flex-col sm:flex-row gap-8 items-center justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-10"></div>
        <div className="flex-1">
          <h2 className="font-geist text-xl font-bold text-slate-900 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            Security & Authentication
          </h2>
          <p className="text-slate-500 font-inter text-sm ml-13 pl-1">
            Update your password to keep your account secure. Ensure your new password is at least 6 characters long.
          </p>
        </div>
        <div>
          <button
            onClick={showChangePasswordModal}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-geist text-sm font-bold shadow-lg hover:bg-slate-800 transition-all cursor-pointer whitespace-nowrap"
          >
            <KeyRound className="w-4 h-4" /> Change Password
          </button>
        </div>
      </div>

      {/* Card 3: Notification Preferences */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-10"></div>
        <h2 className="font-geist text-xl font-bold text-slate-900 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Bell className="w-5 h-5" />
          </div>
          Notification Preferences
        </h2>

        <div className="space-y-6">
          {/* Toggle 1 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-geist font-bold text-sm text-slate-900">New Course Assigned</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive an email when a new mandatory course is assigned to you.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifyCourseAssigned}
                onChange={() => setNotifyCourseAssigned(!notifyCourseAssigned)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4d44e3]"></div>
            </label>
          </div>

          {/* Toggle 2 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-geist font-bold text-sm text-slate-900">Due Date Reminders</p>
              <p className="text-xs text-slate-500 mt-0.5">Get notified 24 hours before a mandatory course is due.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifyDueDateReminder}
                onChange={() => setNotifyDueDateReminder(!notifyDueDateReminder)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4d44e3]"></div>
            </label>
          </div>

          {/* Toggle 3 */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
            <div>
              <p className="font-geist font-bold text-sm text-slate-900">Weekly Progress Summary</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive a weekly digest of your learning progress and quiz scores.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifyWeeklySummary}
                onChange={() => setNotifyWeeklySummary(!notifyWeeklySummary)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4d44e3]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
