
import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';
import { useTenantCache } from '@/hooks/useTenantCache';
import { Tenant, TenantConfig } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Import components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import TenantInfo from '@/components/Dashboard/TenantInfo';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import UpdatesOverview from '@/components/Dashboard/UpdatesOverview';

// Helper function to convert TenantConfig to Tenant
const convertToTenant = (config: TenantConfig): Tenant => {
  return {
    id: config.id,
    tenantId: config.tenantId,
    name: config.name,
    domain: '', // Default empty values for required fields
    countryCode: 'US', // Default country code
    subscriptionStatus: 'Active', // Default status
    adminEmail: '', // Default admin email
    creationDate: config.dateAdded,
    totalUsers: 0, // Default user counts
    activeUsers: 0
  };
};

const Dashboard = () => {
  const { tenants, isLoading: tenantsLoading } = useTenantCache();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<Tenant | null>(null);
  const { toast } = useToast();

  // Get message center updates and Windows updates
  const { 
    messageCenterUpdates, 
    isLoading: messageIsLoading,
    refreshData: refreshMessageCenter
  } = useMessageCenterUpdates(selectedTenant);
  
  const { 
    windowsUpdates, 
    isLoading: windowsIsLoading,
    loadWindowsUpdates: refreshWindowsUpdates
  } = useWindowsUpdates(selectedTenant);

  // Create wrapper functions that match the expected RefreshFunction type
  const handleRefreshMessageCenter = () => {
    refreshMessageCenter();
  };
  
  const handleRefreshWindowsUpdates = () => {
    if (selectedTenant) {
      refreshWindowsUpdates(selectedTenant);
    }
  };
  
  // Set up auto refresh for Message Center updates (every 5 minutes)
  useAutoRefresh(handleRefreshMessageCenter, 5, !!selectedTenant);
  
  // Set up auto refresh for Windows updates (every 5 minutes, with 1 minute delay)
  useAutoRefresh(handleRefreshWindowsUpdates, 5, !!selectedTenant, 1);

  // Load tenants data
  useEffect(() => {
    if (!tenantsLoading && tenants.length > 0) {
      const savedTenantId = localStorage.getItem('selectedTenant');
      if (savedTenantId) {
        const matchingTenant = tenants.find(t => t.id === savedTenantId);
        if (matchingTenant) {
          setSelectedTenant(savedTenantId);
          setTenantData(convertToTenant(matchingTenant));
        } else if (tenants[0]) {
          setSelectedTenant(tenants[0].id);
          setTenantData(convertToTenant(tenants[0]));
        }
      } else if (tenants[0]) {
        setSelectedTenant(tenants[0].id);
        setTenantData(convertToTenant(tenants[0]));
      }
    }
  }, [tenants, tenantsLoading]);

  // Listen for tenant changes
  useEffect(() => {
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tenantId) {
        const newTenantId = customEvent.detail.tenantId;
        setSelectedTenant(newTenantId);
        
        const matchingTenant = tenants.find(t => t.id === newTenantId);
        if (matchingTenant) {
          setTenantData(convertToTenant(matchingTenant));
        }
      }
    };

    // Add event listener for tenant changes
    window.addEventListener('tenantChanged', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, [tenants]);

  // Combine loading states
  const isPageLoading = tenantsLoading || messageIsLoading || windowsIsLoading;

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <DashboardHeader isLoading={isPageLoading} onRefresh={handleRefreshWindowsUpdates} />
        
        {isPageLoading ? (
          <LoadingIndicator />
        ) : (
          <div className="space-y-8">
            {/* Tenant Info with actual counts */}
            <div>
              {tenantData && (
                <TenantInfo 
                  tenant={tenantData} 
                  messageCenterCount={messageCenterUpdates?.length || 0} 
                  windowsUpdatesCount={windowsUpdates?.length || 0}
                />
              )}
            </div>
            
            {/* Updates Overview Section */}
            <UpdatesOverview 
              messageCenterUpdates={messageCenterUpdates} 
              windowsUpdates={windowsUpdates}
            />
          </div>
        )}
      </main>
    </Microsoft365>
  );
};

export default Dashboard;
