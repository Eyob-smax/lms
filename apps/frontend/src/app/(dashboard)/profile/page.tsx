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
import { apiClient } from '../../../lib/api-client';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Personal Details State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
    setProfileSuccess(null);

    try {
      const res = await apiClient.patch('/users/me', {
        name: editName,
        department: editDepartment,
      });

      setUser(res.data);
      // Update local storage user object
      localStorage.setItem('lms_user', JSON.stringify(res.data));
      setProfileSuccess('Profile details updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaveProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await apiClient.post('/users/me/change-password', {
        currentPassword,
        newPassword,
      });

      setPasswordSuccess('Your password has been changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to change password. Please verify your current password.';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto space-y-md animate-pulse p-md">
        <div className="h-10 w-48 bg-surface-container-high rounded-lg" />
        <div className="h-64 w-full bg-surface-container-high rounded-xl" />
        <div className="h-64 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto w-full space-y-xl pb-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-geist text-3xl font-bold text-on-surface tracking-tight">
            User Profile
          </h1>
          <span className="px-2.5 py-0.5 bg-primary-fixed text-on-primary-fixed font-geist font-bold text-xs rounded-full uppercase tracking-wider">
            {user?.role || 'AGENT'}
          </span>
        </div>
        <p className="font-inter text-sm text-on-surface-variant mt-1">
          Manage your personal information, security credentials, and notification preferences.
        </p>
      </div>

      {/* Profile Banners */}
      {profileSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{profileSuccess}</span>
        </div>
      )}

      {/* Card 1: Personal Details */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg md:p-xl space-y-lg">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-md">
          <h2 className="font-geist text-lg font-bold text-on-surface flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span>Personal Details</span>
          </h2>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 font-geist text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" /> Edit Details
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 font-geist text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          )}
        </div>

        {/* Profile Avatar & Form */}
        <div className="flex flex-col sm:flex-row gap-lg">
          {/* Large Avatar Circle */}
          <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-geist font-bold text-3xl shadow-md border-2 border-primary/20 shrink-0 mx-auto sm:mx-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <form onSubmit={handleSaveProfile} className="flex-1 space-y-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    value={user?.name || ''}
                    className="w-full bg-surface-container-low border-none rounded-lg font-inter text-xs font-semibold text-on-surface px-3 py-2 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Work Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-surface-container-low border-none rounded-lg font-inter text-xs font-semibold text-on-surface px-3 py-2 cursor-not-allowed"
                />
              </div>

              {/* Department */}
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Department / Team
                </label>
                {isEditing ? (
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="BDR">BDR (Business Dev)</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="IT">IT Support</option>
                    <option value="HR">HR & Management</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={user?.department || 'SDR'}
                    className="w-full bg-surface-container-low border-none rounded-lg font-inter text-xs font-semibold text-on-surface px-3 py-2 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Account Role */}
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">
                  Account Role
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.role === 'ADMIN' ? 'Trainer / Admin' : 'Frontline Agent'}
                  className="w-full bg-surface-container-low border-none rounded-lg font-inter text-xs font-semibold text-on-surface px-3 py-2 cursor-not-allowed"
                />
              </div>
            </div>

            {isEditing && (
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saveProfileLoading}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary font-geist font-semibold text-xs rounded-lg hover:bg-on-primary-fixed-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Card 2: Security & Password Update */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg md:p-xl space-y-md">
        <h2 className="font-geist text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-md">
          <Lock className="w-5 h-5 text-primary" />
          <span>Security & Authentication</span>
        </h2>
        <p className="font-inter text-xs text-on-surface-variant">
          Update your password regularly to maintain workspace security.
        </p>

        {passwordSuccess && (
          <div className="p-md rounded-lg bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-geist font-semibold">{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-md rounded-lg bg-error-container text-on-error-container border border-error/20 flex items-center gap-3 text-xs animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <span className="font-geist font-semibold">{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-md max-w-md pt-1">
          <div className="space-y-1">
            <label className="block font-geist text-xs font-semibold text-on-surface-variant">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-geist text-xs font-semibold text-on-surface-variant">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-geist text-xs font-semibold text-on-surface-variant">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary font-geist font-semibold text-xs rounded-lg hover:bg-on-primary-fixed-variant shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" /> Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Card 3: Notification Preferences */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-lg md:p-xl space-y-md">
        <h2 className="font-geist text-lg font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/30 pb-md">
          <Bell className="w-5 h-5 text-primary" />
          <span>Notification Preferences</span>
        </h2>
        <p className="font-inter text-xs text-on-surface-variant">
          Customize how and when you receive automated training notifications.
        </p>

        <div className="space-y-md pt-1">
          {/* Toggle Item 1 */}
          <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
            <div>
              <p className="font-geist text-xs font-bold text-on-surface">Course Assignments</p>
              <p className="font-inter text-xs text-on-surface-variant">
                Get notified immediately when you are enrolled in a new operational course.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyCourseAssigned}
                onChange={(e) => setNotifyCourseAssigned(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Toggle Item 2 */}
          <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
            <div>
              <p className="font-geist text-xs font-bold text-on-surface">Due Date Reminders</p>
              <p className="font-inter text-xs text-on-surface-variant">
                Receive email & portal reminders 48 hours before a mandatory course is due.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyDueDateReminder}
                onChange={(e) => setNotifyDueDateReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Toggle Item 3 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-geist text-xs font-bold text-on-surface">Weekly Progress Summary</p>
              <p className="font-inter text-xs text-on-surface-variant">
                An automated email summary of your completed training and quiz performance every Monday.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWeeklySummary}
                onChange={(e) => setNotifyWeeklySummary(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline-variant after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
