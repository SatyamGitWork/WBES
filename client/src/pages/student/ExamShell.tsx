import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import { useExamGuard } from '../../hooks/useExamGuard';
import { useExamSync } from '../../hooks/useExamSync';
import { seededShuffle } from '../../lib/shuffle';
import { loadExamState, saveExamState, ExamLocalState } from '../../lib/idb';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, Maximize, Send } from 'lucide-react';

export const ExamShell = () => {
  const { id: attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Static Exam Data
  const [quizData, setQuizData] = useState<any>(null);
  const [seed, setSeed] = useState<string>('');
  
  // Dynamic State
  const [state, setState] = useState<ExamLocalState | null>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);

  // Computed shuffled data
  const shuffledQuiz = useMemo(() => {
    if (!quizData || !seed) return null;
    
    // Shuffle sections
    const shuffledSections = seededShuffle(quizData.sections, seed);
    
    // Shuffle questions and options inside
    return shuffledSections.map((sec: any) => ({
      ...sec,
      questions: seededShuffle(sec.questions, seed + sec._id).map((q: any) => ({
        ...q,
        options: seededShuffle(q.options, seed + q._id)
      }))
    }));
  }, [quizData, seed]);

  // Initialization & Crash Recovery
  useEffect(() => {
    const init = async () => {
      try {
        let attemptData = location.state?.examData?.attempt;
        let qData = location.state?.examData?.quiz;

        if (!attemptData) {
          // If navigated directly, fetch (not fully implemented in backend, would need an endpoint)
          // For simplicity, redirect to lobby if direct navigation
          navigate('/student/dashboard');
          return;
        }

        setQuizData(qData);
        setSeed(attemptData.shuffleSeed);

        // Check for local recovery
        const localState = await loadExamState(attemptId!);
        
        if (localState) {
          // Use local state if it exists (crash recovery)
          setState(localState);
          toast({ title: 'Session Recovered', description: 'Restored from local backup.', variant: 'success' });
        } else {
          // Initialize fresh state based on server attempt data
          const totalTime = qData.timingMode === 'EXAM_LEVEL' 
            ? (qData.totalTimeLimitMin || qData.totalTimeMin || 60) * 60 
            : (qData.sections[0].timeLimitMin || 30) * 60;

          setState({
            attemptId: attemptId!,
            responses: attemptData.responses || [],
            currentSection: 0,
            remainingSeconds: totalTime,
            tabSwitchCount: attemptData.tabSwitches || 0,
            lastSyncedAt: new Date().toISOString()
          });
        }
        setIsLoading(false);
      } catch (err) {
        toast({ title: 'Error initializing exam', variant: 'destructive' });
      }
    };
    init();
  }, [attemptId, location.state, navigate, toast]);

  // Exam Hooks
  useExamGuard(
    !!state, 
    () => {
      if (state) {
        const newCount = state.tabSwitchCount + 1;
        setState({ ...state, tabSwitchCount: newCount });
        if (newCount >= 3) {
          handleForceSubmit('Violation limit reached');
        }
      }
    },
    3
  );

  const { clearSync } = useExamSync(attemptId || null, state, !!state);

  // Timer
  useEffect(() => {
    if (!state) return;
    
    const timer = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        const newTime = prev.remainingSeconds - 1;
        
        if (newTime <= 0) {
          clearInterval(timer);
          handleTimeUp();
          return prev; // don't update state to negative
        }
        
        return { ...prev, remainingSeconds: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state?.currentSection]); // Restart timer if section changes (for section mode)

  const handleTimeUp = () => {
    if (!quizData || !state) return;

    if (quizData.timingMode === 'SECTION_LEVEL' && state.currentSection < quizData.sections.length - 1) {
      // Move to next section
      toast({ title: 'Section Time Up', description: 'Moving to next section automatically.' });
      const nextSec = state.currentSection + 1;
      const nextTime = quizData.sections[nextSec].timeLimitMin * 60;
      
      setState({
        ...state,
        currentSection: nextSec,
        remainingSeconds: nextTime
      });
      setCurrentQIdx(0);
    } else {
      // Complete exam
      handleForceSubmit('Time is up!');
    }
  };

  const handleForceSubmit = async (reason: string) => {
    toast({ title: 'Exam Submitted', description: reason, variant: 'warning' });
    await submitExam();
  };

  const submitExam = async () => {
    if (!state) return;
    setIsSubmitting(true);
    try {
      await api.post(`/student/exam/submit/${attemptId}`, {
        responses: state.responses,
        tabSwitchCount: state.tabSwitchCount
      });
      await clearSync();
      if (document.fullscreenElement) await document.exitFullscreen().catch(()=>{});
      navigate('/student/results');
      toast({ title: 'Success', description: 'Exam submitted successfully.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Submission Failed', description: err.response?.data?.error || 'Please try again', variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  const handleOptionSelect = (qId: string, optId: string) => {
    if (!state) return;
    const newResponses = [...state.responses];
    const existingIdx = newResponses.findIndex(r => r.questionId === qId);
    
    if (existingIdx > -1) {
      newResponses[existingIdx].selectedId = optId;
    } else {
      newResponses.push({ questionId: qId, selectedId: optId, isMarked: false });
    }
    
    setState({ ...state, responses: newResponses });
  };

  const toggleMarkReview = (qId: string) => {
    if (!state) return;
    const newResponses = [...state.responses];
    const existingIdx = newResponses.findIndex(r => r.questionId === qId);
    
    if (existingIdx > -1) {
      newResponses[existingIdx].isMarked = !newResponses[existingIdx].isMarked;
    } else {
      newResponses.push({ questionId: qId, selectedId: null, isMarked: true });
    }
    
    setState({ ...state, responses: newResponses });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn("Fullscreen error", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (isLoading || !shuffledQuiz || !state) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse">Loading secure environment...</div></div>;
  }

  const activeSection = shuffledQuiz[state.currentSection];
  const activeQuestion = activeSection.questions[currentQIdx];
  const currentResponse = state.responses.find(r => r.questionId === activeQuestion._id);
  const isLastQuestion = currentQIdx === activeSection.questions.length - 1;
  const isLastSection = state.currentSection === shuffledQuiz.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-background select-none">
      {!isFullscreen && (
        <div className="bg-red-600 text-white p-2 text-center text-sm font-medium flex justify-center items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> You must be in full-screen mode to take this exam.
          <Button size="sm" variant="outline" className="text-red-600 border-white bg-white hover:bg-gray-100 h-7" onClick={enterFullscreen}>
            <Maximize className="h-3 w-3 mr-1" /> Enter Fullscreen
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg">{quizData.title}</h1>
          <p className="text-xs text-muted-foreground">{activeSection.title}</p>
        </div>

        <div className="flex items-center gap-6">
          {state.tabSwitchCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Violations: {state.tabSwitchCount}/3
            </div>
          )}
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg font-mono text-xl font-bold">
            <Clock className="h-5 w-5" />
            {formatTime(state.remainingSeconds)}
          </div>
          <Button variant="destructive" onClick={() => {
            if (window.confirm('Are you sure you want to submit the exam early?')) submitExam();
          }} disabled={isSubmitting}>
            <Send className="h-4 w-4 mr-2" /> Finish
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span>Question {currentQIdx + 1} of {activeSection.questions.length}</span>
              <Button variant="ghost" size="sm" onClick={() => toggleMarkReview(activeQuestion._id)} className={currentResponse?.isMarked ? 'text-orange-500' : ''}>
                <AlertTriangle className="h-4 w-4 mr-1" /> {currentResponse?.isMarked ? 'Unmark Review' : 'Mark for Review'}
              </Button>
            </div>

            <div className="text-2xl font-medium leading-relaxed bg-white p-6 rounded-xl border border-border shadow-sm">
              {activeQuestion.text}
            </div>

            <div className="space-y-3">
              {activeQuestion.options.map((opt: any, idx: number) => {
                const isSelected = currentResponse?.selectedId === (opt._id || opt.id);
                return (
                  <div 
                    key={opt._id || opt.id}
                    onClick={() => handleOptionSelect(activeQuestion._id, opt._id || opt.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                        isSelected ? 'bg-primary text-white border-primary' : 'border-muted-foreground text-muted-foreground'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-lg">{opt.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-8 border-t border-border">
              <Button variant="outline" size="lg" disabled={currentQIdx === 0} onClick={() => setCurrentQIdx(p => p - 1)}>
                <ChevronLeft className="h-5 w-5 mr-2" /> Previous
              </Button>
              
              {!isLastQuestion ? (
                <Button size="lg" onClick={() => setCurrentQIdx(p => p + 1)}>
                  Next <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              ) : !isLastSection ? (
                <Button size="lg" className="bg-accent" onClick={() => {
                  if (window.confirm('Moving to the next section will lock this section. Continue?')) {
                    const nextTime = quizData.timingMode === 'SECTION_LEVEL' ? quizData.sections[state.currentSection + 1].timeLimitMin * 60 : state.remainingSeconds;
                    setState({ ...state, currentSection: state.currentSection + 1, remainingSeconds: nextTime });
                    setCurrentQIdx(0);
                  }
                }}>
                  Next Section <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={() => {
                  if (window.confirm('Submit Final Exam?')) submitExam();
                }} disabled={isSubmitting}>
                  <Send className="h-5 w-5 mr-2" /> Submit Final Exam
                </Button>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Navigation */}
        <aside className="w-72 bg-white border-l border-border p-4 flex flex-col hidden lg:flex overflow-y-auto shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4">Question Palette</h3>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
            {activeSection.questions.map((q: any, idx: number) => {
              const res = state.responses.find(r => r.questionId === q._id);
              const isCurrent = idx === currentQIdx;
              
              let bgColor = 'bg-gray-100 text-gray-600 border-gray-200';
              if (res?.isMarked) bgColor = 'bg-orange-100 text-orange-700 border-orange-300';
              else if (res?.selectedId) bgColor = 'bg-green-100 text-green-700 border-green-300';
              if (isCurrent) bgColor += ' ring-2 ring-primary ring-offset-2';

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentQIdx(idx)}
                  className={`h-10 rounded-lg text-sm font-bold border transition-all ${bgColor}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-auto space-y-2 text-sm text-muted-foreground p-4 bg-secondary/30 rounded-xl">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" /> Unattempted</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-100 border border-green-300" /> Answered</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" /> Marked for Review</div>
          </div>
        </aside>
      </div>
    </div>
  );
};
