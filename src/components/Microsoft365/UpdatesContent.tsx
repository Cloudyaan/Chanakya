
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import SystemMessages from './SystemMessages';
import UpdatesTable from './UpdatesTable';
import UpdatesEmptyState from './UpdatesEmptyState';
import UpdatesLoading from './UpdatesLoading';

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
    </>
  );
};

export default UpdatesContent;
