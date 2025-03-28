
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import MetricsCard from '@/components/Dashboard/MetricsCard';
import TenantInfo from '@/components/Dashboard/TenantInfo';
import LicenseChart from '@/components/Dashboard/LicenseChart';
import LicenseOverview from '@/components/Dashboard/LicenseOverview';
import { getTenants, getLicenseData } from '@/utils/database';
import { TenantConfig, License, LicenseMetric, LicenseDistribution } from '@/utils/types';
import { tenant as mockTenant } from '@/utils/mockData';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const Dashboard = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<LicenseMetric[]>([]);
  const [licenseDistribution, setLicenseDistribution] = useState<LicenseDistribution[]>([]);
  const { toast } = useToast();

  // Fetch tenants on mount
  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        // Select the first active tenant by default
        const activeTenant = loadedTenants.find(t => t.isActive);
        if (activeTenant) {
          setSelectedTenant(activeTenant.id);
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
        toast({
          title: "Error loading tenants",
          description: "Could not load tenant information",
          variant: "destructive",
        });
      }
    }
    
    loadTenants();
  }, [toast]);
  
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

  // Filter active tenants for dropdown
  const activeTenants = tenants.filter(t => t.isActive);

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">License Dashboard</h1>
            <p className="text-m365-gray-500">Monitor and manage your Microsoft 365 licenses</p>
          </div>
          
          <div className="flex items-center gap-3 mt-2 sm:mt-0">
            {activeTenants.length > 1 && (
              <Select 
                value={selectedTenant || ''} 
                onValueChange={setSelectedTenant}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Tenant" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <button 
              onClick={refreshData}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1.5 border border-border rounded-md text-sm font-medium bg-background hover:bg-muted transition-colors"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin mr-2" : "mr-2"} />
              Refresh
            </button>
          </div>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw size={40} className="animate-spin text-m365-600" />
          </div>
        ) : (
          <>
            {metrics.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {metrics.map((metric, index) => (
                    <MetricsCard 
                      key={metric.name} 
                      metric={metric} 
                      className={`animation-delay-${index * 100}`}
                    />
                  ))}
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  <TenantInfo tenant={mockTenant} className="lg:col-span-1" />
                  {licenseDistribution.length > 0 && (
                    <LicenseChart data={licenseDistribution} className="lg:col-span-2" />
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {licenses.length > 0 && (
                    <LicenseOverview licenses={licenses} className="lg:col-span-3" />
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-lg">
                <h2 className="text-xl text-gray-500 mb-2">No License Data Available</h2>
                <p className="text-gray-400 mb-4">Run the <code>fetch_licenses.py</code> script to retrieve license data from Microsoft Graph API.</p>
                <button 
                  onClick={refreshData}
                  className="px-4 py-2 border border-border rounded-md text-sm font-medium bg-background hover:bg-muted transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Dashboard;
