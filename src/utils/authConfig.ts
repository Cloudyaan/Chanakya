
// Microsoft Entra ID authentication configuration

// Using import.meta.env for Vite compatibility
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "YOUR_CLIENT_ID", // Replace with actual client ID
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "YOUR_TENANT_ID"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};

// Scopes required for the application
export const loginRequest = {
  scopes: ["User.Read", "profile", "openid", "email"],
};

// API scopes if needed
export const apiRequest = {
  scopes: ["api://YOUR_API_CLIENT_ID/user_impersonation"],
};
