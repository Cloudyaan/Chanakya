
import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';

const Reports = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  
  // Listen for tenant changes
  useEffect(() => {
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tenantId) {
        setSelectedTenant(customEvent.detail.tenantId);
      }
    };

    // Get initial tenant from localStorage
    const savedTenant = localStorage.getItem('selectedTenant');
    if (savedTenant) {
      setSelectedTenant(savedTenant);
    }

    // Add event listener for tenant changes
    window.addEventListener('tenantChanged', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);
  
  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-m365-gray-500">Microsoft 365 reporting and analytics</p>
        </div>
        
        <div className="p-8 text-center border border-dashed rounded-lg">
          <h2 className="text-xl text-gray-500 mb-2">Coming Soon</h2>
          <p className="text-gray-400">Reporting features will be available in a future update.</p>
        </div>
      </main>
    </Microsoft365>
  );
};

export default Reports;
