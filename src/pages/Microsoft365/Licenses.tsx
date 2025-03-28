
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import LicenseTable from '@/components/LicenseTable/LicenseTable';
import { getTenants, getLicenseData } from '@/utils/database';
import { TenantConfig, License } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const Licenses = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
        setIsLoading(false);
      }
    }
    
    loadTenants();
  }, [toast]);
  
  // Fetch licenses when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      fetchLicenses(selectedTenant);
    }
  }, [selectedTenant]);
  
  const fetchLicenses = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      const licenseData = await getLicenseData(tenantId);
      
      if (licenseData.length > 0) {
        console.log("Received license data:", licenseData);
        setLicenses(licenseData);
      } else {
        // If no license data, reset to empty array
        setLicenses([]);
        
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
      
      // Reset state on error
      setLicenses([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const refreshData = () => {
    if (selectedTenant) {
      fetchLicenses(selectedTenant);
    }
  };
  
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
            <h1 className="text-2xl font-semibold text-foreground">License Management</h1>
            <p className="text-m365-gray-500">View and manage all Microsoft 365 licenses</p>
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
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>
        </motion.div>
        
        {activeTenants.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <h2 className="text-xl text-gray-500 mb-2">No Active Tenants</h2>
            <p className="text-gray-400 mb-4">Please add and activate at least one Microsoft 365 tenant in Settings.</p>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Go to Settings
            </Button>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="flex flex-col items-center">
                  <RefreshCw size={40} className="animate-spin text-m365-600 mb-4" />
                  <p className="text-m365-gray-500">Loading license data...</p>
                </div>
              </div>
            ) : licenses.length > 0 ? (
              <div className="mb-8">
                <LicenseTable licenses={licenses} />
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-lg">
                <h2 className="text-xl text-gray-500 mb-2">No License Data Available</h2>
                <p className="text-gray-400 mb-4">Run the <code>fetch_licenses.py</code> script to retrieve license data from Microsoft Graph API.</p>
                <Button variant="outline" onClick={refreshData}>
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Licenses;
