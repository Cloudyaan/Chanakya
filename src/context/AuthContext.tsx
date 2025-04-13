
import React, { createContext, useContext, useState, useEffect } from 'react';
import { PublicClientApplication, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { msalConfig } from '../utils/authConfig';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => void;
  logout: () => void;
  isInitializing: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  isInitializing: true,
  error: null,
});

export const useAuth = () => useContext(AuthContext);

export const msalInstance = new PublicClientApplication(msalConfig);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check if user is already logged in
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
          setUser(accounts[0]);
          setIsAuthenticated(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize authentication');
        console.error('Authentication initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  const login = async () => {
    try {
      const response: AuthenticationResult = await msalInstance.loginPopup({
        scopes: ["User.Read", "profile", "openid", "email"],
        prompt: "select_account"
      });
      
      if (response.account) {
        setUser(response.account);
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      console.error('Login error:', err);
    }
  };

  const logout = () => {
    msalInstance.logoutPopup().then(() => {
      setUser(null);
      setIsAuthenticated(false);
    }).catch(err => {
      console.error('Logout error:', err);
    });
  };

  const contextValue: AuthContextProps = {
    isAuthenticated,
    user,
    login,
    logout,
    isInitializing,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
