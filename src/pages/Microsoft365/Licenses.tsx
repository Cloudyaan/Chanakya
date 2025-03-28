
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import LicenseTable from '@/components/LicenseTable/LicenseTable';
import { getLicenseData } from '@/utils/database';
import { License } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Microsoft365 from '../Microsoft365';

const Licenses = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  
  // Listen for global tenant changes
  useEffect(() => {
    const savedTenant = localStorage.getItem('selectedTenant');
    if (savedTenant) {
      setSelectedTenant(savedTenant);
      fetchLicenses(savedTenant);
    }
    
    const handleTenantChange = (event: CustomEvent) => {
      const { tenantId } = event.detail;
      setSelectedTenant(tenantId);
      fetchLicenses(tenantId);
    };
    
    window.addEventListener('tenantChanged', handleTenantChange as EventListener);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange as EventListener);
    };
  }, []);
  
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
          
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
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
        
        {!selectedTenant ? (
          <div className="p-8 text-center border border-dashed rounded-lg">
            <h2 className="text-xl text-gray-500 mb-2">No Active Tenant Selected</h2>
            <p className="text-gray-400 mb-4">Please select a tenant from the dropdown in the top menu.</p>
          </div>
        ) : isLoading ? (
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
      </main>
    </Microsoft365>
  );
};

export default Licenses;
