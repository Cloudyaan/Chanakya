
import React from 'react';
import { WindowsUpdate } from '@/utils/types';
import UpdatesLoading from './UpdatesLoading';
import { 
  RefreshCw, 
  Monitor, 
  Calendar, 
  Tag,
  FileText
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WindowsUpdatesContentProps {
  isLoading: boolean;
  windowsUpdates: WindowsUpdate[];
  isFetching: boolean;
  onFetch: () => void;
  onUpdateClick: (update: WindowsUpdate) => void;
}

const WindowsUpdatesContent = ({
  isLoading,
  windowsUpdates,
  isFetching,
  onFetch,
  onUpdateClick
}: WindowsUpdatesContentProps) => {
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'N/A';
    }
  };
  
  if (isLoading) {
    return <UpdatesLoading />;
  }

  if (!Array.isArray(windowsUpdates) || windowsUpdates.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Windows Updates</CardTitle>
            <CardDescription>Recent Windows updates and release information</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onFetch}
            disabled={isFetching}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? 'Fetching...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Monitor className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Windows Updates Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            There are no Windows updates available in the database. Click the button below to fetch updates from Microsoft.
          </p>
          <Button 
            onClick={onFetch} 
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            {isFetching ? 'Fetching Updates...' : 'Fetch Windows Updates'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Sort by last modified date (oldest first - ascending order)  
  const sortedUpdates = [...windowsUpdates].sort((a, b) => {
    const dateA = a.lastModifiedDate ? new Date(a.lastModifiedDate).getTime() : 0;
    const dateB = b.lastModifiedDate ? new Date(b.lastModifiedDate).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <Card>
      <CardHeader className="sticky top-[200px] z-10 bg-white flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Windows Updates</CardTitle>
          <CardDescription>Recent Windows updates and release information</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFetch}
          disabled={isFetching}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          {isFetching ? 'Fetching...' : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedUpdates.map((update, index) => (
          <div 
            key={update.id || `win-update-${index}`} 
            className="border p-4 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onUpdateClick(update)}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-blue-700 flex items-center gap-1">
                  {update.title || "Untitled Update"}
                </h3>
                
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>{formatDate(update.lastModifiedDate)}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="flex gap-1 items-center bg-blue-50 text-blue-700 border-blue-200">
                    <Monitor size={10} />
                    {update.productName || "Windows"}
                  </Badge>
                  {update.status && (
                    <Badge variant="outline" className="flex gap-1 items-center bg-purple-50 text-purple-700 border-purple-200">
                      <FileText size={10} />
                      {update.status}
                    </Badge>
                  )}
                </div>
                
                <p className="mt-3 text-gray-700 line-clamp-3">{update.description || "No description available."}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default WindowsUpdatesContent;
