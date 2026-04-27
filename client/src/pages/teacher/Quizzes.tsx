import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { Plus, Edit3, Trash2, Calendar, FileText, CheckCircle, Clock, BookOpen, Users } from 'lucide-react';

export const Quizzes = () => {
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['teacher-quizzes'],
    queryFn: async () => {
      const { data } = await api.get('/teacher/quizzes');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => await api.post('/teacher/quizzes', { title: 'Untitled Quiz' }),
    onSuccess: (res) => {
      toast({ title: 'Quiz created', variant: 'success' });
      navigate(`/teacher/quizzes/${res.data._id}`);
    },
    onSettled: () => setIsCreating(false)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/teacher/quizzes/${id}`),
    onSuccess: () => {
      toast({ title: 'Quiz deleted', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['teacher-quizzes'] });
    },
    onError: (err: any) => {
      toast({ title: 'Delete Failed', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PUBLISHED': return { color: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: <CheckCircle className="h-3.5 w-3.5" />, label: 'Published' };
      case 'DRAFT': return { color: 'bg-amber-50 text-amber-700 ring-amber-200', icon: <Edit3 className="h-3.5 w-3.5" />, label: 'Draft' };
      case 'ARCHIVED': return { color: 'bg-slate-100 text-slate-600 ring-slate-200', icon: <FileText className="h-3.5 w-3.5" />, label: 'Archived' };
      default: return { color: 'bg-slate-100 text-slate-600 ring-slate-200', icon: null, label: status };
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">My Quizzes</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and create your examination materials.</p>
        </div>
        <Button 
          className="rounded-xl shadow-md shadow-primary/20" 
          onClick={() => {
            setIsCreating(true);
            createMutation.mutate();
          }}
          disabled={isCreating}
        >
          <Plus className="w-4 h-4 mr-2" />
          {isCreating ? 'Creating...' : 'Create New Quiz'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse overflow-hidden">
              <div className="h-2 bg-slate-200 rounded-b-none"></div>
              <div className="p-6 space-y-4">
                <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
                <div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div>
                <div className="h-4 w-full bg-slate-50 rounded-lg"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-4 w-1/2 bg-slate-50 rounded-lg"></div>
                  <div className="h-4 w-1/3 bg-slate-50 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : quizzes?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No quizzes yet</h3>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create your first quiz to start building examination materials for your students.</p>
          <Button onClick={() => createMutation.mutate()} className="rounded-xl shadow-md shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Create Quiz
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes?.map((quiz: any) => {
            const statusConfig = getStatusConfig(quiz.status);
            return (
              <div 
                key={quiz._id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/teacher/quizzes/${quiz._id}`)}
              >
                {/* Status accent bar */}
                <div className={`h-1.5 ${
                  quiz.status === 'PUBLISHED' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                  : quiz.status === 'DRAFT' ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                  : 'bg-gradient-to-r from-slate-300 to-slate-400'
                }`} />
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 flex items-center gap-1.5 ${statusConfig.color}`}>
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                    {quiz.status === 'DRAFT' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this draft quiz?')) deleteMutation.mutate(quiz._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1 mb-1">{quiz.title}</h3>
                  {quiz.subjectId && (
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                        {quiz.subjectId.name}
                      </span>
                      {quiz.assignedClassIds?.map((c: any) => (
                        <span key={c._id} className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                          {c.name} {c.section}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                    {quiz.description || 'No description provided'}
                  </p>

                  <div className="space-y-2 text-sm pt-4 border-t border-slate-50">
                    {quiz.scheduledStartDate && (
                      <div className="flex items-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-md mb-2 w-fit">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(quiz.scheduledStartDate).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {quiz.scheduledEndDate && ` - ${new Date(quiz.scheduledEndDate).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span>Updated {new Date(quiz.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{quiz.sections?.length || 0} Sections</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 h-auto py-1 px-2 -mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/teacher/quizzes/${quiz._id}/results`);
                        }}
                      >
                        <Users className="h-4 w-4" />
                        <span>{quiz.attemptCount || 0} Attempts</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
