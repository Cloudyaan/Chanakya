
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { InfoIcon, ClockIcon, AlertTriangle } from 'lucide-react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UpdatesTableProps {
  updates: TenantUpdate[];
  onUpdateClick: (update: TenantUpdate) => void;
}

const UpdatesTable = ({ updates, onUpdateClick }: UpdatesTableProps) => {
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
    
    // Handle specific category formatting
    switch(category) {
      case 'stayInformed':
        return 'Stay Informed';
      case 'planForChange':
        return 'Plan For Change';
      case 'preventOrFixIssue':
        return 'Prevent Or Fix Issue';
      default:
        // For any other categories, add spaces before capital letters
        return category.replace(/([A-Z])/g, ' $1').trim();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Message Center Announcements</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Action Type</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[120px]">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[180px] text-right">Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => {
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
                    <Badge 
                      variant={getBadgeVariant(update.actionType)}
                      className="flex gap-1 items-center"
                    >
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
                      "font-medium",
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
      </CardContent>
    </Card>
  );
};

export default UpdatesTable;
