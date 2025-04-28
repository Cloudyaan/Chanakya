
import React from 'react';
import { TenantUpdate, WindowsUpdate, M365News } from '@/utils/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Monitor, Newspaper } from 'lucide-react';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import WindowsUpdatesContent from './WindowsUpdatesContent';
import M365NewsContent from './M365NewsContent';
import LastRefreshIndicator from './LastRefreshIndicator';

interface UpdateTabsContentProps {
  defaultTab?: string;
  // Message Center Props
  regularUpdates: TenantUpdate[];
  hasSystemMessage: boolean;
  systemMessages: TenantUpdate[];
  messageCenterIsLoading: boolean;
  messageCenterIsFetching: boolean;
  onFetchMessageCenter: () => Promise<void>;
  onUpdateClick: (update: TenantUpdate) => void;
  messageCenterLastRefresh: Date | null;
  onRefreshMessageCenter?: () => Promise<void>;
  
  // Windows Updates Props
  windowsUpdates: WindowsUpdate[];
  windowsIsLoading: boolean;
  windowsIsFetching: boolean;
  onFetchWindows: () => void;
  onWindowsUpdateClick: (update: WindowsUpdate) => void;
  windowsLastRefresh: Date | null;
  onRefreshWindows?: () => Promise<void>;
  
  // M365 News Props
  newsItems: M365News[];
  newsIsLoading: boolean;
  newsIsFetching: boolean;
  onFetchNews: () => void;
  newsLastRefresh: Date | null;
  onRefreshNews?: () => Promise<void>;
}

const UpdateTabsContent = ({
  defaultTab = 'message-center',
  regularUpdates,
  hasSystemMessage,
  systemMessages,
  messageCenterIsLoading,
  messageCenterIsFetching,
  onFetchMessageCenter,
  onUpdateClick,
  messageCenterLastRefresh,
  
  windowsUpdates,
  windowsIsLoading,
  windowsIsFetching,
  onFetchWindows,
  onWindowsUpdateClick,
  windowsLastRefresh,
  
  newsItems,
  newsIsLoading,
  newsIsFetching,
  onFetchNews,
  newsLastRefresh
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
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="sticky top-[144px] bg-background z-50 pt-2 pb-4">
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
        </div>
        
        <TabsContent value="message-center" className="mt-0">
          <div className="flex justify-end mb-2">
            <LastRefreshIndicator 
              lastRefreshTime={messageCenterLastRefresh} 
              isFetching={messageCenterIsFetching}
            />
          </div>
          
          {regularUpdates.length > 0 ? (
            <UpdatesTable 
              updates={regularUpdates}
              onUpdateClick={onUpdateClick}
              onRefresh={onFetchMessageCenter}
              isLoading={messageCenterIsLoading}
              isFetching={messageCenterIsFetching}
              onFetch={onFetchMessageCenter}
            />
          ) : !hasSystemMessage && (
            <UpdatesEmptyState
              onFetchUpdates={onFetchMessageCenter}
              isFetching={messageCenterIsFetching}
            />
          )}
        </TabsContent>
        
        <TabsContent value="windows-updates" className="mt-0">
          <div className="flex justify-end mb-2">
            <LastRefreshIndicator 
              lastRefreshTime={windowsLastRefresh} 
              isFetching={windowsIsFetching}
            />
          </div>
          
          <WindowsUpdatesContent 
            isLoading={windowsIsLoading}
            windowsUpdates={windowsUpdates}
            isFetching={windowsIsFetching}
            onFetch={onFetchWindows}
            onUpdateClick={onWindowsUpdateClick}
          />
        </TabsContent>
        
        <TabsContent value="news" className="mt-0">
          <div className="flex justify-end mb-2">
            <LastRefreshIndicator 
              lastRefreshTime={newsLastRefresh} 
              isFetching={newsIsFetching}
            />
          </div>
          
          <M365NewsContent 
            isLoading={newsIsLoading}
            newsItems={newsItems}
            isFetching={newsIsFetching}
            onFetch={onFetchNews}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default UpdateTabsContent;
