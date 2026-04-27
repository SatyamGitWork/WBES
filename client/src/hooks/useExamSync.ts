import { useEffect, useRef } from 'react';
import api from '../lib/api';
import { saveExamState, ExamLocalState, deleteExamState } from '../lib/idb';

export const useExamSync = (
  attemptId: string | null,
  state: ExamLocalState | null,
  isActive: boolean
) => {
  const stateRef = useRef(state);

  // Keep ref up to date to avoid dependency issues in interval
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync every 30 seconds
  useEffect(() => {
    if (!isActive || !attemptId) return;

    const syncInterval = setInterval(async () => {
      const currentState = stateRef.current;
      if (!currentState) return;

      try {
        // 1. Sync to server
        await api.put(`/student/exam/sync/${attemptId}`, {
          responses: currentState.responses,
          tabSwitchCount: currentState.tabSwitchCount,
          currentSection: currentState.currentSection
        });

        // 2. Save locally (IndexedDB) as fallback
        await saveExamState(currentState);

      } catch (error) {
        console.error('Background sync failed', error);
        // Even if server fails, we still try to save locally
        await saveExamState(currentState);
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [isActive, attemptId]);

  // Sync on sudden unloads
  useEffect(() => {
    if (!isActive || !attemptId) return;

    const handleUnload = () => {
      const currentState = stateRef.current;
      if (currentState) {
        // Use sendBeacon for more reliable delivery on page close
        const blob = new Blob([JSON.stringify({
          responses: currentState.responses,
          tabSwitchCount: currentState.tabSwitchCount,
          currentSection: currentState.currentSection
        })], { type: 'application/json' });
        
        navigator.sendBeacon(`/api/student/exam/sync/${attemptId}`, blob);
        
        // Save locally one last time
        saveExamState(currentState).catch(() => {});
      }
    };

    window.addEventListener('unload', handleUnload);
    return () => window.removeEventListener('unload', handleUnload);
  }, [isActive, attemptId]);

  const clearSync = async () => {
    if (attemptId) {
      await deleteExamState(attemptId);
    }
  };

  return { clearSync };
};
