import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Simple in-memory toast store
let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

const addToast = (toast: Omit<Toast, 'id'>) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  listeners.forEach(listener => listener(toasts));
  
  // Auto-remove toast after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
  
  return id;
};

const removeToast = (id: string) => {
  toasts = toasts.filter(toast => toast.id !== id);
  listeners.forEach(listener => listener(toasts));
};

export function useToast() {
  const [, setToasts] = useState<Toast[]>(toasts);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    // Create a visual toast notification
    const toastId = addToast({ title, description, variant });
    
    // Also show browser notification for better visibility
    if (variant === 'destructive') {
      // For errors, show both toast and console error
      console.error(`Toast Error: ${title}${description ? ` - ${description}` : ''}`);
    } else if (variant === 'success') {
      // For success, show positive console message
      console.log(`✅ ${title}${description ? ` - ${description}` : ''}`);
    } else {
      // For default, just log
      console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    }
    
    return toastId;
  }, []);

  return {
    toast,
    toasts,
    subscribe,
    dismiss: removeToast,
  };
} 