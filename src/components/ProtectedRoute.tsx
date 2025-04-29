
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isAuthEnabled, isLoading } = useAuth();
  const location = useLocation();

  // Show nothing during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is not enabled, allow access
  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  // If authentication is enabled but user is not authenticated, redirect to login
  if (isAuthEnabled && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
