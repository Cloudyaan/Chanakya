
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getIdentityProviders } from '@/utils/identityOperations';
import { UserInfo } from '@/utils/types';

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isAuthEnabled: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthEnabled, setIsAuthEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if authentication is enabled and if there's a session
  useEffect(() => {
    const checkAuthSettings = async () => {
      try {
        console.log('Checking auth settings...');
        // Get identity providers
        const providers = await getIdentityProviders();
        console.log('Providers:', providers);
        const enabled = providers.some(provider => provider.isEnabled);
        console.log('Auth enabled:', enabled);
        setIsAuthEnabled(enabled);

        // If authentication is enabled, try to restore session
        if (enabled) {
          const storedUser = localStorage.getItem('chanakya_user');
          if (storedUser) {
            console.log('Found stored user');
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Error checking auth settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthSettings();
  }, []);

  // In this implementation, redirect user to Microsoft login
  const login = async () => {
    try {
      console.log('Starting login process...');
      
      // Get the first enabled identity provider
      const providers = await getIdentityProviders();
      const enabledProvider = providers.find(provider => provider.isEnabled);

      if (!enabledProvider) {
        throw new Error('No enabled identity provider found');
      }

      // In a real implementation, we would redirect to Microsoft login
      // For the demo, we'll create a mock user after a short delay to simulate redirection
      console.log('Would redirect to Microsoft login with these settings:', enabledProvider);
      
      // Store the current URL to return to after login
      localStorage.setItem('auth_redirect_uri', window.location.pathname);
      
      // Simulate the redirect to Microsoft login (in production, this would be a real redirect)
      toast({
        title: 'Redirecting to Microsoft login',
        description: 'In a real implementation, you would be redirected to Microsoft',
      });

      // For demo, create a mock user after a short delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: 'demo@example.com',
        displayName: 'Demo User',
        roles: ['User'],
        isActive: true
      };
      
      // Store user in local storage
      localStorage.setItem('chanakya_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      toast({
        title: 'Signed in successfully',
        description: `Welcome, ${mockUser.displayName}!`,
      });
      
      // Navigate back to the stored redirect URI
      const redirectUri = localStorage.getItem('auth_redirect_uri') || '/';
      window.location.href = redirectUri;
      
      return;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to sign in. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear user data
      localStorage.removeItem('chanakya_user');
      localStorage.removeItem('auth_redirect_uri');
      setUser(null);
      
      toast({
        title: 'Signed out successfully',
      });
      
      // In a real implementation, we might need to call a logout endpoint
      return;
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAuthEnabled,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
