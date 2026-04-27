import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import { Trash2, Plus, Book, Users, GraduationCap } from 'lucide-react';

export const SchoolSetup = () => {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');
  
  // Class state
  const [newClassName, setNewClassName] = useState('');
  const [newClassSection, setNewClassSection] = useState('');
  
  // Subject state
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['school-classes'],
    queryFn: async () => {
      const { data } = await api.get('/admin/school/classes');
      return data;
    },
  });

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['school-subjects'],
    queryFn: async () => {
      const { data } = await api.get('/admin/school/subjects');
      return data;
    },
  });

  const createClassMutation = useMutation({
    mutationFn: async (payload: { name: string; section: string }) => {
      return await api.post('/admin/school/classes', payload);
    },
    onSuccess: () => {
      toast({ title: 'Class created', variant: 'success' });
      setNewClassName('');
      setNewClassSection('');
      queryClient.invalidateQueries({ queryKey: ['school-classes'] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create class', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/school/classes/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Class deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['school-classes'] });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  const createSubjectMutation = useMutation({
    mutationFn: async (payload: { name: string; code: string }) => {
      return await api.post('/admin/school/subjects', payload);
    },
    onSuccess: () => {
      toast({ title: 'Subject created', variant: 'success' });
      setNewSubjectName('');
      setNewSubjectCode('');
      queryClient.invalidateQueries({ queryKey: ['school-subjects'] });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to create subject', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/school/subjects/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Subject deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['school-subjects'] });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">School Setup</h2>
        <p className="text-slate-500 font-medium mt-1">Manage classes, sections, and subjects for your institution.</p>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'classes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('classes')}
        >
          <Users className="h-4 w-4" /> Classes & Sections
        </button>
        <button
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'subjects' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('subjects')}
        >
          <Book className="h-4 w-4" /> Subjects
        </button>
      </div>

      {activeTab === 'classes' && (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" /> Add New Class
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-500 mb-1.5 block">Class Name</label>
                <Input 
                  placeholder="e.g. 10, Grade 8, IX" 
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 mb-1.5 block">Section (Optional)</label>
                <Input 
                  placeholder="e.g. A, B, Science" 
                  value={newClassSection}
                  onChange={(e) => setNewClassSection(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <Button 
                className="w-full"
                disabled={!newClassName || createClassMutation.isPending}
                onClick={() => createClassMutation.mutate({ name: newClassName, section: newClassSection })}
              >
                {createClassMutation.isPending ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wide">Class Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wide">Section</th>
                    <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {classesLoading ? (
                    <tr><td colSpan={3} className="p-6 text-center text-slate-400">Loading...</td></tr>
                  ) : classes?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-slate-400">
                        <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No classes defined yet.</p>
                      </td>
                    </tr>
                  ) : (
                    classes?.map((c: any) => (
                      <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {c.section ? (
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-blue-200">
                              {c.section}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No section</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(`Delete class ${c.name} ${c.section || ''}?`)) {
                                deleteClassMutation.mutate(c._id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" /> Add New Subject
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-500 mb-1.5 block">Subject Name</label>
                <Input 
                  placeholder="e.g. Mathematics, Physics" 
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="bg-slate-50 border-slate-200"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-500 mb-1.5 block">Subject Code</label>
                <Input 
                  placeholder="e.g. MATH101, PHY01" 
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  className="bg-slate-50 border-slate-200 uppercase"
                />
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={!newSubjectName || !newSubjectCode || createSubjectMutation.isPending}
                onClick={() => createSubjectMutation.mutate({ name: newSubjectName, code: newSubjectCode })}
              >
                {createSubjectMutation.isPending ? 'Creating...' : 'Create Subject'}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wide">Subject Name</th>
                    <th className="px-6 py-4 font-semibold tracking-wide">Code</th>
                    <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subjectsLoading ? (
                    <tr><td colSpan={3} className="p-6 text-center text-slate-400">Loading...</td></tr>
                  ) : subjects?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center text-slate-400">
                        <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="font-medium">No subjects defined yet.</p>
                      </td>
                    </tr>
                  ) : (
                    subjects?.map((s: any) => (
                      <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded ring-1 ring-emerald-200 uppercase">
                            {s.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(`Delete subject ${s.name}?`)) {
                                deleteSubjectMutation.mutate(s._id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
