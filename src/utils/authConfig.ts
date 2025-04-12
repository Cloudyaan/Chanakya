
// Microsoft Entra ID Authentication Configuration

// Replace these values with your Azure AD application registration details
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_CLIENT_ID || "YOUR_CLIENT_ID",
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID || "YOUR_TENANT_ID"}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Add scopes for API access
export const loginRequest = {
  scopes: ["User.Read", "api://YOUR_API_SCOPE/user_impersonation"]
};

// Add API endpoints that need authentication
export const protectedResources = {
  apiEndpoint: {
    endpoint: `${process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api'}`,
    scopes: ["api://YOUR_API_SCOPE/user_impersonation"]
  }
};

// Authentication endpoints and URLs
export const authenticationPaths = {
  login: "/login",
  home: "/",
};
