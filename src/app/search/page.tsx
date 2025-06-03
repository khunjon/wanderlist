import { Suspense } from 'react';
import SearchContent from './SearchContent';

export default function SearchPage() {
  console.log('🔍 SearchPage is loading!');
  
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 