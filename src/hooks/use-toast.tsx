import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
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
    // For now, just use console.log and browser alert for simplicity
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    
    // Show browser notification for important messages
    if (variant === 'destructive') {
      alert(`Error: ${title}${description ? `\n${description}` : ''}`);
    } else {
      // For success messages, just log to console
      console.log(`✅ ${title}${description ? ` - ${description}` : ''}`);
    }
    
    return addToast({ title, description, variant });
  }, []);

  return {
    toast,
    toasts,
    subscribe,
    dismiss: removeToast,
  };
} 