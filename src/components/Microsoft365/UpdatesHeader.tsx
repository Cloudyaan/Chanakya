
import React from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UpdatesHeaderProps {
  onRefresh: () => void;
  onFetch: () => void;
  isLoading: boolean;
  isFetching: boolean;
  selectedTenant: string | null;
}

const UpdatesHeader = ({ 
  onRefresh, 
  onFetch,
  isLoading,
  isFetching,
  selectedTenant
}: UpdatesHeaderProps) => {
  return (
    <div className="flex items-center gap-3 mt-2 sm:mt-0">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isLoading}
        className="flex items-center gap-1"
      >
        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        Refresh
      </Button>
      
      <Button 
        variant="default" 
        size="sm" 
        onClick={onFetch}
        disabled={isLoading || isFetching || !selectedTenant}
        className="flex items-center gap-1"
      >
        <Download size={16} className={isFetching ? "animate-bounce" : ""} />
        Fetch Updates
      </Button>
    </div>
  );
};

export default UpdatesHeader;
