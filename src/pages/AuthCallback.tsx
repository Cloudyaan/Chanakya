
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  useEffect(() => {
    // The actual processing happens in useAuth effect
    // This is just a visual indicator for the user
    const timer = setTimeout(() => {
      const urlParams = new URLSearchParams(location.search);
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error) {
        setError(errorDescription || 'Authentication error');
        toast({
          title: 'Authentication Error',
          description: errorDescription || 'There was an error during sign in. Please try again.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/login'), 3000);
      } else {
        // Redirect to dashboard
        navigate('/microsoft-365/dashboard');
      }
      
      setIsProcessing(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [location, navigate, toast]);
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Authentication Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
            <h1 className="text-xl font-semibold mt-4">Completing Sign In</h1>
            <p className="text-gray-600 mt-2">Please wait while we complete the authentication process...</p>
          </>
        ) : (
          <>
            <div className="text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Authentication Successful</h1>
            <p className="text-gray-600 mt-2">Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
