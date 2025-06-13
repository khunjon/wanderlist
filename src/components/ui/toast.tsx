'use client';

import { useEffect, useState } from 'react';
import { useToast, Toast } from '@/hooks/use-toast';

export function ToastContainer() {
  const { toasts, subscribe, dismiss } = useToast();
  const [displayToasts, setDisplayToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = subscribe((newToasts) => {
      setDisplayToasts(newToasts);
    });
    return unsubscribe;
  }, [subscribe]);

  if (displayToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {displayToasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg p-4 shadow-lg border transition-all duration-300 transform ${
            toast.variant === 'destructive'
              ? 'bg-red-900 border-red-600 text-red-100'
              : toast.variant === 'success'
              ? 'bg-green-900 border-green-600 text-green-100'
              : 'bg-gray-800 border-gray-600 text-gray-100'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                {toast.variant === 'success' && (
                  <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {toast.variant === 'destructive' && (
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <h4 className="text-sm font-medium">{toast.title}</h4>
              </div>
              {toast.description && (
                <p className="mt-1 text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="ml-4 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
} 