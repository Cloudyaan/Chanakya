import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';
import { getLicenseData, getTenants } from '@/utils/database';
import { License, LicenseMetric, LicenseDistribution, Tenant, TenantConfig } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import { calculateLicenseMetrics, createLicenseDistribution } from '@/utils/licenseMetricsUtils';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// Import components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import TenantInfo from '@/components/Dashboard/TenantInfo';
import LicenseChart from '@/components/Dashboard/LicenseChart';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import EmptyState from '@/components/Dashboard/EmptyState';
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
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<LicenseMetric[]>([]);
  const [licenseDistribution, setLicenseDistribution] = useState<LicenseDistribution[]>([]);
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
    const loadTenants = async () => {
      try {
        const tenants = await getTenants();
        if (tenants.length > 0) {
          const savedTenantId = localStorage.getItem('selectedTenant');
          if (savedTenantId) {
            const matchingTenant = tenants.find(t => t.id === savedTenantId);
            if (matchingTenant) {
              setTenantData(convertToTenant(matchingTenant));
            } else if (tenants[0]) {
              setTenantData(convertToTenant(tenants[0]));
            }
          } else if (tenants[0]) {
            setTenantData(convertToTenant(tenants[0]));
          }
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
      }
    };
    
    loadTenants();
  }, [selectedTenant]);

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
  
  // Fetch licenses when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      fetchLicenseData(selectedTenant);
    }
  }, [selectedTenant]);
  
  const fetchLicenseData = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      const licenseData = await getLicenseData(tenantId);
      
      if (licenseData.length > 0) {
        console.log("Received license data:", licenseData);
        setLicenses(licenseData);
        
        // Use utility functions to calculate metrics and distribution
        const newMetrics = calculateLicenseMetrics(licenseData);
        const newDistribution = createLicenseDistribution(licenseData);
        
        setMetrics(newMetrics);
        setLicenseDistribution(newDistribution);
      } else {
        // If no license data, reset to empty states
        setLicenses([]);
        setMetrics([]);
        setLicenseDistribution([]);
        
        toast({
          title: "No license data",
          description: "No license data found for this tenant",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error fetching license data:", error);
      toast({
        title: "Error loading license data",
        description: "Could not load license information",
        variant: "destructive",
      });
      
      // Reset states on error
      setLicenses([]);
      setMetrics([]);
      setLicenseDistribution([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshData = () => {
    if (selectedTenant) {
      fetchLicenseData(selectedTenant);
    }
  };

  // Combine license and updates loading states
  const isPageLoading = isLoading || messageIsLoading || windowsIsLoading;

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <DashboardHeader isLoading={isPageLoading} onRefresh={refreshData} />
        
        {isPageLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            {/* Tenant Info */}
            <div className="mb-8">
              {tenantData && <TenantInfo tenant={tenantData} />}
            </div>
            
            {/* Updates Overview Section */}
            <UpdatesOverview 
              messageCenterUpdates={messageCenterUpdates} 
              windowsUpdates={windowsUpdates}
            />
            
            {/* License Overview Section */}
            {metrics.length > 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-soft border border-border mb-8">
                <h2 className="text-xl font-semibold mb-6">License Overview</h2>
                
                {/* Metrics Cards */}
                <DashboardMetrics metrics={metrics} />
                
                {/* License Distribution Chart */}
                {licenses.length > 0 && licenseDistribution.length > 0 && (
                  <div className="mt-6">
                    <LicenseChart data={licenseDistribution} />
                  </div>
                )}
              </div>
            ) : (
              <EmptyState onRefresh={refreshData} />
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Dashboard;
