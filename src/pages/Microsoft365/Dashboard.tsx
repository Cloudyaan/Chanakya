
import React, { useState, useEffect } from 'react';
import Microsoft365 from '../Microsoft365';
import { getLicenseData } from '@/utils/database';
import { License, LicenseMetric, LicenseDistribution } from '@/utils/types';
import { tenant as mockTenant } from '@/utils/mockData';
import { useToast } from '@/hooks/use-toast';

// Import new components
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import DashboardMetrics from '@/components/Dashboard/DashboardMetrics';
import DashboardContent from '@/components/Dashboard/DashboardContent';
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
        
        // Calculate metrics based on real data
        const totalLicenses = licenseData.reduce((sum, license) => sum + license.totalCount, 0);
        const usedLicenses = licenseData.reduce((sum, license) => sum + license.usedCount, 0);
        const availableLicenses = licenseData.reduce((sum, license) => sum + license.availableCount, 0);
        const utilRate = totalLicenses > 0 ? Math.round((usedLicenses / totalLicenses) * 100) : 0;
        
        const newMetrics: LicenseMetric[] = [
          {
            name: "Total Licenses",
            value: totalLicenses,
            previousValue: totalLicenses - 10, // Simulated previous value
            change: 3,
            changeType: "increase"
          },
          {
            name: "Assigned Licenses",
            value: usedLicenses,
            previousValue: usedLicenses - 5, // Simulated previous value
            change: 2,
            changeType: "increase"
          },
          {
            name: "Available Licenses",
            value: availableLicenses,
            previousValue: availableLicenses + 5, // Simulated previous value
            change: 8,
            changeType: "decrease"
          },
          {
            name: "Utilization Rate",
            value: utilRate,
            previousValue: utilRate - 1, // Simulated previous value
            change: 1,
            changeType: "increase"
          }
        ];
        setMetrics(newMetrics);
        
        // Create license distribution data
        const colors = ["#4f46e5", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63"];
        
        // Sort licenses by used count (descending) and take top 5, plus "Others"
        const sortedLicenses = [...licenseData].sort((a, b) => b.usedCount - a.usedCount);
        const topLicenses = sortedLicenses.slice(0, 5);
        
        // Calculate "Others" category if there are more than 5 licenses
        let othersCount = 0;
        if (sortedLicenses.length > 5) {
          othersCount = sortedLicenses.slice(5).reduce((sum, license) => sum + license.usedCount, 0);
        }
        
        const newDistribution: LicenseDistribution[] = topLicenses.map((license, index) => ({
          name: license.displayName,
          count: license.usedCount,
          color: colors[index % colors.length]
        }));
        
        // Add "Others" category if applicable
        if (othersCount > 0) {
          newDistribution.push({
            name: "Others",
            count: othersCount,
            color: colors[5]
          });
        }
        
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
                <DashboardMetrics metrics={metrics} />
                <DashboardContent 
                  tenant={mockTenant} 
                  licenses={licenses} 
                  licenseDistribution={licenseDistribution} 
                />
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
