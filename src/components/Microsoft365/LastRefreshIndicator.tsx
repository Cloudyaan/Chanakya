
import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

interface LastRefreshIndicatorProps {
  lastRefreshTime: Date | null;
  onRefresh?: () => void;
  isFetching?: boolean;
}

const LastRefreshIndicator: React.FC<LastRefreshIndicatorProps> = ({
  lastRefreshTime,
  onRefresh,
  isFetching = false
}) => {
  // Format the last refresh time
  const formattedTime = lastRefreshTime 
    ? formatDistanceToNow(lastRefreshTime, { addSuffix: true })
    : 'Never';

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              Last refreshed: {formattedTime}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {lastRefreshTime 
              ? `Last refresh: ${lastRefreshTime.toLocaleString()}` 
              : 'Data has not been refreshed yet'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {onRefresh && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 ml-1" 
          onClick={onRefresh}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh</span>
        </Button>
      )}
    </div>
  );
};

export default LastRefreshIndicator;
