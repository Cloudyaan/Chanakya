
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

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
  
  // Skip login if auth is not enabled
  if (!isAuthEnabled) {
    return null;
  }
  
  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Trigger the login process
      await login();
    } catch (error) {
      toast({
        title: 'Authentication Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
      console.error('Login error:', error);
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
        
        <Button 
          onClick={handleLogin} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </Button>
      </motion.div>
    </div>
  );
};

export default Login;
