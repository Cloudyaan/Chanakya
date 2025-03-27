
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import NavBar from '@/components/NavBar';
import LicenseTable from '@/components/LicenseTable/LicenseTable';
import { getTenants } from '@/utils/database';
import { TenantConfig, License } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const M365Licensing = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Fetch tenants on mount
  useEffect(() => {
    async function loadTenants() {
      const loadedTenants = await getTenants();
      setTenants(loadedTenants);
      
      // Select the first active tenant by default
      const activeTenant = loadedTenants.find(t => t.isActive);
      if (activeTenant) {
        setSelectedTenant(activeTenant.id);
      }
    }
    
    loadTenants();
  }, []);
  
  // Fetch licenses when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      fetchLicenses(selectedTenant);
    }
  }, [selectedTenant]);
  
  const fetchLicenses = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/licenses?tenantId=${tenantId}`);
      
      if (!response.ok) {
        // If the endpoint returns an error, show a toast and return mock data
        console.error('Error fetching licenses:', response.status);
        toast({
          title: "Error fetching licenses",
          description: "Failed to fetch license data. Using sample data instead.",
          variant: "destructive",
        });
        
        // Use mock data as fallback
        const tenant = tenants.find(t => t.id === tenantId);
        const mockLicenses: License[] = [
          {
            id: "license-1",
            sku: "ENTERPRISEPACK",
            displayName: "Microsoft 365 E3",
            totalCount: 100,
            usedCount: 87,
            availableCount: 13,
            renewalDate: new Date().toISOString(),
            price: 32,
            currency: "USD",
            tenantId: tenant?.id || "",
            tenantName: tenant?.name || "Unknown",
            includedServices: ["Exchange Online", "SharePoint Online", "Teams", "OneDrive for Business"],
            description: "Microsoft 365 E3 includes premium Office applications, security and compliance tools, and Windows 10 Enterprise."
          },
          {
            id: "license-2",
            sku: "ENTERPRISEPREMIUM",
            displayName: "Microsoft 365 E5",
            totalCount: 20,
            usedCount: 18,
            availableCount: 2,
            renewalDate: new Date().toISOString(),
            price: 57,
            currency: "USD",
            tenantId: tenant?.id || "",
            tenantName: tenant?.name || "Unknown",
            includedServices: ["Exchange Online", "SharePoint Online", "Teams", "OneDrive for Business", "Power BI Pro", "Advanced Security"],
            description: "Microsoft 365 E5 includes all E3 features plus advanced security, analytics, and voice capabilities."
          }
        ];
        
        setLicenses(mockLicenses);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log("Received license data:", data);
      setLicenses(data);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast({
        title: "Connection Error",
        description: "Could not connect to the backend. Please check if the server is running.",
        variant: "destructive",
      });
      
      // Use empty array when error occurs
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
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex flex-wrap justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">M365 Licensing</h1>
            <p className="text-m365-gray-500">Manage and monitor your Microsoft 365 licensing</p>
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
            {activeTenants.length > 1 && (
              <Tabs 
                defaultValue={selectedTenant || undefined} 
                className="mb-6"
                onValueChange={(value) => setSelectedTenant(value)}
              >
                <TabsList>
                  {activeTenants.map(tenant => (
                    <TabsTrigger key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            
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
    </div>
  );
};

export default M365Licensing;
