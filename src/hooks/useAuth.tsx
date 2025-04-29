
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
        // Get identity providers
        const providers = await getIdentityProviders();
        const enabled = providers.some(provider => provider.isEnabled);
        setIsAuthEnabled(enabled);
        console.log('Auth enabled:', enabled);

        // If authentication is enabled, try to restore session
        if (enabled) {
          const storedUser = localStorage.getItem('chanakya_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            console.log('User restored from session');
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

  // For this implementation, we'll simulate a Microsoft login flow
  // In a real implementation, this would redirect to Microsoft
  const login = async () => {
    try {
      console.log('Initiating Microsoft login flow');
      
      // Get active identity provider
      const providers = await getIdentityProviders();
      const activeProvider = providers.find(p => p.isEnabled);
      
      if (!activeProvider) {
        throw new Error('No active identity provider configured');
      }
      
      // In a real implementation, this would redirect to Microsoft Entra ID
      // For demo purposes, we'll create a simulated login after a brief delay
      console.log('Using identity provider:', activeProvider.name);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a simulated user based on the provider's tenant
      const mockUser = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        email: `user@${activeProvider.tenantId.split('-')[0]}.onmicrosoft.com`,
        displayName: 'Microsoft User',
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
        description: error instanceof Error ? error.message : 'Failed to sign in. Please try again.',
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
