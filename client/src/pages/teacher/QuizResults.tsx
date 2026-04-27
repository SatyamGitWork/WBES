import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Users, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export const QuizResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const { data } = await api.get(`/teacher/quizzes/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const { data: results, isLoading: isLoadingResults } = useQuery({
    queryKey: ['quiz-results', id],
    queryFn: async () => {
      const { data } = await api.get(`/teacher/quizzes/${id}/results`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30s to see live attempts
  });

  if (isLoadingQuiz || isLoadingResults) {
    return <div className="p-8 text-center animate-pulse">Loading Results...</div>;
  }

  if (!quiz) {
    return <div className="p-8 text-center text-red-500">Quiz not found.</div>;
  }

  // Calculate high level stats
  const totalAttempts = results?.length || 0;
  const submittedCount = results?.filter((r: any) => r.status === 'SUBMITTED' || r.status === 'FORCE_SUBMITTED').length || 0;
  const inProgressCount = results?.filter((r: any) => r.status === 'IN_PROGRESS').length || 0;
  const averageScore = submittedCount > 0 
    ? (results!.reduce((acc: number, r: any) => acc + (r.score || 0), 0) / submittedCount).toFixed(1)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/teacher/quizzes/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">Results: {quiz.title}</h2>
          <p className="text-slate-500 font-medium mt-1">High-level leaderboard and submission tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Attempts</p>
            <p className="text-2xl font-bold text-slate-800">{totalAttempts}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-slate-800">{submittedCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">In Progress</p>
            <p className="text-2xl font-bold text-slate-800">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
            <div className="text-xl font-black text-purple-600">AVG</div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Avg Score</p>
            <p className="text-2xl font-bold text-slate-800">{averageScore}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide">Student</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Class</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-center">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-center">Score</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-center">Tab Switches</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-right">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No attempts recorded yet.
                  </td>
                </tr>
              ) : (
                results?.map((attempt: any) => (
                  <tr key={attempt._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{attempt.studentId?.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{attempt.studentId?.rollNumber || 'No Roll #'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {attempt.studentId?.classId ? (
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                          {attempt.studentId.classId.name} {attempt.studentId.classId.section}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {attempt.status === 'IN_PROGRESS' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                          In Progress
                        </span>
                      )}
                      {(attempt.status === 'SUBMITTED' || attempt.status === 'FORCE_SUBMITTED') && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          {attempt.status === 'FORCE_SUBMITTED' ? 'Auto-Submitted' : 'Submitted'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(attempt.status === 'SUBMITTED' || attempt.status === 'FORCE_SUBMITTED') ? (
                        <div className="font-bold text-lg text-slate-800">
                          {attempt.score !== null ? attempt.score : '-'}<span className="text-sm text-slate-400 font-medium">/{attempt.totalMarks || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {attempt.tabSwitchCount > 0 ? (
                        <span className="flex items-center justify-center gap-1.5 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md w-fit mx-auto border border-red-100">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {attempt.tabSwitchCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {new Date(attempt.startedAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
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
