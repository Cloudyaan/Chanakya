
import React from 'react';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Monitor, Newspaper } from 'lucide-react';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import WindowsUpdatesContent from './WindowsUpdatesContent';

interface UpdateTabsContentProps {
  // Message Center Props
  regularUpdates: TenantUpdate[];
  hasSystemMessage: boolean;
  systemMessages: TenantUpdate[];
  messageCenterIsLoading: boolean;
  messageCenterIsFetching: boolean;
  onFetchMessageCenter: () => Promise<void>;
  onUpdateClick: (update: TenantUpdate) => void;
  
  // Windows Updates Props
  windowsUpdates: WindowsUpdate[];
  windowsIsLoading: boolean;
  windowsIsFetching: boolean;
  onFetchWindows: () => void;
}

const UpdateTabsContent = ({
  regularUpdates,
  hasSystemMessage,
  systemMessages,
  messageCenterIsLoading,
  messageCenterIsFetching,
  onFetchMessageCenter,
  onUpdateClick,
  windowsUpdates,
  windowsIsLoading,
  windowsIsFetching,
  onFetchWindows
}: UpdateTabsContentProps) => {
  
  return (
    <>
      {hasSystemMessage && (
        <SystemMessages 
          messages={systemMessages} 
          onFetchUpdates={onFetchMessageCenter}
          isFetching={messageCenterIsFetching}
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
              onFetchUpdates={onFetchMessageCenter}
              isFetching={messageCenterIsFetching}
            />
          )}
        </TabsContent>
        
        <TabsContent value="windows-updates">
          <WindowsUpdatesContent 
            isLoading={windowsIsLoading}
            windowsUpdates={windowsUpdates}
            isFetching={windowsIsFetching}
            onFetch={onFetchWindows}
          />
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

export default UpdateTabsContent;
