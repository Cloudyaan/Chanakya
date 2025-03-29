
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import UpdatesLoading from './UpdatesLoading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Monitor, Newspaper } from 'lucide-react';

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
          <WindowsUpdatesTable />
        </TabsContent>
        
        <TabsContent value="news">
          <NewsTable />
        </TabsContent>
      </Tabs>
    </>
  );
};

// Windows Updates Tab Content Component
const WindowsUpdatesTable = () => {
  return (
    <div className="p-8 text-center border rounded-lg">
      <h2 className="text-xl text-gray-700 mb-2">Windows Updates</h2>
      <p className="text-gray-500 mb-4">
        Windows updates information will be displayed here. This feature is coming soon.
      </p>
    </div>
  );
};

// News Tab Content Component
const NewsTable = () => {
  return (
    <div className="p-8 text-center border rounded-lg">
      <h2 className="text-xl text-gray-700 mb-2">Microsoft 365 News</h2>
      <p className="text-gray-500 mb-4">
        Latest news and announcements from Microsoft 365 will be displayed here. This feature is coming soon.
      </p>
    </div>
  );
};

export default UpdatesContent;
