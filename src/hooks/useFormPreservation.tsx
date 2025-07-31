import { useEffect, useRef } from 'react';
import { usePageVisibility } from './usePageVisibility';

interface UseFormPreservationOptions {
  formId: string;
  formData: any;
  enabled?: boolean;
}

export const useFormPreservation = ({ 
  formId, 
  formData, 
  enabled = true 
}: UseFormPreservationOptions) => {
  const isVisible = usePageVisibility();
  const lastSaveRef = useRef<number>(0);
  const hasUnsavedChanges = useRef(false);

  // Auto-save when tab becomes inactive
  useEffect(() => {
    if (!enabled) return;

    if (!isVisible && hasUnsavedChanges.current) {
      const now = Date.now();
      // Prevent too frequent saves
      if (now - lastSaveRef.current > 1000) {
        localStorage.setItem(`form_${formId}`, JSON.stringify({
          data: formData,
          timestamp: now
        }));
        lastSaveRef.current = now;
        console.log(`Form data auto-saved for ${formId}`);
      }
    }
  }, [isVisible, formData, formId, enabled]);

  // Track changes
  useEffect(() => {
    if (!enabled) return;
    hasUnsavedChanges.current = true;
  }, [formData, enabled]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges.current) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  const getSavedData = () => {
    if (!enabled) return null;
    
    try {
      const saved = localStorage.getItem(`form_${formId}`);
      if (saved) {
        const { data, timestamp } = JSON.parse(saved);
        // Return saved data if it's less than 1 hour old
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error retrieving saved form data:', error);
    }
    return null;
  };

  const clearSavedData = () => {
    if (!enabled) return;
    localStorage.removeItem(`form_${formId}`);
    hasUnsavedChanges.current = false;
    console.log(`Cleared saved data for form ${formId}`);
  };

  const markAsSaved = () => {
    hasUnsavedChanges.current = false;
  };

  return {
    getSavedData,
    clearSavedData,
    markAsSaved,
    hasUnsavedChanges: hasUnsavedChanges.current
  };
};