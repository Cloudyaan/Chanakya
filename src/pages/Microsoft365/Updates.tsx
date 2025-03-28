
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import Microsoft365 from '../Microsoft365';
import { getTenants, getTenantUpdates, fetchTenantUpdates } from '@/utils/database';
import { TenantConfig, TenantUpdate } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';
import SystemMessages from '@/components/Microsoft365/SystemMessages';
import UpdatesTable from '@/components/Microsoft365/UpdatesTable';
import UpdatesEmptyState from '@/components/Microsoft365/UpdatesEmptyState';
import UpdateDetailsDialog from '@/components/Microsoft365/UpdateDetailsDialog';
import UpdatesHeader from '@/components/Microsoft365/UpdatesHeader';
import NoTenantsMessage from '@/components/Microsoft365/NoTenantsMessage';

const Updates = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [updates, setUpdates] = useState<TenantUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<TenantUpdate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
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

  useEffect(() => {
    if (selectedTenant) {
      fetchUpdates(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchUpdates = async (tenantId: string) => {
    setIsLoading(true);
    
    try {
      const updateData = await getTenantUpdates(tenantId);
      setUpdates(updateData);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast({
        title: "Error loading updates",
        description: "Could not load update information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    if (selectedTenant) {
      fetchUpdates(selectedTenant);
    }
  };

  const fetchUpdateData = async () => {
    if (!selectedTenant) return;
    
    setIsFetching(true);
    try {
      const success = await fetchTenantUpdates(selectedTenant);
      
      if (success) {
        toast({
          title: "Fetching updates succeeded",
          description: "Update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        
        setTimeout(() => {
          refreshData();
        }, 2000);
      } else {
        toast({
          title: "Fetching updates failed",
          description: "Could not fetch update data from Microsoft Graph API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error triggering update fetch:", error);
      toast({
        title: "Error",
        description: "Failed to trigger update data fetch",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleUpdateClick = (update: TenantUpdate) => {
    setSelectedUpdate(update);
    setIsDialogOpen(true);
  };

  const activeTenants = tenants.filter(t => t.isActive);

  const hasSystemMessage = updates.some(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

  const regularUpdates = updates.filter(u => 
    u.id !== 'db-init' && 
    u.id !== 'msal-error' && 
    u.tenantName !== 'System Message'
  );

  const systemMessages = updates.filter(u => 
    u.id === 'db-init' || 
    u.id === 'msal-error' || 
    u.tenantName === 'System Message'
  );

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
            <h1 className="text-2xl font-semibold text-foreground">Message Center Updates</h1>
            <p className="text-m365-gray-500">View all service announcements from Microsoft</p>
          </div>
          
          <UpdatesHeader
            tenants={tenants}
            selectedTenant={selectedTenant}
            onTenantSelect={setSelectedTenant}
            onRefresh={refreshData}
            onFetch={fetchUpdateData}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </motion.div>
        
        {activeTenants.length === 0 ? (
          <NoTenantsMessage />
        ) : (
          <>
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="flex flex-col items-center">
                  <RefreshCw size={40} className="animate-spin text-m365-600 mb-4" />
                  <p className="text-m365-gray-500">Loading updates...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {hasSystemMessage && (
                  <SystemMessages 
                    messages={systemMessages} 
                    onFetchUpdates={fetchUpdateData}
                    isFetching={isFetching}
                  />
                )}
                
                {regularUpdates.length > 0 ? (
                  <UpdatesTable 
                    updates={regularUpdates}
                    onUpdateClick={handleUpdateClick}
                  />
                ) : !hasSystemMessage && (
                  <UpdatesEmptyState
                    onFetchUpdates={fetchUpdateData}
                    isFetching={isFetching}
                  />
                )}

                <UpdateDetailsDialog 
                  isOpen={isDialogOpen} 
                  onOpenChange={setIsDialogOpen}
                  update={selectedUpdate}
                />
              </div>
            )}
          </>
        )}
      </main>
    </Microsoft365>
  );
};

export default Updates;
