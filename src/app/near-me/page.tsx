import { MapPin, Clock } from 'lucide-react';

export default function NearMePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <MapPin className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Near Me</h1>
            <p className="text-gray-300 text-lg mb-6">
              Discover amazing places around your current location
            </p>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Coming Soon</h2>
            </div>
            <p className="text-gray-300 mb-4">
              We're working on an exciting new feature that will help you discover restaurants, cafes, attractions, and hidden gems near your current location.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>• Location-based place discovery</p>
              <p>• Personalized recommendations</p>
              <p>• Easy adding to your lists</p>
              <p>• Real-time distance and directions</p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-400">
              Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 