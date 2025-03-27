
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the Microsoft 365 dashboard
    navigate('/microsoft-365/dashboard');
  }, [navigate]);
  
  return null; // No UI needed as we're redirecting
};

export default Index;
