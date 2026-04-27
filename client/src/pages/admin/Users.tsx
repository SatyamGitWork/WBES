import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../components/ui/use-toast';
import { Search, Plus, Upload, UserX, UserCheck, Trash2, Users2, X, GraduationCap, BookOpen } from 'lucide-react';
import { BulkUpload } from '../../components/admin/BulkUpload';

type TabRole = 'ALL' | 'STUDENT' | 'TEACHER';

export const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabRole>('ALL');
  const [classId, setClassId] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const role = activeTab === 'ALL' ? '' : activeTab;

  const { data: classes } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      const { data } = await api.get('/admin/school/classes');
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, role, classId],
    queryFn: async () => {
      const params: any = { page, search, role };
      if (classId) params.classId = classId;
      const { data } = await api.get('/admin/users', { params });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      toast({ title: 'User deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.response?.data?.error, variant: 'destructive' })
  });

  const toggleBlacklistMutation = useMutation({
    mutationFn: async ({ id, isBlacklisted }: { id: string, isBlacklisted: boolean }) => {
      if (isBlacklisted) return await api.delete(`/admin/blacklist/${id}`);
      return await api.post(`/admin/blacklist/${id}`, { note: 'Blacklisted by Admin' });
    },
    onSuccess: () => {
      toast({ title: 'Status updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });

  const handleTabChange = (tab: TabRole) => {
    setActiveTab(tab);
    setClassId('');
    setSearch('');
    setPage(1);
  };

  const tabs: { key: TabRole; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'All Users', icon: <Users2 className="w-4 h-4" /> },
    { key: 'STUDENT', label: 'Students', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'TEACHER', label: 'Teachers', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const colSpan = activeTab === 'ALL' ? 5 : activeTab === 'STUDENT' ? 6 : 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">User Management</h2>
          <p className="text-slate-500 font-medium mt-1">Manage students and teachers across the system.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="rounded-xl border-slate-200 hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setIsAddOpen(true)} className="rounded-xl shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder={activeTab === 'STUDENT' ? 'Search by name, email, or roll number...' : 'Search by name or email...'}
            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {activeTab === 'STUDENT' && (
          <select
            title="Filter by class"
            className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-w-[160px]"
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setPage(1); }}
          >
            <option value="">All Classes</option>
            {classes?.map((c: any) => (
              <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Email</th>
                {activeTab === 'ALL' && <th className="px-6 py-4 font-semibold tracking-wide">Role</th>}
                {activeTab === 'STUDENT' && (
                  <>
                    <th className="px-6 py-4 font-semibold tracking-wide">Roll Number</th>
                    <th className="px-6 py-4 font-semibold tracking-wide">Class</th>
                  </>
                )}
                {activeTab === 'TEACHER' && <th className="px-6 py-4 font-semibold tracking-wide">Subjects</th>}
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: colSpan }).map((__, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded-lg"></div></td>
                    ))}
                  </tr>
                ))
              ) : data?.users?.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Users2 className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-lg">No users found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.users?.map((user: any) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm shadow-sm bg-gradient-to-br ${
                          user.role === 'TEACHER' ? 'from-blue-500 to-blue-700' : 'from-orange-400 to-orange-600'
                        }`}>
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-slate-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{user.email}</td>
                    {activeTab === 'ALL' && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          user.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                    )}
                    {activeTab === 'STUDENT' && (
                      <>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.rollNumber || <span className="text-slate-300">—</span>}</td>
                        <td className="px-6 py-4">
                          {user.classId ? (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                              {user.classId.name}{user.classId.section ? ` - ${user.classId.section}` : ''}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                      </>
                    )}
                    {activeTab === 'TEACHER' && (
                      <td className="px-6 py-4">
                        {user.assignedSubjectIds?.length > 0 ? (
                          <span className="text-xs text-slate-600 font-medium">{user.assignedSubjectIds.length} subject{user.assignedSubjectIds.length !== 1 ? 's' : ''}</span>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {user.isBlacklisted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 ring-1 ring-red-200 flex items-center w-fit gap-1.5">
                          <UserX className="w-3 h-3" /> Blacklisted
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center w-fit gap-1.5">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => toggleBlacklistMutation.mutate({ id: user._id, isBlacklisted: user.isBlacklisted })}
                          title={user.isBlacklisted ? 'Unblacklist' : 'Blacklist'}
                        >
                          {user.isBlacklisted ? <UserCheck className="h-4 w-4 text-emerald-600" /> : <UserX className="h-4 w-4 text-red-500" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this user?')) {
                              deleteMutation.mutate(user._id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm font-medium text-slate-500">
              Page {data.page} of {data.totalPages} &middot; {data.total} user{data.total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg">
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg">
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {isAddOpen && <AddUserModal onClose={() => setIsAddOpen(false)} onSuccess={() => {
        setIsAddOpen(false);
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      }} />}

      {isBulkOpen && (
        <BulkUpload
          onClose={() => setIsBulkOpen(false)}
          onSuccess={() => {
            setIsBulkOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
        />
      )}
    </div>
  );
};

/* ───── Add User Modal ───── */
const AddUserModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [classId, setClassId] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { data: classes } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      const { data } = await api.get('/admin/school/classes');
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['school-subjects'],
    queryFn: async () => {
      const { data } = await api.get('/admin/school/subjects');
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = { name, email, role };
      if (role === 'STUDENT') {
        payload.classId = classId || undefined;
        payload.admissionNumber = admissionNumber || undefined;
      } else if (role === 'TEACHER') {
        payload.assignedSubjectIds = assignedSubjectIds;
      }
      
      await api.post('/admin/users', payload);
      toast({ title: 'User created', description: `An email with login credentials has been sent to ${email}.`, variant: 'success' });
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Failed to create user', description: error.response?.data?.error || 'Server error', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Create New User</h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg h-8 w-8"><X className="h-4 w-4" /></Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Email Address</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Role</Label>
            <select
              title="Select role"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          {role === 'STUDENT' && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Assign Class</Label>
                <select
                  title="Select class"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="">Select a Class</option>
                  {classes?.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} {c.section || ''}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">Admission Number</Label>
                <Input value={admissionNumber} onChange={e => setAdmissionNumber(e.target.value)} placeholder="ADM-001" className="h-11 bg-slate-50 border-slate-200 rounded-xl" />
              </div>
            </>
          )}

          {role === 'TEACHER' && (
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Assign Subjects (Multi-select)</Label>
              <select
                multiple
                title="Select subjects"
                className="w-full min-h-[100px] p-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring custom-scrollbar"
                value={assignedSubjectIds}
                onChange={(e) => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) selected.push(options[i].value);
                  }
                  setAssignedSubjectIds(selected);
                }}
              >
                {subjects?.map((s: any) => (
                  <option key={s._id} value={s._id} className="p-2 hover:bg-slate-200 rounded">{s.name} ({s.code})</option>
                ))}
              </select>
              <p className="text-xs text-slate-500">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 h-11 rounded-xl shadow-md shadow-primary/20" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
