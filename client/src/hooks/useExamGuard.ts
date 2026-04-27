import { useEffect, useCallback } from 'react';
import { useToast } from '../components/ui/use-toast';

export const useExamGuard = (
  isActive: boolean,
  onViolation: () => void,
  maxViolations: number = 3
) => {
  const { toast } = useToast();

  const handleVisibilityChange = useCallback(() => {
    if (isActive && document.visibilityState === 'hidden') {
      onViolation();
      toast({
        title: 'Warning: Tab Switch Detected',
        description: 'Leaving the exam tab is not allowed. Further violations may terminate your exam.',
        variant: 'destructive',
      });
    }
  }, [isActive, onViolation, toast]);

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (isActive) {
      e.preventDefault();
      e.returnValue = ''; // Standard way to show prompt
    }
  }, [isActive]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (isActive) {
      e.preventDefault();
    }
  }, [isActive]);

  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (isActive) {
      e.preventDefault();
    }
  }, [isActive]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isActive) {
      // Block common shortcuts like Ctrl+C, Ctrl+V, F12, PrintScreen
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('copy', handleCopyPaste);
      document.addEventListener('paste', handleCopyPaste);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('copy', handleCopyPaste);
        document.removeEventListener('paste', handleCopyPaste);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isActive, handleVisibilityChange, handleBeforeUnload, handleContextMenu, handleCopyPaste, handleKeyDown]);
};
