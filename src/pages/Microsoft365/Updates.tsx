
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import Microsoft365 from '../Microsoft365';
import { useTenantCache } from '@/hooks/useTenantCache';
import { TenantConfig, TenantUpdate, WindowsUpdate } from '@/utils/types';
import UpdateDetailsDialog from '@/components/Microsoft365/UpdateDetailsDialog';
import WindowsUpdateDetailsDialog from '@/components/Microsoft365/WindowsUpdateDetailsDialog';
import UpdatesHeader from '@/components/Microsoft365/UpdatesHeader';
import NoTenantsMessage from '@/components/Microsoft365/NoTenantsMessage';
import { useUpdates } from '@/hooks/useUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { useM365News } from '@/hooks/useM365News';
import UpdateTabsContent from '@/components/Microsoft365/UpdateTabsContent';
import { useToast } from '@/hooks/use-toast';

const Updates = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');

  const { tenants, isLoading: tenantsLoading } = useTenantCache();
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<TenantUpdate | null>(null);
  const [selectedWindowsUpdate, setSelectedWindowsUpdate] = useState<WindowsUpdate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWindowsDialogOpen, setIsWindowsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Always call hooks unconditionally - pass selectedTenant even if null
  const {
    regularUpdates,
    systemMessages,
    hasSystemMessage,
    isLoading: messageIsLoading,
    isFetching: messageIsFetching,
    refreshData: refreshMessageCenterFromDB,
    fetchUpdateData
  } = useUpdates(selectedTenant);
  
  const {
    windowsUpdates,
    isLoading: windowsIsLoading,
    isFetching: windowsIsFetching,
    loadWindowsUpdates: refreshWindowsUpdates,
    handleFetchWindowsUpdates
  } = useWindowsUpdates(selectedTenant);
  
  const {
    newsItems,
    isLoading: newsIsLoading,
    isFetching: newsIsFetching,
    refreshData: refreshNews,
    handleFetchM365News
  } = useM365News(selectedTenant);

  // Enhanced debugging for tenant selection
  useEffect(() => {
    console.log('Updates component - tenant selection debug:', {
      tenantsLoading,
      tenantsCount: tenants.length,
      selectedTenant,
      activeTenants: tenants.filter(t => t.isActive).length,
      tenants: tenants.map(t => ({ id: t.id, name: t.name, isActive: t.isActive }))
    });
  }, [tenants, tenantsLoading, selectedTenant]);

  // Improved tenant selection logic
  useEffect(() => {
    if (!tenantsLoading && tenants.length > 0) {
      console.log('Loaded tenants:', tenants);
      
      // Find the active tenants from the loaded tenants
      const activeTenants = tenants.filter(t => t.isActive);
      console.log('Active tenants:', activeTenants);
      
      if (activeTenants.length > 0) {
        // Only set tenant if we don't already have one selected
        if (!selectedTenant) {
          const savedTenantId = localStorage.getItem('selectedTenant');
          let defaultTenant = activeTenants[0];
          
          // Check if saved tenant exists and is active
          if (savedTenantId) {
            const savedTenant = activeTenants.find(t => t.id === savedTenantId);
            if (savedTenant) {
              defaultTenant = savedTenant;
            }
          }
          
          console.log('Setting default tenant:', defaultTenant.id, defaultTenant.name);
          setSelectedTenant(defaultTenant.id);
          localStorage.setItem('selectedTenant', defaultTenant.id);
        }
      } else {
        console.log('No active tenants found');
        localStorage.removeItem('selectedTenant');
        setSelectedTenant(null);
      }
    }
  }, [tenants, tenantsLoading, selectedTenant]);

  // Listen for tenant change events
  useEffect(() => {
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Tenant changed event:', customEvent.detail);
      
      // Validate that the tenant exists in our loaded tenants
      const tenantExists = tenants.find(t => t.id === customEvent.detail.tenantId);
      if (tenantExists) {
        setSelectedTenant(customEvent.detail.tenantId);
        localStorage.setItem('selectedTenant', customEvent.detail.tenantId);
      } else {
        console.warn('Attempted to select non-existent tenant:', customEvent.detail.tenantId);
        // Fall back to first active tenant
        const activeTenant = tenants.find(t => t.isActive);
        if (activeTenant) {
          setSelectedTenant(activeTenant.id);
          localStorage.setItem('selectedTenant', activeTenant.id);
        }
      }
    };
    
    window.addEventListener('tenantChanged', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, [tenants]);

  // Manual refresh handlers that only refresh from database
  const handleManualMessageCenterRefresh = async (): Promise<void> => {
    if (!selectedTenant) {
      toast({
        title: "No Tenant Selected",
        description: "Please select a tenant first",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Refreshing Message Center Updates",
      description: "Loading latest data from database",
    });
    await refreshMessageCenterFromDB();
  };
  
  const handleManualWindowsRefresh = async (): Promise<void> => {
    if (!selectedTenant) {
      toast({
        title: "No Tenant Selected", 
        description: "Please select a tenant first",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Refreshing Windows Updates", 
      description: "Loading latest data from database",
    });
    await refreshWindowsUpdates(selectedTenant);
  };
  
  const handleManualNewsRefresh = async (): Promise<void> => {
    if (!selectedTenant) {
      toast({
        title: "No Tenant Selected",
        description: "Please select a tenant first",
        variant: "destructive"
      });
      return;
    }
    
    console.log('handleManualNewsRefresh - refreshing news for tenant:', selectedTenant);
    toast({
      title: "Refreshing Microsoft 365 News",
      description: "Loading latest news from database",
    });
    await refreshNews();
  };

  // Debug logging
  useEffect(() => {
    console.log('Updates component - data debug:', {
      selectedTenant,
      newsItemsCount: newsItems?.length || 0,
      newsIsLoading,
      newsIsFetching,
      newsItemsSample: newsItems?.slice(0, 2)
    });
  }, [selectedTenant, newsItems, newsIsLoading, newsIsFetching]);

  const handleUpdateClick = (update: TenantUpdate) => {
    setSelectedUpdate(update);
    setIsDialogOpen(true);
  };

  const handleWindowsUpdateClick = (update: WindowsUpdate) => {
    setSelectedWindowsUpdate(update);
    setIsWindowsDialogOpen(true);
  };

  const activeTenants = tenants.filter(t => t.isActive);

  return (
    <Microsoft365>
      <main className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="sticky top-[60px] bg-background z-10 pt-8 pb-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.4 }}
            className="mb-6 flex flex-wrap justify-between items-center"
          >
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Overview</h1>
              <p className="text-m365-gray-500">View all updates from Microsoft 365 and Windows</p>
            </div>
            
            <UpdatesHeader selectedTenant={selectedTenant} />
          </motion.div>
        </div>
        
        {activeTenants.length === 0 ? (
          <NoTenantsMessage />
        ) : (
          <div className="space-y-6 pb-8">
            <UpdateTabsContent 
              defaultTab={tabFromUrl || 'message-center'}
              regularUpdates={regularUpdates}
              hasSystemMessage={hasSystemMessage}
              systemMessages={systemMessages}
              messageCenterIsLoading={messageIsLoading}
              messageCenterIsFetching={messageIsFetching}
              onFetchMessageCenter={fetchUpdateData}
              onUpdateClick={handleUpdateClick}
              messageCenterLastRefresh={null}
              onRefreshMessageCenter={handleManualMessageCenterRefresh}
              
              windowsUpdates={windowsUpdates}
              windowsIsLoading={windowsIsLoading}
              windowsIsFetching={windowsIsFetching}
              onFetchWindows={handleFetchWindowsUpdates}
              onWindowsUpdateClick={handleWindowsUpdateClick}
              windowsLastRefresh={null}
              onRefreshWindows={handleManualWindowsRefresh}
              
              newsItems={newsItems}
              newsIsLoading={newsIsLoading}
              newsIsFetching={newsIsFetching}
              onFetchNews={handleFetchM365News}
              newsLastRefresh={null}
              onRefreshNews={handleManualNewsRefresh}
            />

            <UpdateDetailsDialog 
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              update={selectedUpdate}
            />
            
            <WindowsUpdateDetailsDialog 
              isOpen={isWindowsDialogOpen}
              onOpenChange={setIsWindowsDialogOpen}
              update={selectedWindowsUpdate}
            />
          </div>
        )}
      </main>
    </Microsoft365>
  );
};

export default Updates;
