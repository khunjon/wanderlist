'use client';

import { useToast } from '@/hooks/use-toast';

export default function TestToastPage() {
  const { toast } = useToast();

  const showSuccessToast = () => {
    toast({
      title: "Place Added!",
      description: "Added Starbucks to My Coffee List.",
      variant: "success"
    });
  };

  const showErrorToast = () => {
    toast({
      title: "Failed to Add Place",
      description: "Network error. Please check your internet connection.",
      variant: "destructive"
    });
  };

  const showDuplicateToast = () => {
    toast({
      title: "Already Added",
      description: "Starbucks is already in My Coffee List.",
      variant: "default"
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-white mb-8">Toast Test Page</h1>
        
        <button
          onClick={showSuccessToast}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Test Success Toast
        </button>
        
        <button
          onClick={showErrorToast}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Test Error Toast
        </button>
        
        <button
          onClick={showDuplicateToast}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Test Duplicate Toast
        </button>
      </div>
    </div>
  );
} 