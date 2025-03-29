
import React from 'react';
import { WindowsUpdate } from '@/utils/types';
import { RefreshCw, AlertTriangle, CheckCircle2, HelpCircle, ExternalLink } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WindowsUpdatesTableProps {
  updates: WindowsUpdate[];
  onFetch: () => void;
  isFetching: boolean;
}

const WindowsUpdatesTable = ({ updates, onFetch, isFetching }: WindowsUpdatesTableProps) => {
  // We don't have severity data directly, so we'll determine it based on status
  const getStatusBadge = (status: string | null | undefined) => {
    // Handle null or undefined status
    if (!status) {
      return <Badge variant="outline" className="flex gap-1 items-center">
        <HelpCircle size={12} />
        Unknown
      </Badge>;
    }
    
    switch (status.toLowerCase()) {
      case 'released':
        return <Badge variant="outline" className="flex gap-1 items-center bg-green-100 text-green-800 border-green-300">
          <CheckCircle2 size={12} />
          Released
        </Badge>;
      case 'investigating':
        return <Badge variant="outline" className="flex gap-1 items-center bg-blue-100 text-blue-800 border-blue-300">
          <HelpCircle size={12} />
          Investigating
        </Badge>;
      default:
        return <Badge variant="outline" className="flex gap-1 items-center">
          {status || 'Unknown'}
        </Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  const openExternalLink = (url: string | null | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  console.log('Updates array in WindowsUpdatesTable:', updates); // Debug log

  if (!Array.isArray(updates) || updates.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Windows Updates</CardTitle>
            <CardDescription>Recent Windows updates and known issues</CardDescription>
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
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Windows Updates Available</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            There are no Windows updates or known issues in the database. Click the button below to fetch updates from Microsoft Graph API.
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Windows Updates</CardTitle>
          <CardDescription>Recent Windows updates and known issues</CardDescription>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Product</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[120px] text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => (
              <TableRow 
                key={update.id} 
                className={cn(
                  "group hover:bg-muted/50 cursor-pointer",
                  update.webViewUrl && "hover:underline"
                )}
                onClick={() => update.webViewUrl && openExternalLink(update.webViewUrl)}
              >
                <TableCell>
                  <span className="font-medium">{update.productName || 'Unknown Product'}</span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(update.status)}
                </TableCell>
                <TableCell>
                  <div className="font-medium flex items-center gap-1">
                    {update.title || 'No Title'}
                    {update.webViewUrl && <ExternalLink size={14} className="text-blue-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {update.description || 'No description available'}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatDate(update.startDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default WindowsUpdatesTable;
