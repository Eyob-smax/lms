'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  MoreVertical,
  BookOpen,
  X,
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

  // Batch Cohort Form State
  const [cohortCourseId, setCohortCourseId] = useState('');
  const [cohortTargetType, setCohortTargetType] = useState<'DEPARTMENT' | 'ROLE' | 'SELECTED'>('SELECTED');
  const [cohortDepartment, setCohortDepartment] = useState('SDR');
  const [cohortRole, setCohortRole] = useState('AGENT');
  const [cohortDueDate, setCohortDueDate] = useState('');
  const [cohortIsMandatory, setCohortIsMandatory] = useState(true);
  const [cohortLoading, setCohortLoading] = useState(false);

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

    try {
      await apiClient.post('/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        department: newUserDepartment,
      });

      Swal.fire({
        title: 'Success!',
        text: `User ${newUserName} created successfully!`,
        icon: 'success',
        confirmButtonColor: '#4d44e3',
        customClass: {
          popup: 'rounded-3xl shadow-xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
      
      setNewUserName('');
      setNewUserEmail('');
      setShowInviteModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to create user. Please check the form and try again.',
        icon: 'error',
        confirmButtonColor: '#4d44e3',
        customClass: {
          popup: 'rounded-3xl shadow-xl',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you really want to ${action} ${userName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: currentStatus ? '#ef4444' : '#10b981',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `Yes, ${action} it!`,
      customClass: {
        popup: 'rounded-3xl shadow-xl border border-slate-100',
        confirmButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm',
        cancelButton: 'rounded-xl px-6 py-2.5 font-semibold text-sm'
      }
    });

    if (result.isConfirmed) {
      try {
        await apiClient.patch(`/users/${userId}/status`, {
          isActive: !currentStatus,
        });
        
        Swal.fire({
          title: 'Success!',
          text: `User status has been updated.`,
          icon: 'success',
          confirmButtonColor: '#4d44e3',
          customClass: {
            popup: 'rounded-3xl shadow-xl',
            confirmButton: 'rounded-xl px-6 py-3 font-semibold text-sm'
          }
        });
        
        fetchData();
      } catch (err) {
        console.error('Failed to toggle status:', err);
        Swal.fire({
          title: 'Error',
          text: 'Failed to update user status.',
          icon: 'error',
          confirmButtonColor: '#4d44e3',
          customClass: {
            popup: 'rounded-3xl shadow-xl',
            confirmButton: 'rounded-xl px-6 py-3 font-semibold text-sm'
          }
        });
      }
    }
  };

  const handleAssignCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortCourseId) return;

    setCohortLoading(true);

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
      
      Swal.fire({
        title: 'Success!',
        text: `Successfully assigned course to ${res.data?.assignedCount || selectedUserIds.length} members!`,
        icon: 'success',
        confirmButtonColor: '#4d44e3',
        customClass: {
          popup: 'rounded-3xl shadow-xl border border-slate-100',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
      
      setShowCohortModal(false);
      setSelectedUserIds([]);
      fetchData();
    } catch (err) {
      console.error('Batch cohort assignment error:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to assign course. Please try again.',
        icon: 'error',
        confirmButtonColor: '#4d44e3',
        customClass: {
          popup: 'rounded-3xl shadow-xl border border-slate-100',
          confirmButton: 'rounded-xl px-6 py-3 font-semibold'
        }
      });
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
      <div className="max-w-[1200px] mx-auto p-8 space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-3xl" />
          ))}
        </div>
        <div className="h-96 w-full bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-10 pb-20 relative">
      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] -z-10 opacity-60 pointer-events-none"></div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-geist text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              User Management
            </h1>
            <span className="px-3 py-1 bg-indigo-50 text-[#4d44e3] font-geist font-extrabold text-[10px] uppercase tracking-widest rounded-lg border border-indigo-100 shadow-sm">
              Admin Exclusive
            </span>
          </div>
          <p className="font-inter text-sm text-slate-500 mt-2">
            Manage organization members, assign roles, and execute batch cohort course assignments.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCohortModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl font-geist text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#4d44e3]" />
            <span>Batch Assign Cohort</span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-geist text-sm font-bold shadow-lg hover:shadow-indigo-200 hover:bg-[#3b32d1] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* 4 Bento Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Total Members */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 text-[#4d44e3] rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-emerald-700 font-geist text-[11px] font-extrabold bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              +12%
            </span>
          </div>
          <p className="text-slate-500 font-inter text-xs font-medium">Total Organization Members</p>
          <h3 className="font-geist text-3xl font-extrabold text-slate-900 mt-1">{usersList.length}</h3>
        </div>

        {/* Card 2: Active Accounts */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <span className="text-slate-500 font-geist text-[11px] font-extrabold bg-slate-50 border border-slate-100 px-3 py-1 rounded-full">
              {Math.round((activeCount / (usersList.length || 1)) * 100)}% Active
            </span>
          </div>
          <p className="text-slate-500 font-inter text-xs font-medium">Active Licenses</p>
          <h3 className="font-geist text-3xl font-extrabold text-slate-900 mt-1">{activeCount}</h3>
        </div>

        {/* Card 3: Inactive / Pending */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
              <UserX className="w-6 h-6" />
            </div>
            {pendingCount > 0 && (
              <span className="text-rose-700 font-geist text-[11px] font-extrabold bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                Review Needed
              </span>
            )}
          </div>
          <p className="text-slate-500 font-inter text-xs font-medium">Inactive Accounts</p>
          <h3 className="font-geist text-3xl font-extrabold text-slate-900 mt-1">{pendingCount}</h3>
        </div>

        {/* Card 4: Avg Progress */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <p className="text-slate-500 font-inter text-xs font-medium">Avg. Training Progress</p>
          <h3 className="font-geist text-3xl font-extrabold text-slate-900 mt-1">88%</h3>
        </div>
      </div>

      {/* Main Data Table Section */}
      <section className="bg-white border border-slate-100 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Filters Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-geist text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin / Trainer</option>
              <option value="AGENT">Frontline Agent</option>
            </select>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-geist text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
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

          <div className="font-geist text-sm font-semibold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            Showing {filteredUsers.length} members
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 font-geist text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4 w-16">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[#4d44e3] focus:ring-[#4d44e3] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">Member Details</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-inter text-sm">
              {filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isActive = u.isActive !== false;

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectUser(u.id)}
                        className="w-4 h-4 rounded border-slate-300 text-[#4d44e3] focus:ring-[#4d44e3] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4d44e3] flex items-center justify-center font-geist font-bold text-sm shrink-0 border border-indigo-100 shadow-sm">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-geist text-sm font-bold text-slate-900">{u.name}</p>
                          <p className="font-inter text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-geist font-semibold">
                      <span
                        className={`px-3 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-widest ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-50 text-[#4d44e3] border border-indigo-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Admin' : 'Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {u.department || 'General'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-geist text-[11px] font-extrabold uppercase tracking-widest ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id, isActive, u.name)}
                        className={`px-4 py-2 rounded-lg font-geist text-xs font-bold transition-all shadow-sm ${
                          isActive
                            ? 'bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-8 border border-slate-700">
          <p className="font-geist text-sm font-bold">
            <span className="text-indigo-400 font-extrabold">{selectedUserIds.length}</span> members selected
          </p>
          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setCohortTargetType('SELECTED');
                setShowCohortModal(true);
              }}
              className="flex items-center gap-2 font-geist text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" /> Batch Assign Course
            </button>
          </div>

          <button
            onClick={() => setSelectedUserIds([])}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors ml-2"
          >
            <X className="w-5 h-5 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Modal 1: Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-geist text-xl font-extrabold text-slate-900">Add New Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Work Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sarah.j@enterprise.com"
                  className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="AGENT">Frontline Agent</option>
                    <option value="ADMIN">Trainer / Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Department</label>
                  <select
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="IT">IT Support</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-geist text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-geist text-sm font-bold hover:bg-[#3b32d1] transition-colors shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-geist text-xl font-extrabold text-slate-900">Batch Cohort Assignment</h3>
              <button onClick={() => setShowCohortModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignCohort} className="space-y-6">
              <div className="space-y-1.5">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Select Course</label>
                <select
                  value={cohortCourseId}
                  onChange={(e) => setCohortCourseId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                >
                  {coursesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.category || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Assignment Target</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCohortTargetType('SELECTED')}
                    className={`py-3 px-3 rounded-xl font-geist text-sm font-bold border transition-all ${
                      cohortTargetType === 'SELECTED'
                        ? 'bg-indigo-50 text-[#4d44e3] border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Selected ({selectedUserIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCohortTargetType('DEPARTMENT')}
                    className={`py-3 px-3 rounded-xl font-geist text-sm font-bold border transition-all ${
                      cohortTargetType === 'DEPARTMENT'
                        ? 'bg-indigo-50 text-[#4d44e3] border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    By Dept
                  </button>

                  <button
                    type="button"
                    onClick={() => setCohortTargetType('ROLE')}
                    className={`py-3 px-3 rounded-xl font-geist text-sm font-bold border transition-all ${
                      cohortTargetType === 'ROLE'
                        ? 'bg-indigo-50 text-[#4d44e3] border-indigo-200 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    By Role
                  </button>
                </div>
              </div>

              {cohortTargetType === 'DEPARTMENT' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Target Department</label>
                  <select
                    value={cohortDepartment}
                    onChange={(e) => setCohortDepartment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="SDR">SDR (Sales Dev)</option>
                    <option value="Sales">Outbound Sales</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="Telemarketing">Telemarketing</option>
                  </select>
                </div>
              )}

              {cohortTargetType === 'ROLE' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Target Role</label>
                  <select
                    value={cohortRole}
                    onChange={(e) => setCohortRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-geist text-sm font-semibold text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm cursor-pointer"
                  >
                    <option value="AGENT">Frontline Agent</option>
                    <option value="ADMIN">Admin / Trainer</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-geist text-xs font-bold text-slate-700 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={cohortDueDate}
                    onChange={(e) => setCohortDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl font-inter text-sm text-slate-900 px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-center">
                  <label className="flex items-center gap-3 cursor-pointer mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <input
                      type="checkbox"
                      checked={cohortIsMandatory}
                      onChange={(e) => setCohortIsMandatory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#4d44e3] focus:ring-[#4d44e3]"
                    />
                    <span className="font-geist text-sm font-bold text-slate-900">Mark as Mandatory</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCohortModal(false)}
                  className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-geist text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cohortLoading}
                  className="px-6 py-3 bg-[#4d44e3] text-white rounded-xl font-geist text-sm font-bold hover:bg-[#3b32d1] transition-colors shadow-lg hover:shadow-indigo-200 disabled:opacity-50"
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
