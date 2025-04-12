
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { msalConfig } from './authConfig';

// Initialize MSAL application
const msalInstance = new PublicClientApplication(msalConfig);

// Define auth context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
  error: string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  getAuthToken: async () => null,
  error: null,
});

// Auth provider props type
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      setIsAuthenticated(true);
      setUser(accounts[0]);
    }
  }, []);

  // Login function
  const login = async () => {
    try {
      const response = await msalInstance.loginPopup();
      if (response) {
        setIsAuthenticated(true);
        setUser(response.account || null);
        setError(null);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    }
  };

  // Logout function
  const logout = () => {
    msalInstance.logoutPopup().then(() => {
      setIsAuthenticated(false);
      setUser(null);
    });
  };

  // Get auth token for API calls
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length === 0) return null;

      const request = {
        scopes: ["User.Read"],
        account: accounts[0]
      };

      const response = await msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    getAuthToken,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Higher order component for protected routes
export const withAuth = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    return <Component {...props} />;
  };
};
