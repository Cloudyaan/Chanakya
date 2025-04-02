
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import UpdatesLoading from './UpdatesLoading';

interface UpdatesTableProps {
  updates: TenantUpdate[];
  onUpdateClick: (update: TenantUpdate) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isFetching: boolean;
  onFetch: () => void;
}

const UpdatesTable = ({
  updates,
  onUpdateClick,
  onRefresh,
  isLoading,
  isFetching,
  onFetch
}: UpdatesTableProps) => {
  if (isLoading) {
    return <UpdatesLoading />;
  }

  return (
    <Card>
      <CardHeader className="sticky top-[200px] z-10 bg-white flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Message Center</CardTitle>
          <CardDescription>Latest updates from the Microsoft 365 message center</CardDescription>
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
      <CardContent>
        <div className="space-y-2">
          {updates.map((update) => (
            <div 
              key={update.id} 
              onClick={() => onUpdateClick(update)}
              className="p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-medium text-blue-700">{update.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{update.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={update.severity === 'High' ? 'destructive' : 'default'} className="text-xs">
                    {update.severity || 'Normal'}
                  </Badge>
                  {update.publishedDate && (
                    <span className="text-xs text-gray-500">
                      {format(new Date(update.publishedDate), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdatesTable;
