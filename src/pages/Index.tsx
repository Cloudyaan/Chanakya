
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(true);
  
  useEffect(() => {
    // Add a console log to verify this component is being rendered
    console.log('Index component mounted, attempting to redirect to dashboard...');
    
    // Redirect to the Microsoft 365 dashboard
    const redirectTimer = setTimeout(() => {
      console.log('Redirecting to dashboard now...');
      navigate('/microsoft-365/dashboard', { replace: true });
    }, 500);
    
    return () => clearTimeout(redirectTimer);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 rounded-lg shadow-sm bg-white">
        <h1 className="text-2xl font-semibold mb-4">Chanakya</h1>
        <p className="text-lg mb-4">Redirecting to dashboard...</p>
        <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
};

export default Index;
