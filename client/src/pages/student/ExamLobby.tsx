import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { FileText, Play, CheckCircle2, AlertCircle, Clock, BookOpen, Calendar } from 'lucide-react';
import { hasExamState } from '../../lib/idb';
import { useToast } from '../../components/ui/use-toast';

export const ExamLobby = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['student-exams'],
    queryFn: async () => {
      const { data } = await api.get('/student/exam/available');
      
      // Check if any have local crash recovery state
      const withRecovery = await Promise.all(data.map(async (exam: any) => {
        if (exam.attemptStatus === 'IN_PROGRESS' && exam.attemptId) {
          const hasLocal = await hasExamState(exam.attemptId);
          return { ...exam, hasLocalRecovery: hasLocal };
        }
        return exam;
      }));
      
      return withRecovery;
    },
  });

  const startMutation = useMutation({
    mutationFn: async (quizId: string) => await api.post(`/student/exam/start/${quizId}`),
    onSuccess: (res) => {
      navigate(`/student/exam/${res.data.attempt._id}`, { state: { examData: res.data } });
    },
    onError: (err: any) => {
      toast({ title: 'Failed to start exam', description: err.response?.data?.error, variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">Available Exams</h2>
        <p className="text-slate-500 font-medium mt-1">Select an exam to begin your assessment. Ensure you are in a quiet environment.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse overflow-hidden">
              <div className="h-2 bg-slate-200 rounded-b-none"></div>
              <div className="p-6 space-y-4">
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
      ) : exams?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No exams available</h3>
          <p className="text-slate-500 max-w-sm mx-auto">There are currently no published exams for you to take. Please check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {exams?.map((exam: any) => (
            <div key={exam._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
              {/* Decorative accent bar */}
              <div className={`h-1.5 ${
                (exam.attemptStatus === 'SUBMITTED' || exam.attemptStatus === 'FORCE_SUBMITTED') ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                : exam.attemptStatus === 'IN_PROGRESS' ? 'bg-gradient-to-r from-orange-400 to-orange-500' 
                : exam.scheduledStartDate && new Date() < new Date(exam.scheduledStartDate) ? 'bg-gradient-to-r from-slate-300 to-slate-400'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
              }`} />
              
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">{exam.title}</h3>
                  {exam.subjectId && (
                    <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 whitespace-nowrap ml-2">
                      {exam.subjectId.name}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1 min-h-[40px]">
                  {exam.description || 'No description provided'}
                </p>

                <div className="space-y-3 text-sm pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                    <span className="text-slate-500 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" /> Timing Mode
                    </span>
                    <span className="font-bold text-slate-700 capitalize">{exam.timingMode.replace('_', ' ').toLowerCase()}</span>
                  </div>
                  
                  {exam.timingMode === 'EXAM_LEVEL' && (
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                      <span className="text-slate-500 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> Total Time
                      </span>
                      <span className="font-bold text-slate-700">{exam.totalTimeLimitMin || exam.totalTimeMin || 60} mins</span>
                    </div>
                  )}
                  
                  {(exam.attemptStatus === 'SUBMITTED' || exam.attemptStatus === 'FORCE_SUBMITTED') && (
                    <div className="mt-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex flex-col items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500" />
                      <span className="font-black text-lg tracking-tight">Completed</span>
                      <span className="text-sm font-medium opacity-80 mt-1">Final Score: {exam.score}</span>
                    </div>
                  )}
                  
                  {exam.scheduledStartDate && (
                    <div className="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 flex flex-col justify-center">
                      <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                        <Calendar className="w-4 h-4" /> Schedule
                      </div>
                      <span className="text-xs font-medium">
                        {new Date(exam.scheduledStartDate).toLocaleString()} 
                        {exam.scheduledEndDate && ` - ${new Date(exam.scheduledEndDate).toLocaleTimeString()}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                {(exam.attemptStatus === 'SUBMITTED' || exam.attemptStatus === 'FORCE_SUBMITTED') ? (
                  <Button variant="outline" className="w-full text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl h-12 font-bold" disabled>
                    Already Taken
                  </Button>
                ) : exam.scheduledStartDate && new Date() < new Date(exam.scheduledStartDate) ? (
                  <Button variant="outline" className="w-full text-slate-500 border-slate-200 bg-slate-50/50 rounded-xl h-12 font-bold" disabled>
                    <Clock className="w-4 h-4 mr-2" /> Upcoming
                  </Button>
                ) : exam.scheduledEndDate && new Date() > new Date(exam.scheduledEndDate) && exam.attemptStatus !== 'IN_PROGRESS' ? (
                  <Button variant="outline" className="w-full text-red-500 border-red-200 bg-red-50/50 rounded-xl h-12 font-bold" disabled>
                    Missed Deadline
                  </Button>
                ) : exam.attemptStatus === 'IN_PROGRESS' ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl h-12 shadow-md shadow-orange-500/20 font-bold" 
                    onClick={() => startMutation.mutate(exam._id)}
                    disabled={startMutation.isPending}
                  >
                    {exam.hasLocalRecovery ? (
                      <><AlertCircle className="w-5 h-5 mr-2" /> Recover Crash Session</>
                    ) : (
                      <><Play className="w-5 h-5 mr-2" /> Resume Exam</>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full rounded-xl h-12 shadow-md shadow-primary/20 font-bold text-[15px] hover:scale-[1.02] transition-transform" 
                    onClick={() => startMutation.mutate(exam._id)}
                    disabled={startMutation.isPending}
                  >
                    <Play className="w-5 h-5 mr-2" /> Start Exam
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
