
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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
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
      console.log('Windows updates loaded:', data);
      setWindowsUpdates(data);
    } catch (error) {
      console.error('Error loading Windows updates:', error);
      toast({
        title: "Error loading Windows updates",
        description: "Could not load Windows update information",
        variant: "destructive",
      });
      setWindowsUpdates([]);
    } finally {
      setIsLoadingWindows(false);
    }
  };
  
  const handleFetchWindowsUpdates = async () => {
    if (!selectedTenant) return;
    
    setIsFetchingWindows(true);
    try {
      console.log(`Triggering fetch Windows updates for tenant: ${selectedTenant}`);
      const success = await fetchWindowsUpdates(selectedTenant);
      
      if (success) {
        toast({
          title: "Fetching Windows updates succeeded",
          description: "Windows update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        // Reload the data after fetching with a small delay
        setTimeout(() => loadWindowsUpdates(selectedTenant), 2000);
      } else {
        toast({
          title: "Fetching Windows updates failed",
          description: "Could not fetch Windows update data from Microsoft Graph API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching Windows updates:', error);
      toast({
        title: "Error",
        description: "Failed to trigger Windows update data fetch",
        variant: "destructive",
      });
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
