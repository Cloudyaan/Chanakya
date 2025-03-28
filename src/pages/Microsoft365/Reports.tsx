
import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';
import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Listen for tenant changes from the NavBar
  useEffect(() => {
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tenantId) {
        setSelectedTenant(customEvent.detail.tenantId);
      }
    };
    
    // Also check localStorage on mount
    const savedTenant = localStorage.getItem('selectedTenant');
    if (savedTenant) {
      setSelectedTenant(savedTenant);
    }

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
        
        {!selectedTenant ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <h2 className="text-xl text-gray-500 mb-2">No Tenant Selected</h2>
            <p className="text-gray-400">Please select a tenant from the dropdown in the navigation bar.</p>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <h2 className="text-xl text-gray-500 mb-2">Coming Soon</h2>
            <p className="text-gray-400">Reporting features will be available in a future update.</p>
          </div>
        )}
      </main>
    </Microsoft365>
  );
};

export default Reports;
