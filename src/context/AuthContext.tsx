
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

// Create the MSAL instance but don't use it until initialization is complete
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL instance
const initializeMsal = async () => {
  try {
    await msalInstance.initialize();
    console.log("MSAL initialized successfully");
    return true;
  } catch (error) {
    console.error("MSAL initialization failed:", error);
    return false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [msalInitialized, setMsalInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // First initialize MSAL
        const initialized = await initializeMsal();
        if (!initialized) {
          throw new Error("Failed to initialize MSAL");
        }
        setMsalInitialized(true);

        // Then check if user is already logged in
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
    if (!msalInitialized) {
      setError("Authentication service is not initialized yet. Please try again.");
      return;
    }

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
    if (!msalInitialized) {
      setError("Authentication service is not initialized yet.");
      return;
    }

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
