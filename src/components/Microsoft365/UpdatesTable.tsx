
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { InfoIcon, ClockIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const getBadgeVariant = (actionType: string | undefined) => {
    if (!actionType) return 'default';
    if (actionType === 'Action Required') return 'destructive';
    if (actionType === 'Plan for Change') return 'purple';
    return 'default';
  };
  
  const getBadgeIcon = (actionType: string | undefined) => {
    if (actionType === 'Action Required') return <AlertTriangle size={12} />;
    return <InfoIcon size={12} />;
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  const formatCategory = (category: string | undefined): string => {
    if (!category) return 'General';
    switch (category) {
      case 'stayInformed':
        return 'Stay Informed';
      case 'planForChange':
        return 'Plan For Change';
      case 'preventOrFixIssue':
        return 'Prevent Or Fix Issue';
      default:
        return category.replace(/([A-Z])/g, ' $1').trim();
    }
  };
  
  return (
    <Card>
      <CardHeader className="sticky top-[200px] z-40 bg-background pb-2 flex flex-row items-center justify-between">
        <CardTitle>Message Center Announcements</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="flex items-center gap-1">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-30 bg-background">
              <TableRow>
                <TableHead className="w-[150px]">Action Type</TableHead>
                <TableHead className="w-[150px]">Category</TableHead>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-[180px] text-right">Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {updates.map(update => {
                const isPlanForChange = update.actionType === 'Plan for Change';
                const isNotStayInformed = update.category !== 'stayInformed';
                return (
                  <TableRow 
                    key={update.id} 
                    className={cn(
                      "group hover:bg-muted/50 cursor-pointer", 
                      isPlanForChange && "bg-purple-50", 
                      isNotStayInformed && !isPlanForChange && "bg-purple-50/70"
                    )} 
                    onClick={() => onUpdateClick(update)}
                  >
                    <TableCell>
                      <Badge variant={getBadgeVariant(update.actionType)} className="flex gap-1 items-center">
                        {getBadgeIcon(update.actionType)}
                        {update.actionType || 'Informational'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isPlanForChange ? (
                        <Badge className="bg-purple-600 text-white hover:bg-purple-700 font-medium">
                          {formatCategory(update.category)}
                        </Badge>
                      ) : isNotStayInformed ? (
                        <Badge className="bg-purple-500 text-white hover:bg-purple-600 font-medium">
                          {formatCategory(update.category)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {formatCategory(update.category)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {update.messageId || update.id}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        isPlanForChange && "text-purple-800", 
                        isNotStayInformed && !isPlanForChange && "text-purple-700"
                      )}>
                        {update.title}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <ClockIcon size={14} />
                        <span className="text-sm">{formatDate(update.publishedDate)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdatesTable;
