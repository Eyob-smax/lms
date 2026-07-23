'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Download,
  Search,
  Filter,
  CheckCircle2,
  ShieldAlert,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  X,
  Mail,
  Building2,
  Lock,
  UserCheck,
  UserX,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../../../lib/api-client';

export default function AdminUsersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Users Data
  const [usersList, setUsersList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');

  // Selection & Bulk State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCohortModal, setShowCohortModal] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Welcome123!');
  const [newUserRole, setNewUserRole] = useState('AGENT');
  const [newUserDepartment, setNewUserDepartment] = useState('SDR');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Batch Cohort Form State
  const [cohortCourseId, setCohortCourseId] = useState('');
  const [cohortTargetType, setCohortTargetType] = useState<'DEPARTMENT' | 'ROLE' | 'SELECTED'>('SELECTED');
  const [cohortDepartment, setCohortDepartment] = useState('SDR');
  const [cohortRole, setCohortRole] = useState('AGENT');
  const [cohortDueDate, setCohortDueDate] = useState('');
  const [cohortIsMandatory, setCohortIsMandatory] = useState(true);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortSuccess, setCohortSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lms_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);
          if (parsed.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
          }
        } catch {
          // ignore
        }
      }
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, catalogRes] = await Promise.all([
        apiClient.get('/users'),
        apiClient.get('/courses/catalog'),
      ]);

      const fetchedUsers = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
      const fetchedCourses = catalogRes.data?.data || catalogRes.data || [];

      setUsersList(fetchedUsers);
      setCoursesList(fetchedCourses);
      if (fetchedCourses.length > 0) {
        setCohortCourseId(fetchedCourses[0].id);
      }
    } catch (err) {
      console.warn('Failed to fetch users or courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteSuccess(null);

    try {
      await apiClient.post('/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        department: newUserDepartment,
      });

      setInviteSuccess(`User ${newUserName} created successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setShowInviteModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to create user:', err);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}/status`, {
        isActive: !currentStatus,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleAssignCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortCourseId) return;

    setCohortLoading(true);
    setCohortSuccess(null);

    try {
      const payload: any = {
        courseId: cohortCourseId,
        isMandatory: cohortIsMandatory,
        dueDate: cohortDueDate ? new Date(cohortDueDate).toISOString() : undefined,
      };

      if (cohortTargetType === 'SELECTED') {
        payload.userIds = selectedUserIds;
      } else if (cohortTargetType === 'DEPARTMENT') {
        payload.department = cohortDepartment;
      } else if (cohortTargetType === 'ROLE') {
        payload.role = cohortRole;
      }

      const res = await apiClient.post('/enrollments/assign-cohort', payload);
      setCohortSuccess(
        `Successfully assigned course to ${res.data?.assignedCount || selectedUserIds.length} members!`
      );
      setShowCohortModal(false);
      setSelectedUserIds([]);
      fetchData();
    } catch (err) {
      console.error('Batch cohort assignment error:', err);
    } finally {
      setCohortLoading(false);
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    if (selectedRole !== 'ALL' && u.role !== selectedRole) return false;
    if (selectedDepartment !== 'ALL' && u.department !== selectedDepartment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter((item) => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const activeCount = usersList.filter((u) => u.isActive !== false).length;
  const pendingCount = usersList.length - activeCount;

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto p-lg space-y-md animate-pulse">
        <div className="h-10 w-64 bg-surface-container-high rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 bg-surface-container-high rounded-xl" />
          ))}
        </div>
        <div className="h-96 w-full bg-surface-container-high rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-container-max mx-auto w-full space-y-xl pb-2xl relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg border-b border-outline-variant/40 pb-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-geist text-3xl md:text-4xl font-bold text-on-surface tracking-tight">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 bg-primary text-on-primary font-geist font-bold text-[10px] uppercase tracking-wider rounded-md">
              Admin Exclusive
            </span>
          </div>
          <p className="font-inter text-sm text-on-surface-variant mt-1">
            Manage organization members, assign roles, and execute batch cohort course assignments.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-md">
          <button
            onClick={() => setShowCohortModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl font-geist text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-all shadow-sm cursor-pointer"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span>Batch Assign Cohort</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-geist text-xs font-semibold shadow-md hover:bg-on-primary-fixed-variant transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {inviteSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{inviteSuccess}</span>
        </div>
      )}

      {cohortSuccess && (
        <div className="p-md rounded-xl bg-secondary-container text-on-secondary-container border border-secondary/20 flex items-center gap-3 text-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
          <span className="font-geist font-semibold">{cohortSuccess}</span>
        </div>
      )}

      {/* 4 Bento Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
        {/* Card 1: Total Members */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-primary-fixed text-primary rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-secondary font-geist text-[11px] font-bold bg-secondary-container/40 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-on-surface-variant font-geist text-xs font-semibold">Total Organization Members</p>
          <h3 className="font-geist text-3xl font-bold text-on-surface mt-1">{usersList.length}</h3>
        </div>

        {/* Card 2: Active Accounts */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg">
              <UserCheck className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-on-surface-variant font-geist text-[11px] font-bold bg-surface-container-high px-2 py-0.5 rounded-full">
              {Math.round((activeCount / (usersList.length || 1)) * 100)}% Active
            </span>
          </div>
          <p className="text-on-surface-variant font-geist text-xs font-semibold">Active Licenses</p>
          <h3 className="font-geist text-3xl font-bold text-on-surface mt-1">{activeCount}</h3>
        </div>

        {/* Card 3: Inactive / Pending */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-tertiary-fixed/40 text-tertiary rounded-lg">
              <UserX className="w-5 h-5" />
            </div>
            {pendingCount > 0 && (
              <span className="text-error font-geist text-[11px] font-bold bg-error-container px-2 py-0.5 rounded-full">
                Review Needed
              </span>
            )}
          </div>
          <p className="text-on-surface-variant font-geist text-xs font-semibold">Inactive Accounts</p>
          <h3 className="font-geist text-3xl font-bold text-on-surface mt-1">{pendingCount}</h3>
        </div>

        {/* Card 4: Avg Progress */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm">
          <div className="flex justify-between items-start mb-sm">
            <div className="p-2 bg-surface-container-high text-on-surface-variant rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-on-surface-variant font-geist text-xs font-semibold">Avg. Training Progress</p>
          <h3 className="font-geist text-3xl font-bold text-on-surface mt-1">88%</h3>
        </div>
      </div>

      {/* Main Data Table Section */}
      <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {/* Filters Bar */}
        <div className="p-lg border-b border-outline-variant/40 bg-surface-container-low flex flex-wrap items-center justify-between gap-md">
          <div className="flex flex-wrap items-center gap-md flex-1">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-9 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 font-geist text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin / Trainer</option>
              <option value="AGENT">Frontline Agent</option>
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 font-geist text-xs font-semibold text-on-surface focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Departments</option>
              <option value="SDR">SDR (Sales Dev)</option>
              <option value="Sales">Outbound Sales</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Telemarketing">Telemarketing</option>
              <option value="IT">IT Support</option>
              <option value="HR">HR & Management</option>
            </select>
          </div>

          <div className="font-geist text-xs font-semibold text-on-surface-variant">
            Showing {filteredUsers.length} members
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/40 font-geist text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="px-lg py-3">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-lg py-3">Member Details</th>
                <th className="px-lg py-3">Role</th>
                <th className="px-lg py-3">Department</th>
                <th className="px-lg py-3">Status</th>
                <th className="px-lg py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-inter text-xs">
              {filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isActive = u.isActive !== false;

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-surface-container-high/40 transition-colors ${
                      isSelected ? 'bg-primary-fixed/20' : ''
                    }`}
                  >
                    <td className="px-lg py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u.id)}
                        className="rounded border-outline-variant text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-lg py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-geist font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-geist text-xs font-bold text-on-surface">{u.name}</p>
                          <p className="font-inter text-[11px] text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-3.5 font-geist font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Agent'}
                      </span>
                    </td>
                    <td className="px-lg py-3.5 text-on-surface-variant font-medium">
                      {u.department || 'General'}
                    </td>
                    <td className="px-lg py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-geist text-[10px] font-bold ${
                          isActive
                            ? 'bg-secondary-container/40 text-on-secondary-container'
                            : 'bg-surface-variant text-on-surface-variant'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-secondary' : 'bg-outline'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-lg py-3.5 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, isActive)}
                        className={`px-3 py-1 rounded font-geist text-xs font-semibold transition-colors ${
                          isActive
                            ? 'bg-error-container text-on-error-container hover:bg-error/20'
                            : 'bg-secondary-container text-on-secondary-container hover:bg-secondary/20'
                        }`}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Floating Multi-Select Bulk Actions Bar (Sticky at Bottom) */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-xl py-3 rounded-2xl shadow-2xl flex items-center gap-lg z-50 animate-fadeIn border border-outline/30">
          <p className="font-geist text-xs font-bold">
            <span className="text-primary-fixed">{selectedUserIds.length}</span> members selected
          </p>
          <div className="h-5 w-[1px] bg-outline-variant/40" />

          <div className="flex items-center gap-md">
            <button
              onClick={() => {
                setCohortTargetType('SELECTED');
                setShowCohortModal(true);
              }}
              className="flex items-center gap-1.5 font-geist text-xs font-bold text-primary-fixed hover:underline cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Batch Assign Course
            </button>
          </div>

          <button
            onClick={() => setSelectedUserIds([])}
            className="p-1 hover:bg-white/10 rounded-full transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal 1: Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-md p-lg space-y-md animate-fadeIn">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-sm">
              <h3 className="font-geist text-lg font-bold text-on-surface">Add New Organization Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-outline hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-md">
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">Work Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sarah.j@enterprise.com"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-1">
                  <label className="block font-geist text-xs font-semibold text-on-surface-variant">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                  >
                    <option value="AGENT">Frontline Agent</option>
                    <option value="ADMIN">Trainer / Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-geist text-xs font-semibold text-on-surface-variant">Department</label>
                  <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="IT">IT Support</option>
                  </select>
                </div>
              </div>

              <div className="pt-sm flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-geist text-xs font-semibold hover:bg-on-primary-fixed-variant shadow-sm disabled:opacity-50"
                >
                  {inviteLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Cohort Course Assignment Modal */}
      {showCohortModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-xl w-full max-w-lg p-lg space-y-md animate-fadeIn">
            <div className="flex justify-between items-center border-b border-outline-variant/40 pb-sm">
              <h3 className="font-geist text-lg font-bold text-on-surface">Batch Cohort Course Assignment</h3>
              <button onClick={() => setShowCohortModal(false)} className="text-outline hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignCohort} className="space-y-md">
              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">Select Course to Assign</label>
                <select
                  value={cohortCourseId}
                  onChange={(e) => setCohortCourseId(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-geist text-xs font-semibold text-on-surface-variant">Assignment Target</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCohortTargetType('SELECTED')}
                    className={`py-2 px-3 rounded-lg font-geist text-xs font-bold border ${
                      cohortTargetType === 'SELECTED'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant'
                    }`}
                  >
                    Selected ({selectedUserIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCohortTargetType('DEPARTMENT')}
                    className={`py-2 px-3 rounded-lg font-geist text-xs font-bold border ${
                      cohortTargetType === 'DEPARTMENT'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant'
                    }`}
                  >
                    By Dept
                  </button>

                  <button
                    type="button"
                    onClick={() => setCohortTargetType('ROLE')}
                    className={`py-2 px-3 rounded-lg font-geist text-xs font-bold border ${
                      cohortTargetType === 'ROLE'
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant'
                    }`}
                  >
                    By Role
                  </button>
                </div>
              </div>

              {cohortTargetType === 'DEPARTMENT' && (
                <div className="space-y-1">
                  <label className="block font-geist text-xs font-semibold text-on-surface-variant">Target Department</label>
                  <select
                    value={cohortDepartment}
                    onChange={(e) => setCohortDepartment(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface px-3 py-2"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-1">
                  <label className="block font-geist text-xs font-semibold text-on-surface-variant">Due Date</label>
                  <input
                    type="date"
                    value={cohortDueDate}
                    onChange={(e) => setCohortDueDate(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg font-inter text-xs text-on-surface px-3 py-2"
                  />
                </div>

                <div className="space-y-1 flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={cohortIsMandatory}
                      onChange={(e) => setCohortIsMandatory(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="font-geist text-xs font-bold text-on-surface">Mark as Mandatory</span>
                  </label>
                </div>
              </div>

              <div className="pt-sm flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCohortModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg font-geist text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cohortLoading}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-geist text-xs font-semibold hover:bg-on-primary-fixed-variant shadow-sm disabled:opacity-50"
                >
                  {cohortLoading ? 'Assigning...' : 'Assign Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
