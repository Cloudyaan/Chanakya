
import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';
import { getLicenseData } from '@/utils/database';
import { License, LicenseMetric, LicenseDistribution } from '@/utils/types';
import { tenant as mockTenant } from '@/utils/mockData';
import { useToast } from '@/hooks/use-toast';
import { calculateLicenseMetrics, createLicenseDistribution } from '@/utils/licenseMetricsUtils';

// Import components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import TenantInfo from '@/components/Dashboard/TenantInfo';
import LicenseChart from '@/components/Dashboard/LicenseChart';
import LoadingIndicator from '@/components/Dashboard/LoadingIndicator';
import EmptyState from '@/components/Dashboard/EmptyState';

const Dashboard = () => {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<LicenseMetric[]>([]);
  const [licenseDistribution, setLicenseDistribution] = useState<LicenseDistribution[]>([]);
  const { toast } = useToast();

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

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <DashboardHeader isLoading={isLoading} onRefresh={refreshData} />
        
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <>
            {metrics.length > 0 ? (
              <>
                {/* Tenant Info moved to the top */}
                <div className="mb-8">
                  <TenantInfo tenant={mockTenant} />
                </div>
                
                {/* License Overview Section - Combined Container */}
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
              </>
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
