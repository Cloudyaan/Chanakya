
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/utils/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const { isAuthenticated, login, error } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Show error toast if login fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Authentication Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4">
            <img src="/lovable-uploads/473de01b-dccf-4cb2-8f71-6cc0290460e7.png" alt="Crayon Logo" className="h-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Chanakya</CardTitle>
          <CardDescription>
            Sign in with your Microsoft Entra ID account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              onClick={handleLogin} 
              className="w-full bg-m365-600 hover:bg-m365-700 text-white"
            >
              Sign in with Microsoft
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-gray-500">
          <p>Secure authentication powered by Microsoft Entra ID</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
