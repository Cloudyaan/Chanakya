import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Microsoft365 from '../Microsoft365';
import { getTenants } from '@/utils/database';
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

const Updates = () => {
  const [tenants, setTenants] = useState<TenantConfig[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [selectedUpdate, setSelectedUpdate] = useState<TenantUpdate | null>(null);
  const [selectedWindowsUpdate, setSelectedWindowsUpdate] = useState<WindowsUpdate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isWindowsDialogOpen, setIsWindowsDialogOpen] = useState(false);

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

  const handleRefreshMessageCenter = () => {
    return refreshMessageCenter();
  };
  
  const handleRefreshWindowsUpdates = () => {
    if (selectedTenant) {
      return refreshWindowsUpdates(selectedTenant);
    }
  };
  
  const handleRefreshNews = () => {
    return refreshNews();
  };

  const messageCenterLastRefresh = useAutoRefresh(
    handleRefreshMessageCenter, 
    60, 
    !!selectedTenant, 
    0, 
    `message-center-last-refresh-${selectedTenant}`
  );
  
  const windowsLastRefresh = useAutoRefresh(
    handleRefreshWindowsUpdates, 
    60, 
    !!selectedTenant, 
    10, 
    `windows-updates-last-refresh-${selectedTenant}`
  );
  
  const newsLastRefresh = useAutoRefresh(
    handleRefreshNews, 
    60, 
    !!selectedTenant, 
    20, 
    `m365-news-last-refresh-${selectedTenant}`
  );

  useEffect(() => {
    async function loadTenants() {
      try {
        const loadedTenants = await getTenants();
        setTenants(loadedTenants);
        
        const savedTenant = localStorage.getItem('selectedTenant');
        if (savedTenant) {
          console.log('Using saved tenant from localStorage:', savedTenant);
          setSelectedTenant(savedTenant);
          localStorage.setItem('selectedTenant', savedTenant);
        } else {
          const activeTenant = loadedTenants.find(t => t.isActive);
          if (activeTenant) {
            console.log('Using first active tenant:', activeTenant.id);
            setSelectedTenant(activeTenant.id);
            localStorage.setItem('selectedTenant', activeTenant.id);
          }
        }
      } catch (error) {
        console.error("Error loading tenants:", error);
      }
    }
    
    loadTenants();
    
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Tenant changed event:', customEvent.detail);
      setSelectedTenant(customEvent.detail.tenantId);
      localStorage.setItem('selectedTenant', customEvent.detail.tenantId);
      
      const tenantChangeEvent = new CustomEvent('tenantChanged', {
        detail: { tenantId: customEvent.detail.tenantId }
      });
      window.dispatchEvent(tenantChangeEvent);
    };
    
    window.addEventListener('tenantChanged', handleTenantChange);
    
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);

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
              regularUpdates={regularUpdates}
              hasSystemMessage={hasSystemMessage}
              systemMessages={systemMessages}
              messageCenterIsLoading={messageIsLoading}
              messageCenterIsFetching={messageIsFetching}
              onFetchMessageCenter={fetchUpdateData}
              onUpdateClick={handleUpdateClick}
              messageCenterLastRefresh={messageCenterLastRefresh}
              
              windowsUpdates={windowsUpdates}
              windowsIsLoading={windowsIsLoading}
              windowsIsFetching={windowsIsFetching}
              onFetchWindows={handleFetchWindowsUpdates}
              onWindowsUpdateClick={handleWindowsUpdateClick}
              windowsLastRefresh={windowsLastRefresh}
              
              newsItems={newsItems}
              newsIsLoading={newsIsLoading}
              newsIsFetching={newsIsFetching}
              onFetchNews={handleFetchM365News}
              newsLastRefresh={newsLastRefresh}
            />

            {/* Message Center Update Dialog */}
            <UpdateDetailsDialog 
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              update={selectedUpdate}
            />
            
            {/* Windows Update Dialog */}
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
