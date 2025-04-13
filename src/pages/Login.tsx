
import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MicrosoftIcon } from '@/components/icons/MicrosoftIcon';

const Login = () => {
  const { isAuthenticated, login, isInitializing, error } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/microsoft-365/dashboard" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Chanakya</CardTitle>
          <CardDescription>
            Sign in with your Microsoft account to continue
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isInitializing ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <Button 
              onClick={login} 
              className="w-full flex items-center justify-center gap-2" 
              variant="outline"
            >
              <MicrosoftIcon className="h-5 w-5" />
              Sign in with Microsoft
            </Button>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="text-center text-xs text-gray-500">
          <p className="w-full">
            Protected by Microsoft Entra ID
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
