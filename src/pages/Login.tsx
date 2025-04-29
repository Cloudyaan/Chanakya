
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { getAuthRedirectUrl } from '@/utils/identityOperations';

const Login = () => {
  const { isAuthenticated, login, isAuthEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || '/microsoft-365/dashboard';
  
  // If authentication is not enabled, proceed to the app
  useEffect(() => {
    if (!isAuthEnabled) {
      navigate(from, { replace: true });
    }
  }, [isAuthEnabled, navigate, from]);
  
  // If already authenticated, redirect to the intended destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Check for authentication error params in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      toast({
        title: 'Authentication Error',
        description: errorDescription || 'There was an error during sign in. Please try again.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  // Skip login if auth is not enabled
  if (!isAuthEnabled) {
    return null;
  }
  
  const handleLoginClick = async () => {
    setIsLoading(true);
    try {
      await login();
      // Successful login will redirect to Microsoft
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to initiate sign in with Microsoft. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full p-8 bg-white rounded-lg shadow-md"
      >
        <div className="text-center mb-8">
          <img src="/lovable-uploads/473de01b-dccf-4cb2-8f71-6cc0290460e7.png" alt="Chanakya Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold">Welcome to Chanakya</h1>
          <p className="text-gray-600 mt-2">Please sign in to continue</p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This application uses Microsoft Entra ID for authentication. 
            Your organization's administrator must register this app's redirect URI: 
            <code className="block mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto break-all">
              {getAuthRedirectUrl()}
            </code>
          </p>
          
          <Button 
            onClick={handleLoginClick} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Redirecting...' : 'Sign in with Microsoft'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
