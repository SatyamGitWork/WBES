import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import {
  CheckCircle2, XCircle, Clock, Trophy, Activity, Award, ChevronRight,
  BookOpen, X, MinusCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';

/* ─── Answer Review Modal ─── */
const ResultModal = ({ result, onClose }: { result: any; onClose: () => void }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['result-detail', result.attemptId],
    queryFn: async () => {
      const { data } = await api.get(`/student/exam/result/${result.attemptId}`);
      return data;
    },
    enabled: !!result.attemptId,
  });

  const correct = data?.sections?.flatMap((s: any) => s.questions).filter((q: any) => q.isCorrect).length ?? 0;
  const wrong = data?.sections?.flatMap((s: any) => s.questions).filter((q: any) => !q.isCorrect && !q.isSkipped).length ?? 0;
  const skipped = data?.sections?.flatMap((s: any) => s.questions).filter((q: any) => q.isSkipped).length ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{result.title}</h3>
            {data?.subject && (
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> {data.subject.name}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-lg h-8 w-8 flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Score summary */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-black text-slate-800">{result.score ?? 0}</span>
              <span className="text-xl font-bold text-slate-400">/ {result.totalMarks ?? '—'}</span>
              <span className="text-sm font-medium text-slate-400 ml-1">marks</span>
            </div>
            <div className="flex gap-3 text-sm font-semibold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="w-4 h-4" /> {correct} Correct
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
                <XCircle className="w-4 h-4" /> {wrong} Wrong
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                <MinusCircle className="w-4 h-4" /> {skipped} Skipped
              </span>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-100 p-4 space-y-3">
                  <div className="h-4 w-3/4 bg-slate-100 rounded" />
                  <div className="h-4 w-1/2 bg-slate-50 rounded" />
                </div>
              ))}
            </div>
          ) : (
            data?.sections?.map((section: any, si: number) => (
              <div key={si}>
                {data.sections.length > 1 && (
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{section.title}</p>
                )}
                <div className="space-y-4">
                  {section.questions.map((q: any, qi: number) => (
                    <div
                      key={q.id}
                      className={`rounded-xl border p-4 space-y-3 ${
                        q.isCorrect ? 'border-emerald-200 bg-emerald-50/40' :
                        q.isSkipped ? 'border-slate-200 bg-slate-50/40' :
                        'border-red-200 bg-red-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-bold text-slate-400 mt-0.5 flex-shrink-0">Q{qi + 1}</span>
                        <p className="text-sm font-semibold text-slate-800 flex-1">{q.text}</p>
                        {q.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                        {!q.isCorrect && !q.isSkipped && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                        {q.isSkipped && <MinusCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />}
                      </div>
                      <div className="grid gap-2 pl-6">
                        {q.options.map((opt: any) => {
                          const isSelected = opt.id === q.selectedId;
                          const isCorrect = opt.id === q.correctId;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium border ${
                                isCorrect
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                                  : isSelected && !isCorrect
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              {isCorrect ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              ) : isSelected ? (
                                <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                              ) : (
                                <span className="w-3.5 h-3.5 flex-shrink-0" />
                              )}
                              {opt.text}
                              {isSelected && !isCorrect && (
                                <span className="ml-auto text-xs font-bold text-red-400">Your answer</span>
                              )}
                              {isCorrect && isSelected && (
                                <span className="ml-auto text-xs font-bold text-emerald-600">Correct</span>
                              )}
                              {isCorrect && !isSelected && (
                                <span className="ml-auto text-xs font-bold text-emerald-600">Correct answer</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Results Page ─── */
export const StudentResults = () => {
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const { data: results, isLoading } = useQuery({
    queryKey: ['student-results'],
    queryFn: async () => {
      const { data } = await api.get('/student/exam/available');
      return data.filter((exam: any) => exam.attemptStatus === 'SUBMITTED' || exam.attemptStatus === 'FORCE_SUBMITTED');
    },
  });

  const getScoreColor = (score: number, total: number) => {
    if (!total) return 'text-slate-800';
    const pct = score / total;
    if (pct >= 0.8) return 'text-emerald-600';
    if (pct >= 0.5) return 'text-amber-600';
    return 'text-red-500';
  };

  const getBarColor = (score: number, total: number) => {
    if (!total) return 'bg-slate-300';
    const pct = score / total;
    if (pct >= 0.8) return 'bg-emerald-500';
    if (pct >= 0.5) return 'bg-amber-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800">My Results</h2>
          <p className="text-slate-500 font-medium mt-1">Review your past examination scores and performance.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
          <Activity className="h-4 w-4" />
          Live synced
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse overflow-hidden">
              <div className="h-2 bg-slate-200"></div>
              <div className="p-6 space-y-4">
                <div className="h-6 w-3/4 bg-slate-100 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-slate-50 rounded-lg"></div>
                <div className="pt-4 h-16 bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No results yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto">You haven't completed any exams yet. Head over to the Dashboard to take an exam.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results?.map((result: any) => {
            const score = result.score ?? 0;
            const total = result.totalMarks ?? 0;
            const pct = total > 0 ? Math.round((score / total) * 100) : 0;

            return (
              <button
                key={result._id}
                onClick={() => setSelectedResult(result)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group relative text-left w-full"
              >
                {/* Score-based accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${getBarColor(score, total)}`} />

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-bold text-slate-800 line-clamp-2 group-hover:text-primary transition-colors flex-1 pr-2">{result.title}</h3>
                    <Award className="h-5 w-5 text-slate-300 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </div>

                  {result.subjectId && (
                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-4">
                      <BookOpen className="w-3.5 h-3.5" />
                      {result.subjectId.name}
                    </p>
                  )}

                  {/* Score display */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-black ${getScoreColor(score, total)}`}>{score}</span>
                        <span className="text-base font-bold text-slate-400">/ {total > 0 ? total : '—'}</span>
                      </div>
                      <span className={`text-sm font-bold ${getScoreColor(score, total)}`}>{total > 0 ? `${pct}%` : ''}</span>
                    </div>
                    {/* Progress bar */}
                    {total > 0 && (
                      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getBarColor(score, total)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-5 py-3 flex items-center justify-between text-xs font-semibold border-t border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Submitted</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    View answers <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedResult && (
        <ResultModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}
    </div>
  );
};
