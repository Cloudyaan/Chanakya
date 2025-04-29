
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login = () => {
  const { isAuthenticated, login, isAuthEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showMicrosoftDialog, setShowMicrosoftDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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
  
  const handleLoginClick = () => {
    setShowMicrosoftDialog(true);
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      // Pass the email to the login function to create a more personalized mock user
      await login(email);
      // Successful login will redirect through useEffect above
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to sign in with Microsoft. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowMicrosoftDialog(false);
    }
  };

  const handleDialogClose = () => {
    setShowMicrosoftDialog(false);
    setIsLoading(false);
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
          onClick={handleLoginClick} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
        </Button>
      </motion.div>

      <Dialog open={showMicrosoftDialog} onOpenChange={setShowMicrosoftDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Sign in with Microsoft</DialogTitle>
            <DialogDescription>
              Enter your Microsoft account email and password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                placeholder="your.email@company.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleMicrosoftLogin} 
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
