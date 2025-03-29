
import React from 'react';
import { WindowsUpdate } from '@/utils/types';
import { RefreshCw, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
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
  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive" className="flex gap-1 items-center">
          <AlertTriangle size={12} />
          Critical
        </Badge>;
      case 'high':
        return <Badge variant="destructive" className="flex gap-1 items-center bg-red-500">
          <AlertTriangle size={12} />
          High
        </Badge>;
      case 'medium':
        return <Badge variant="default" className="flex gap-1 items-center bg-orange-500">
          <AlertTriangle size={12} />
          Medium
        </Badge>;
      case 'low':
        return <Badge variant="default" className="flex gap-1 items-center bg-yellow-500">
          <HelpCircle size={12} />
          Low
        </Badge>;
      default:
        return <Badge variant="secondary" className="flex gap-1 items-center">
          <HelpCircle size={12} />
          {severity || 'Unknown'}
        </Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

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
              <TableHead className="w-[120px]">Severity</TableHead>
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
                  update.severity === 'Critical' && "bg-red-50/30",
                  update.severity === 'High' && "bg-orange-50/30"
                )}
              >
                <TableCell>
                  <span className="font-medium">{update.productName}</span>
                </TableCell>
                <TableCell>
                  {getSeverityBadge(update.severity)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(update.status)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {update.title}
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {update.description}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatDate(update.firstOccurredDate)}
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
