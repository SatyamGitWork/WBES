import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { FileText, Clock, User, Tag, ChevronDown, ChevronRight } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  USER_CREATE: 'bg-blue-50 text-blue-700 ring-blue-200',
  BULK_USER_CREATE: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  USER_UPDATE: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  USER_DELETE: 'bg-red-50 text-red-700 ring-red-200',
  BLACKLIST_ADD: 'bg-red-50 text-red-700 ring-red-200',
  BLACKLIST_REMOVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  QUIZ_CREATE: 'bg-violet-50 text-violet-700 ring-violet-200',
  QUIZ_UPDATE: 'bg-violet-50 text-violet-700 ring-violet-200',
  QUIZ_DELETE: 'bg-orange-50 text-orange-700 ring-orange-200',
  EXAM_START: 'bg-amber-50 text-amber-700 ring-amber-200',
  EXAM_SUBMIT: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page, actionFilter],
    queryFn: async () => {
      const { data } = await api.get('/admin/audit-logs', { 
        params: { page, action: actionFilter || undefined } 
      });
      return data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">Audit Logs</h2>
        <p className="text-slate-500 font-medium mt-1">Track all sensitive actions across the system.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <select 
          className="h-11 px-4 w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Actions</option>
          <option value="USER_CREATE">User Created</option>
          <option value="BULK_USER_CREATE">Bulk User Created</option>
          <option value="USER_DELETE">User Deleted</option>
          <option value="BLACKLIST_ADD">Blacklisted</option>
          <option value="BLACKLIST_REMOVE">Unblacklisted</option>
          <option value="QUIZ_CREATE">Quiz Created</option>
          <option value="QUIZ_UPDATE">Quiz Updated</option>
          <option value="EXAM_START">Exam Started</option>
          <option value="EXAM_SUBMIT">Exam Submitted</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wide w-8"></th>
                <th className="px-6 py-4 font-semibold tracking-wide">Timestamp</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Actor</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Action</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-100 rounded"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-36 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-slate-100 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : data?.logs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-lg">No audit logs found</p>
                      <p className="text-sm">There are no logs matching the selected filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.logs?.map((log: any) => {
                  const isExpanded = expandedId === log._id;
                  const actionColor = ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-700 ring-slate-200';
                  return (
                    <>
                      <tr 
                        key={log._id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => setExpandedId(isExpanded ? null : log._id)}
                      >
                        <td className="px-6 py-4">
                          {isExpanded 
                            ? <ChevronDown className="h-4 w-4 text-slate-400" /> 
                            : <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-slate-500 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 text-sm">{log.actorId?.name || 'System'}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{log.actorId?.role || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ring-1 ${actionColor}`}>
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-[200px]">
                          {log.target || '—'}
                        </td>
                      </tr>
                      {isExpanded && log.meta && (
                        <tr key={`${log._id}_meta`}>
                          <td colSpan={5} className="px-12 py-4 bg-slate-50/50 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                              <Tag className="h-3 w-3" /> Metadata
                            </p>
                            <pre className="text-xs text-slate-600 bg-white p-4 rounded-xl border border-slate-100 overflow-x-auto font-mono leading-relaxed">
                              {JSON.stringify(log.meta, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
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
