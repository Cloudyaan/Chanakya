
import React, { useState, useMemo } from 'react';
import { TenantUpdate } from '@/utils/types';
import { InfoIcon, ClockIcon, AlertTriangle, RefreshCw, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Get unique action types and categories for filters
  const actionTypes = useMemo(() => {
    const types = [...new Set(updates.map(u => u.actionType || 'Informational'))];
    return ['all', ...types];
  }, [updates]);
  
  const categories = useMemo(() => {
    const cats = [...new Set(updates.map(u => u.category || 'General'))];
    return ['all', ...cats];
  }, [updates]);
  
  // Apply filters and sorting to updates
  const filteredAndSortedUpdates = useMemo(() => {
    let filtered = updates.filter(update => {
      const matchesActionType = actionTypeFilter === 'all' || 
        (update.actionType || 'Informational') === actionTypeFilter;
      const matchesCategory = categoryFilter === 'all' || 
        (update.category || 'General') === categoryFilter;
      return matchesActionType && matchesCategory;
    });

    // Sort by publishedDate in descending order (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.publishedDate).getTime();
      const dateB = new Date(b.publishedDate).getTime();
      return dateB - dateA; // Descending order - newest first
    });
  }, [updates, actionTypeFilter, categoryFilter]);

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
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
      <CardHeader className="sticky top-[200px] z-40 bg-background pb-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>Message Center Announcements</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="flex items-center gap-1">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            
            <Select
              value={actionTypeFilter}
              onValueChange={setActionTypeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Action Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : formatCategory(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredAndSortedUpdates.length} of {updates.length} updates
            </div>
          </div>
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
              {filteredAndSortedUpdates.map(update => {
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
