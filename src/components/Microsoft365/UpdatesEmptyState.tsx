
import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdatesEmptyStateProps {
  onFetchUpdates: () => void;
  isFetching: boolean;
}

const UpdatesEmptyState = ({ onFetchUpdates, isFetching }: UpdatesEmptyStateProps) => {
  return (
    <div className="p-8 text-center border border-dashed rounded-lg">
      <h2 className="text-xl text-gray-500 mb-2">No Updates Available</h2>
      <p className="text-gray-400 mb-4">
        Click the "Fetch Updates" button above to retrieve service announcements from Microsoft Graph API.
      </p>
      <Button variant="default" onClick={onFetchUpdates} disabled={isFetching}>
        {isFetching ? (
          <>
            <RefreshCw size={16} className="mr-2 animate-spin" />
            Fetching...
          </>
        ) : (
          <>
            <Download size={16} className="mr-2" />
            Fetch Updates
          </>
        )}
      </Button>
    </div>
  );
};

export default UpdatesEmptyState;
