import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import { ShieldAlert, Search, UserCheck, ShieldOff, Users2 } from 'lucide-react';

export const TeacherBlacklist = () => {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', search],
    queryFn: async () => {
      const { data } = await api.get('/teacher/students', { params: { role: 'STUDENT', search, limit: 100 } });
      return data.users;
    },
  });

  const toggleBlacklistMutation = useMutation({
    mutationFn: async ({ id, isBlacklisted }: { id: string, isBlacklisted: boolean }) => {
      if (isBlacklisted) return await api.delete(`/teacher/blacklist/${id}`);
      return await api.post(`/teacher/blacklist/${id}`, { note: 'Blacklisted by Teacher' });
    },
    onSuccess: () => {
      toast({ title: 'Status updated', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">Blacklist Management</h2>
        <p className="text-slate-500 font-medium mt-1">Prevent specific students from taking exams.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search students by name or email..." 
            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide">Student</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Email</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-24 bg-slate-100 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : students?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Users2 className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-lg">No students found</p>
                      <p className="text-sm">Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students?.map((student: any) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{student.email}</td>
                    <td className="px-6 py-4">
                      {student.isBlacklisted ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 ring-1 ring-red-200 flex items-center w-fit gap-1.5">
                          <ShieldAlert className="w-3 h-3" /> Blacklisted
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 flex items-center w-fit gap-1.5">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant={student.isBlacklisted ? "outline" : "destructive"}
                        size="sm"
                        className="rounded-lg"
                        onClick={() => toggleBlacklistMutation.mutate({ id: student._id, isBlacklisted: student.isBlacklisted })}
                      >
                        {student.isBlacklisted ? (
                          <><ShieldOff className="h-4 w-4 mr-2" /> Unblacklist</>
                        ) : (
                          <><ShieldAlert className="h-4 w-4 mr-2" /> Blacklist</>
                        )}
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
  );
};
