import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users2 } from 'lucide-react';
import api from '../../lib/api';
import { Input } from '../../components/ui/input';

export const TeacherStudents = () => {
  const [search, setSearch] = useState('');

  const { data: students, isLoading } = useQuery({
    queryKey: ['teacher-students', search],
    queryFn: async () => {
      const { data } = await api.get('/teacher/students', {
        params: { role: 'STUDENT', search, limit: 100 },
      });
      return data.users || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-slate-800">Students</h2>
        <p className="text-slate-500 font-medium mt-1">View students assigned to your classes.</p>
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
                <th className="px-6 py-4 font-semibold tracking-wide">Name</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Email</th>
                <th className="px-6 py-4 font-semibold tracking-wide">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : students?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Users2 className="h-10 w-10 text-slate-300" />
                      <p className="font-medium text-lg">No students found</p>
                      <p className="text-sm">Try adjusting your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                students?.map((student: any) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{student.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{student.email}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.classId ? `${student.classId.name} ${student.classId.section || ''}`.trim() : '-'}
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
