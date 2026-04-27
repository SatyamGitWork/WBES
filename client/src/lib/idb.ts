import { get, set, del, keys } from 'idb-keyval';

/**
 * IndexedDB helpers for exam state persistence.
 * Uses idb-keyval for a simple key-value interface over IndexedDB.
 *
 * Keys follow the pattern: exam_{attemptId}
 */

export interface ExamLocalState {
  attemptId: string;
  responses: Array<{
    questionId: string;
    selectedId: string | null;
    isMarked: boolean;
  }>;
  currentSection: number;
  remainingSeconds: number;
  tabSwitchCount: number;
  lastSyncedAt: string;
}

// ── Save exam state to IndexedDB ──
export const saveExamState = async (state: ExamLocalState): Promise<void> => {
  try {
    await set(`exam_${state.attemptId}`, {
      ...state,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to save exam state to IndexedDB:', error);
  }
};

// ── Load exam state from IndexedDB ──
export const loadExamState = async (attemptId: string): Promise<ExamLocalState | null> => {
  try {
    const state = await get(`exam_${attemptId}`);
    return state || null;
  } catch (error) {
    console.error('Failed to load exam state from IndexedDB:', error);
    return null;
  }
};

// ── Delete exam state from IndexedDB ──
export const deleteExamState = async (attemptId: string): Promise<void> => {
  try {
    await del(`exam_${attemptId}`);
  } catch (error) {
    console.error('Failed to delete exam state from IndexedDB:', error);
  }
};

// ── Check if exam state exists ──
export const hasExamState = async (attemptId: string): Promise<boolean> => {
  try {
    const state = await get(`exam_${attemptId}`);
    return !!state;
  } catch {
    return false;
  }
};

// ── Clean up old exam states (keeps last 10) ──
export const cleanupOldExamStates = async (): Promise<void> => {
  try {
    const allKeys = await keys();
    const examKeys = allKeys
      .filter((k) => String(k).startsWith('exam_'))
      .map(String);

    if (examKeys.length > 10) {
      const toRemove = examKeys.slice(0, examKeys.length - 10);
      for (const key of toRemove) {
        await del(key);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old exam states:', error);
  }
};
