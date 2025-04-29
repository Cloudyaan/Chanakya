
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getIdentityProviders, getAuthRedirectUrl, validateProviderConfig } from '@/utils/identityOperations';
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
        
        // Check for authentication callback (after Microsoft redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        if (code && state) {
          console.log('Auth callback detected with code and state');
          // In a real app, we would exchange the code for tokens
          // For demo purposes, we'll simulate a successful login
          handleAuthenticationCallback(code, state);
        }
      } catch (error) {
        console.error('Error checking auth settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthSettings();
  }, []);
  
  // Handle the authentication callback after Microsoft redirect
  const handleAuthenticationCallback = async (code: string, state: string) => {
    try {
      // In a real implementation, we would:
      // 1. Exchange the code for tokens with the token endpoint
      // 2. Validate the tokens
      // 3. Extract user information
      
      // For demo, we'll simulate a successful login
      const mockUser: UserInfo = {
        id: crypto.randomUUID(),
        displayName: 'Chanakya User',
        email: 'user@chanakya-demo.com',
        roles: ['User'],
      };
      
      // Store the user data
      localStorage.setItem('chanakya_user', JSON.stringify(mockUser));
      setUser(mockUser);
      
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      toast({
        title: 'Signed in successfully',
        description: `Welcome, ${mockUser.displayName}!`,
      });
    } catch (error) {
      console.error('Error handling authentication callback:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to complete sign in process. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Redirect to Microsoft Entra ID login page
  const login = async () => {
    try {
      console.log('Initiating Microsoft login flow');
      
      // Get active identity provider
      const providers = await getIdentityProviders();
      const activeProvider = providers.find(p => p.isEnabled);
      
      if (!activeProvider) {
        throw new Error('No active identity provider configured');
      }
      
      // Validate the redirect URI
      if (!validateProviderConfig(activeProvider)) {
        const expectedRedirectUri = getAuthRedirectUrl();
        throw new Error(`Redirect URI mismatch. Expected: ${expectedRedirectUri}, but configured: ${activeProvider.redirectUri}`);
      }
      
      // Create the authorization URL with the proper client ID, tenant ID, and redirect URI
      const authParams = new URLSearchParams({
        client_id: activeProvider.clientId,
        response_type: 'code',
        redirect_uri: activeProvider.redirectUri,
        response_mode: 'query',
        scope: 'openid profile email',
        state: Math.random().toString(36).substring(2)
      });
      
      const authUrl = `https://login.microsoftonline.com/${activeProvider.tenantId}/oauth2/v2.0/authorize?${authParams.toString()}`;
      console.log('Redirecting to:', authUrl);
      
      // Redirect to Microsoft login
      window.location.href = authUrl;
      
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
