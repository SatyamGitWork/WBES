import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../components/ui/use-toast';
import { ArrowLeft, Save, Play, Plus, GripVertical, Trash2, CheckCircle2, Circle, X, Users } from 'lucide-react';

export const QuizBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [quizData, setQuizData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', id],
    queryFn: async () => {
      const { data } = await api.get(`/teacher/quizzes/${id}`);
      return data;
    },
    enabled: !!id,
  });

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

  useEffect(() => {
    if (data) {
      // Ensure there's at least one section
      const initialData = JSON.parse(JSON.stringify(data));
      if (!initialData.sections || initialData.sections.length === 0) {
        initialData.sections = [{
          title: 'Section 1',
          order: 0,
          questions: []
        }];
      }
      setQuizData(initialData);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => await api.put(`/teacher/quizzes/${id}`, updatedData),
    onSuccess: () => {
      toast({ title: 'Saved successfully', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['quiz', id] });
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
    onSettled: () => setIsSaving(false)
  });

  if (isLoading || !quizData) return <div className="p-8 text-center animate-pulse">Loading Builder...</div>;

  const isPublished = quizData.status === 'PUBLISHED';
  const activeSection = quizData.sections[activeSectionIdx] || quizData.sections[0];

  const handleSave = () => {
    setIsSaving(true);
    updateMutation.mutate(quizData);
  };

  const handlePublish = () => {
    if (quizData.sections.some((s: any) => s.questions.length === 0)) {
      toast({ title: 'Cannot Publish', description: 'All sections must have at least one question.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    updateMutation.mutate({ ...quizData, status: 'PUBLISHED' });
  };

  const addSection = () => {
    const newSections = [...quizData.sections, { title: `Section ${quizData.sections.length + 1}`, order: quizData.sections.length, questions: [] }];
    setQuizData({ ...quizData, sections: newSections });
    setActiveSectionIdx(newSections.length - 1);
  };

  const addQuestion = () => {
    const newSections = [...quizData.sections];
    // Generate a valid 24-character hex string for Mongoose ObjectId
    const newQuestionId = Array.from({length: 24}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const optId1 = `opt_${Date.now()}_1`;
    const optId2 = `opt_${Date.now()}_2`;

    newSections[activeSectionIdx].questions.push({
      _id: newQuestionId,
      text: 'New Question',
      type: 'SINGLE',
      options: [
        { id: optId1, text: 'Option A' },
        { id: optId2, text: 'Option B' }
      ],
      correctId: optId1,
      order: newSections[activeSectionIdx].questions.length
    });
    setQuizData({ ...quizData, sections: newSections });
  };

  const updateQuestionText = (qIdx: number, text: string) => {
    const newSections = [...quizData.sections];
    newSections[activeSectionIdx].questions[qIdx].text = text;
    setQuizData({ ...quizData, sections: newSections });
  };

  const updateOptionText = (qIdx: number, oIdx: number, text: string) => {
    const newSections = [...quizData.sections];
    newSections[activeSectionIdx].questions[qIdx].options[oIdx].text = text;
    setQuizData({ ...quizData, sections: newSections });
  };

  const setCorrectOption = (qIdx: number, optId: string) => {
    const newSections = [...quizData.sections];
    newSections[activeSectionIdx].questions[qIdx].correctId = optId;
    setQuizData({ ...quizData, sections: newSections });
  };

  const addOption = (qIdx: number) => {
    const newSections = [...quizData.sections];
    newSections[activeSectionIdx].questions[qIdx].options.push({
      id: `opt_${Date.now()}`,
      text: `Option ${String.fromCharCode(65 + newSections[activeSectionIdx].questions[qIdx].options.length)}`
    });
    setQuizData({ ...quizData, sections: newSections });
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    const newSections = [...quizData.sections];
    const q = newSections[activeSectionIdx].questions[qIdx];
    if (q.options.length <= 2) {
      toast({ title: 'Minimum 2 options required', variant: 'default' });
      return;
    }
    const removedId = q.options[oIdx].id;
    q.options.splice(oIdx, 1);
    if (q.correctId === removedId) {
      q.correctId = q.options[0].id; // fallback
    }
    setQuizData({ ...quizData, sections: newSections });
  };

  return (
    <div className="h-full flex flex-col bg-background -m-6 md:-m-8">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/quizzes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold truncate max-w-xs">{quizData.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${isPublished ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
              {quizData.status}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isPublished && (
            <>
              <Button variant="outline" onClick={() => navigate(`/teacher/quizzes/${id}/results`)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
                <Users className="h-4 w-4 mr-2" />
                Results
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handlePublish} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                <Play className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </>
          )}
          {isPublished && (
            <>
              <Button variant="outline" onClick={() => navigate(`/teacher/quizzes/${id}/results`)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200 mr-2">
                <Users className="h-4 w-4 mr-2" />
                View Results
              </Button>
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Published
              </span>
            </>
          )}
        </div>
      </header>

      {/* 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Panel 1: Quiz Settings & Sections List */}
        <aside className="w-64 bg-secondary/30 border-r border-border flex flex-col overflow-y-auto hidden md:flex">
          <div className="p-4 border-b border-border space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Quiz Title</Label>
              <Input 
                value={quizData.title}
                onChange={(e) => setQuizData({...quizData, title: e.target.value})}
                disabled={isPublished}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Description</Label>
              <textarea 
                className="w-full mt-1 flex min-h-[60px] rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={quizData.description || ''}
                onChange={(e) => setQuizData({...quizData, description: e.target.value})}
                disabled={isPublished}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Subject</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                value={quizData.subjectId || ''}
                onChange={(e) => setQuizData({...quizData, subjectId: e.target.value})}
                disabled={isPublished}
              >
                <option value="">Select Subject</option>
                {subjects?.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Assign Classes</Label>
              <select
                multiple
                className="w-full mt-1 min-h-[80px] rounded-md border border-input bg-white p-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 custom-scrollbar"
                value={quizData.assignedClassIds || []}
                onChange={(e) => {
                  const options = e.target.options;
                  const selected = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) selected.push(options[i].value);
                  }
                  setQuizData({...quizData, assignedClassIds: selected});
                }}
                disabled={isPublished}
              >
                {classes?.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.name} {c.section || ''}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Scheduled Start Time</Label>
              <Input 
                type="datetime-local"
                value={quizData.scheduledStartDate ? new Date(new Date(quizData.scheduledStartDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                onChange={(e) => setQuizData({...quizData, scheduledStartDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
                disabled={isPublished}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Scheduled End Time</Label>
              <Input 
                type="datetime-local"
                value={quizData.scheduledEndDate ? new Date(new Date(quizData.scheduledEndDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''}
                onChange={(e) => setQuizData({...quizData, scheduledEndDate: e.target.value ? new Date(e.target.value).toISOString() : null})}
                disabled={isPublished}
                className="mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Global Timing Mode</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                value={quizData.timingMode}
                onChange={(e) => setQuizData({...quizData, timingMode: e.target.value})}
                disabled={isPublished}
              >
                <option value="EXAM_LEVEL">Exam Level (Total Time)</option>
                <option value="SECTION_LEVEL">Section Level (Per Section)</option>
              </select>
            </div>
            {quizData.timingMode === 'EXAM_LEVEL' && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Total Time (Minutes)</Label>
                <Input 
                  type="number" min="1"
                  value={quizData.totalTimeLimitMin || 60}
                  onChange={(e) => setQuizData({...quizData, totalTimeLimitMin: Number(e.target.value)})}
                  disabled={isPublished}
                  className="mt-1 bg-white"
                />
              </div>
            )}
          </div>

          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground">Sections</h3>
              {!isPublished && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {quizData.sections.map((sec: any, idx: number) => (
                <div 
                  key={idx}
                  onClick={() => setActiveSectionIdx(idx)}
                  className={`px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between group transition-colors ${
                    activeSectionIdx === idx 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-white hover:bg-white/60 text-foreground border border-border'
                  }`}
                >
                  <div className="truncate text-sm font-medium">
                    {sec.title || `Section ${idx + 1}`}
                    <div className={`text-[10px] ${activeSectionIdx === idx ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {sec.questions?.length || 0} Questions
                    </div>
                  </div>
                  {activeSectionIdx === idx && !isPublished && quizData.sections.length > 1 && (
                    <Trash2 
                      className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newSecs = quizData.sections.filter((_:any, i:number) => i !== idx);
                        setQuizData({...quizData, sections: newSecs});
                        setActiveSectionIdx(Math.max(0, idx - 1));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Panel 2: Questions Editor */}
        <main className="flex-1 bg-secondary/10 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-3xl mx-auto pb-32">
            <div className="mb-6 bg-white p-4 rounded-xl border border-border shadow-sm">
              <Input 
                value={activeSection.title}
                onChange={(e) => {
                  const newSections = [...quizData.sections];
                  newSections[activeSectionIdx].title = e.target.value;
                  setQuizData({...quizData, sections: newSections});
                }}
                disabled={isPublished}
                className="text-xl font-bold border-none shadow-none focus-visible:ring-0 px-0"
                placeholder="Section Title"
              />
              {quizData.timingMode === 'SECTION_LEVEL' && (
                <div className="mt-4 flex items-center gap-3">
                  <Label className="whitespace-nowrap text-muted-foreground">Section Time Limit (mins):</Label>
                  <Input 
                    type="number" min="1" className="w-24 h-8"
                    value={activeSection.timeLimitMin || 30}
                    onChange={(e) => {
                      const newSections = [...quizData.sections];
                      newSections[activeSectionIdx].timeLimitMin = Number(e.target.value);
                      setQuizData({...quizData, sections: newSections});
                    }}
                    disabled={isPublished}
                  />
                </div>
              )}
            </div>

            <div className="space-y-6">
              {activeSection.questions.map((q: any, qIdx: number) => (
                <div key={q._id || qIdx} className="bg-white rounded-xl shadow-sm border border-border p-6 transition-all hover:shadow-md">
                  <div className="flex gap-4">
                    <div className="pt-2 text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <textarea
                          value={q.text}
                          onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                          disabled={isPublished}
                          placeholder="Type your question here..."
                          className="w-full text-lg font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors resize-none overflow-hidden min-h-[40px]"
                          rows={2}
                        />
                        {!isPublished && (
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mt-2 -mr-2" onClick={() => {
                            const newSections = [...quizData.sections];
                            newSections[activeSectionIdx].questions.splice(qIdx, 1);
                            setQuizData({...quizData, sections: newSections});
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-3 mt-4">
                        {q.options.map((opt: any, oIdx: number) => {
                          const isCorrect = q.correctId === opt.id;
                          return (
                            <div key={opt.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${isCorrect ? 'border-green-300 bg-green-50' : 'border-border hover:border-gray-300'}`}>
                              <button
                                disabled={isPublished}
                                onClick={() => setCorrectOption(qIdx, opt.id)}
                                className={`flex-shrink-0 focus:outline-none ${isCorrect ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                              >
                                {isCorrect ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                              </button>
                              
                              <Input
                                value={opt.text}
                                onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                                disabled={isPublished}
                                className={`flex-1 border-none shadow-none focus-visible:ring-0 ${isCorrect ? 'bg-transparent font-medium text-green-900' : 'bg-transparent'}`}
                                placeholder={`Option ${oIdx + 1}`}
                              />
                              
                              {!isPublished && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-destructive flex-shrink-0" onClick={() => deleteOption(qIdx, oIdx)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {!isPublished && (
                        <Button variant="ghost" size="sm" onClick={() => addOption(qIdx)} className="mt-2 text-primary">
                          <Plus className="h-4 w-4 mr-2" /> Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {activeSection.questions.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground mb-4">No questions in this section yet.</p>
                  {!isPublished && (
                    <Button onClick={addQuestion} variant="outline">
                      <Plus className="h-4 w-4 mr-2" /> Add First Question
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Floating Action Bar */}
          {!isPublished && (
            <div className="fixed bottom-6 right-6 md:right-12 z-20">
              <Button size="lg" className="rounded-full shadow-xl bg-accent hover:bg-accent/90" onClick={addQuestion}>
                <Plus className="h-5 w-5 mr-2" /> Add Question
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
