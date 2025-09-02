import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { LoadingScreen } from './LoadingScreen';

export function AuthCallback() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash and search params
        const { hash, search } = window.location;

        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to the main app
          // The main App component will handle the session
          window.location.href = '/';
        } else {
          // No session found, redirect to welcome screen
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, []);

  if (isProcessing) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Authentication Error
            </h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors"
            >
              Return to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
