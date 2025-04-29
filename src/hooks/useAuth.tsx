
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getIdentityProviders, 
  updateIdentityProvider 
} from '@/utils/identityOperations';
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
        // Get identity providers
        const providers = await getIdentityProviders();
        const enabled = providers.some(provider => provider.isEnabled);
        setIsAuthEnabled(enabled);

        // If authentication is enabled, try to restore session
        if (enabled) {
          const storedUser = localStorage.getItem('chanakya_user');
          if (storedUser) {
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

  // For demo purposes, login function that simulates Microsoft authentication
  const login = async () => {
    try {
      // In a real implementation, this would redirect to Microsoft login page
      // For demo, we'll create a mock user after a brief delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: 'user@example.com',
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
      setUser(null);
      
      toast({
        title: 'Signed out successfully',
      });
      
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
