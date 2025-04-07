
import React from 'react';
import { Clock, RefreshCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LastRefreshIndicatorProps {
  lastRefreshTime: Date | null;
  onRefresh: () => void;
  isFetching: boolean;
}

const LastRefreshIndicator: React.FC<LastRefreshIndicatorProps> = ({
  lastRefreshTime,
  onRefresh,
  isFetching
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
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full p-0"
        onClick={onRefresh}
        disabled={isFetching}
      >
        <RefreshCcw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default LastRefreshIndicator;
