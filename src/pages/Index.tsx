
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Add a console log to verify this component is being rendered
    console.log('Index component mounted, redirecting to dashboard...');
    
    // Redirect to the Microsoft 365 dashboard
    navigate('/microsoft-365/dashboard', { replace: true });
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Redirecting to dashboard...</p>
    </div>
  ); // Add a simple loading indicator
};

export default Index;
