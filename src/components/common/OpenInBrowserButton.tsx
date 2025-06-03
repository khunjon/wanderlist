'use client';

import { useState, useEffect } from 'react';
import { isInWebView, openInBrowser } from '@/utils/webview';

interface OpenInBrowserButtonProps {
  className?: string;
  text?: string;
}

export default function OpenInBrowserButton({ 
  className = '',
  text = 'Open in Browser'
}: OpenInBrowserButtonProps) {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setShowButton(isInWebView());
  }, []);

  if (!showButton) {
    return null;
  }

  return (
    <button
      onClick={() => openInBrowser()}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    >
      <svg
        className="mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      {text}
    </button>
  );
} 