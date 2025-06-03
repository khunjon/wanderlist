'use client';

import { useState, useEffect } from 'react';
import { isInWebView, getWebViewType, openInBrowser, copyToClipboard, getWebViewInstructions } from '@/utils/webview';

interface WebViewWarningProps {
  showForAuth?: boolean;
}

export default function WebViewWarning({ showForAuth = false }: WebViewWarningProps) {
  const [isWebView, setIsWebView] = useState(false);
  const [webViewType, setWebViewType] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    const checkWebView = () => {
      const inWebView = isInWebView();
      const type = getWebViewType();
      
      setIsWebView(inWebView);
      setWebViewType(type);
      setShowWarning(inWebView && showForAuth);
    };

    checkWebView();
  }, [showForAuth]);

  const handleOpenInBrowser = () => {
    openInBrowser();
  };

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(window.location.href);
    if (success) {
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 3000);
    }
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="bg-yellow-900 border-l-4 border-yellow-600 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-300">
            {webViewType ? `Opened in ${webViewType}` : 'Opened in App Browser'}
          </h3>
          <div className="mt-2 text-sm text-yellow-200">
            <p className="mb-3">
              {getWebViewInstructions(webViewType)}
            </p>
            <p className="text-xs text-yellow-300 mb-3">
              Google blocks sign-in from app browsers for security reasons.
            </p>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleOpenInBrowser}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-900 bg-yellow-200 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
              Open in Browser
            </button>
            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center px-3 py-2 border border-yellow-400 text-sm leading-4 font-medium rounded-md text-yellow-200 bg-transparent hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
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
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {urlCopied ? 'URL Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 