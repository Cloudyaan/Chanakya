
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
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
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

  const {
    regularUpdates,
    systemMessages,
    hasSystemMessage,
    isLoading: messageIsLoading,
    isFetching: messageIsFetching,
    refreshData: refreshMessageCenter,
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

  const handleManualMessageCenterRefresh = async () => {
    toast({
      title: "Refreshing Message Center Updates",
      description: "Fetching latest data from Microsoft Graph API",
    });
    await fetchUpdateData();
    return refreshMessageCenter();
  };
  
  const handleManualWindowsRefresh = async () => {
    toast({
      title: "Refreshing Windows Updates",
      description: "Fetching latest data from Microsoft Graph API",
    });
    await handleFetchWindowsUpdates();
    if (selectedTenant) {
      return refreshWindowsUpdates(selectedTenant);
    }
    return Promise.resolve();
  };
  
  const handleManualNewsRefresh = async () => {
    toast({
      title: "Refreshing Microsoft 365 News",
      description: "Fetching latest news and announcements",
    });
    await handleFetchM365News();
    return refreshNews();
  };

  const [messageCenterLastRefresh, refreshMessageCenterManually] = useAutoRefresh(
    handleManualMessageCenterRefresh, 
    60, 
    !!selectedTenant, 
    0, 
    `message-center-last-refresh-${selectedTenant}`
  );
  
  const [windowsLastRefresh, refreshWindowsManually] = useAutoRefresh(
    handleManualWindowsRefresh, 
    60, 
    !!selectedTenant, 
    10, 
    `windows-updates-last-refresh-${selectedTenant}`
  );
  
  const [newsLastRefresh, refreshNewsManually] = useAutoRefresh(
    handleManualNewsRefresh, 
    60, 
    !!selectedTenant, 
    20, 
    `m365-news-last-refresh-${selectedTenant}`
  );

  useEffect(() => {
    if (!tenantsLoading && tenants.length > 0) {
      console.log('Loaded tenants:', tenants);
      
      // Find the active tenant from the loaded tenants
      const activeTenants = tenants.filter(t => t.isActive);
      console.log('Active tenants:', activeTenants);
      
      if (activeTenants.length > 0) {
        const savedTenantId = localStorage.getItem('selectedTenant');
        let defaultTenant = activeTenants[0];
        
        // Check if saved tenant exists and is active
        if (savedTenantId) {
          const savedTenant = activeTenants.find(t => t.id === savedTenantId);
          if (savedTenant) {
            defaultTenant = savedTenant;
          }
        }
        
        console.log('Setting default tenant:', defaultTenant.id);
        setSelectedTenant(defaultTenant.id);
        localStorage.setItem('selectedTenant', defaultTenant.id);
      } else {
        console.log('No active tenants found');
        localStorage.removeItem('selectedTenant');
        setSelectedTenant(null);
      }
    }
  }, [tenants, tenantsLoading]);

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
              messageCenterLastRefresh={messageCenterLastRefresh}
              onRefreshMessageCenter={refreshMessageCenterManually}
              
              windowsUpdates={windowsUpdates}
              windowsIsLoading={windowsIsLoading}
              windowsIsFetching={windowsIsFetching}
              onFetchWindows={handleFetchWindowsUpdates}
              onWindowsUpdateClick={handleWindowsUpdateClick}
              windowsLastRefresh={windowsLastRefresh}
              onRefreshWindows={refreshWindowsManually}
              
              newsItems={newsItems}
              newsIsLoading={newsIsLoading}
              newsIsFetching={newsIsFetching}
              onFetchNews={handleFetchM365News}
              newsLastRefresh={newsLastRefresh}
              onRefreshNews={refreshNewsManually}
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
