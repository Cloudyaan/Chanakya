
import React, { useState, useEffect } from 'react';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import UpdatesLoading from './UpdatesLoading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Monitor, Newspaper } from 'lucide-react';
import { getWindowsUpdates, fetchWindowsUpdates } from '@/utils/updatesOperations';
import WindowsUpdatesTable from './WindowsUpdatesTable';

interface UpdatesContentProps {
  isLoading: boolean;
  hasSystemMessage: boolean;
  systemMessages: TenantUpdate[];
  regularUpdates: TenantUpdate[];
  isFetching: boolean;
  onFetchUpdates: () => Promise<void>;
  onUpdateClick: (update: TenantUpdate) => void;
}

const UpdatesContent = ({
  isLoading,
  hasSystemMessage,
  systemMessages,
  regularUpdates,
  isFetching,
  onFetchUpdates,
  onUpdateClick
}: UpdatesContentProps) => {
  const [windowsUpdates, setWindowsUpdates] = useState<WindowsUpdate[]>([]);
  const [isLoadingWindows, setIsLoadingWindows] = useState(false);
  const [isFetchingWindows, setIsFetchingWindows] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  
  useEffect(() => {
    // Get the selected tenant ID from localStorage
    const savedTenant = localStorage.getItem('selectedTenant');
    if (savedTenant) {
      setSelectedTenant(savedTenant);
      loadWindowsUpdates(savedTenant);
    }
    
    // Listen for tenant change events
    const handleTenantChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      setSelectedTenant(customEvent.detail.tenantId);
      loadWindowsUpdates(customEvent.detail.tenantId);
    };
    
    window.addEventListener('tenantChanged', handleTenantChange);
    return () => {
      window.removeEventListener('tenantChanged', handleTenantChange);
    };
  }, []);
  
  const loadWindowsUpdates = async (tenantId: string) => {
    setIsLoadingWindows(true);
    try {
      const data = await getWindowsUpdates(tenantId);
      setWindowsUpdates(data);
    } catch (error) {
      console.error('Error loading Windows updates:', error);
    } finally {
      setIsLoadingWindows(false);
    }
  };
  
  const handleFetchWindowsUpdates = async () => {
    if (!selectedTenant) return;
    
    setIsFetchingWindows(true);
    try {
      await fetchWindowsUpdates(selectedTenant);
      // Reload the data after fetching
      setTimeout(() => loadWindowsUpdates(selectedTenant), 2000);
    } catch (error) {
      console.error('Error fetching Windows updates:', error);
    } finally {
      setIsFetchingWindows(false);
    }
  };
  
  if (isLoading) {
    return <UpdatesLoading />;
  }
  
  return (
    <>
      {hasSystemMessage && (
        <SystemMessages 
          messages={systemMessages} 
          onFetchUpdates={onFetchUpdates}
          isFetching={isFetching}
        />
      )}
      
      <Tabs defaultValue="message-center" className="w-full">
        <TabsList className="w-full mb-4 grid grid-cols-3">
          <TabsTrigger value="message-center" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Message Center
          </TabsTrigger>
          <TabsTrigger value="windows-updates" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Windows Updates
          </TabsTrigger>
          <TabsTrigger value="news" className="flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            News
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="message-center">
          {regularUpdates.length > 0 ? (
            <UpdatesTable 
              updates={regularUpdates}
              onUpdateClick={onUpdateClick}
            />
          ) : !hasSystemMessage && (
            <UpdatesEmptyState
              onFetchUpdates={onFetchUpdates}
              isFetching={isFetching}
            />
          )}
        </TabsContent>
        
        <TabsContent value="windows-updates">
          {isLoadingWindows ? (
            <UpdatesLoading />
          ) : (
            <WindowsUpdatesTable 
              updates={windowsUpdates} 
              onFetch={handleFetchWindowsUpdates}
              isFetching={isFetchingWindows}
            />
          )}
        </TabsContent>
        
        <TabsContent value="news">
          <div className="p-8 text-center border rounded-lg">
            <h2 className="text-xl text-gray-700 mb-2">Microsoft 365 News</h2>
            <p className="text-gray-500 mb-4">
              Latest news and announcements from Microsoft 365 will be displayed here. This feature is coming soon.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default UpdatesContent;
