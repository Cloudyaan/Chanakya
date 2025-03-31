
import React, { useState } from 'react';
import { TenantUpdate } from '@/utils/types';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import UpdatesLoading from './UpdatesLoading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Monitor, Newspaper } from 'lucide-react';
import WindowsUpdatesContent from './WindowsUpdatesContent';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { useM365News } from '@/hooks/useM365News';
import M365NewsContent from './M365NewsContent';

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
  // Get selected tenant ID from localStorage
  const savedTenant = localStorage.getItem('selectedTenant');
  
  // Use our custom hook for Windows updates
  const {
    windowsUpdates,
    isLoading: windowsIsLoading,
    isFetching: windowsIsFetching,
    handleFetchWindowsUpdates
  } = useWindowsUpdates(savedTenant);
  
  // Use our custom hook for M365 news
  const {
    newsItems,
    isLoading: newsIsLoading,
    isFetching: newsIsFetching,
    handleFetchM365News
  } = useM365News(savedTenant);
  
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
              onRefresh={onFetchUpdates}
              isLoading={isLoading}
              isFetching={isFetching}
              onFetch={onFetchUpdates}
            />
          ) : !hasSystemMessage && (
            <UpdatesEmptyState
              onFetchUpdates={onFetchUpdates}
              isFetching={isFetching}
            />
          )}
        </TabsContent>
        
        <TabsContent value="windows-updates">
          <WindowsUpdatesContent 
            isLoading={windowsIsLoading}
            windowsUpdates={windowsUpdates}
            isFetching={windowsIsFetching}
            onFetch={handleFetchWindowsUpdates}
          />
        </TabsContent>
        
        <TabsContent value="news">
          <M365NewsContent 
            isLoading={newsIsLoading}
            newsItems={newsItems}
            isFetching={newsIsFetching}
            onFetch={handleFetchM365News}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default UpdatesContent;
