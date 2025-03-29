
import React from 'react';
import { WindowsUpdate } from '@/utils/types';
import WindowsUpdatesTable from './WindowsUpdatesTable';
import UpdatesLoading from './UpdatesLoading';

interface WindowsUpdatesContentProps {
  isLoading: boolean;
  windowsUpdates: WindowsUpdate[];
  isFetching: boolean;
  onFetch: () => void;
}

const WindowsUpdatesContent = ({
  isLoading,
  windowsUpdates,
  isFetching,
  onFetch
}: WindowsUpdatesContentProps) => {
  
  if (isLoading) {
    return <UpdatesLoading />;
  }

  return (
    <WindowsUpdatesTable 
      updates={windowsUpdates} 
      onFetch={onFetch}
      isFetching={isFetching}
    />
  );
};

export default WindowsUpdatesContent;
