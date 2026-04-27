import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/use-toast';
import { Search, Trash2, Calendar, FileText, CheckCircle, Clock, BookOpen, Users } from 'lucide-react';

export const AdminExams = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exams', page, search, status],
    queryFn: async () => {
      const { data } = await api.get('/admin/exams', { params: { page, search, status } });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/admin/exams/${id}`),
    onSuccess: () => {
      toast({ title: 'Exam deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => {
      toast({ title: 'Delete Failed', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return { color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Published' };
      case 'DRAFT': return { color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: <FileText className="h-3.5 w-3.5" />, label: 'Draft' };
      case 'ARCHIVED': return { color: 'bg-slate-100 text-slate-600 ring-slate-200', icon: <FileText className="h-3.5 w-3.5" />, label: 'Archived' };
      default: return { color: 'bg-slate-100 text-slate-600 ring-slate-200', icon: null, label: status };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">Exam Management</h2>
        <p className="text-slate-500 font-medium mt-1">View and manage all exams created by teachers across the system.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by exam title..." 
            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide">Exam Details</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Teacher</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Classes</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Schedule</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-20 bg-slate-100 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-8 w-8 bg-slate-100 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : data?.exams?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <BookOpen className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-lg">No exams found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.exams?.map((exam: any) => {
                  const statusConfig = getStatusConfig(exam.status);
                  return (
                    <tr key={exam._id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-800 line-clamp-1">{exam.title}</p>
                          {exam.subjectId && (
                            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-1 block">
                              {exam.subjectId.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                            {exam.createdBy?.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-slate-700">{exam.createdBy?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {exam.assignedClassIds?.length > 0 ? (
                            exam.assignedClassIds.map((c: any) => (
                              <span key={c._id} className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                {c.name} {c.section}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {exam.scheduledStartDate ? (
                          <div className="text-xs text-slate-600 font-medium space-y-1">
                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(exam.scheduledStartDate).toLocaleDateString()}</div>
                            <div className="flex items-center gap-1.5 text-indigo-600"><Clock className="w-3 h-3" /> {new Date(exam.scheduledStartDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not scheduled</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 flex items-center w-fit gap-1.5 ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
                              deleteMutation.mutate(exam._id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {data?.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-sm font-medium text-slate-500">
              Page {data.page} of {data.totalPages}
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
    </div>
  );
};
