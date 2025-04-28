
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, AlertCircle, BellRing } from 'lucide-react';
import { TenantUpdate } from '@/utils/types';

interface MessageCenterSectionProps {
  actionRequiredUpdates: TenantUpdate[];
  planForChangeUpdates: TenantUpdate[];
  informationalUpdates: TenantUpdate[];
}

const MessageCenterSection = ({ 
  actionRequiredUpdates,
  planForChangeUpdates,
  informationalUpdates
}: MessageCenterSectionProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Message Center Updates
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{actionRequiredUpdates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Plan for Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{planForChangeUpdates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Informational
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{informationalUpdates.length}</div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-medium text-muted-foreground mb-3">Latest Action Required Updates</h3>
      <Card>
        <CardContent className="p-4">
          <ul className="space-y-3">
            {actionRequiredUpdates.slice(0, 5).map(update => (
              <li key={update.id} className="border-l-2 border-red-500 pl-3 py-1">
                <div className="font-medium">{update.title}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {update.description?.substring(0, 120)}{update.description?.length > 120 ? '...' : ''}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Published: {new Date(update.publishedDate).toLocaleDateString()}
                </div>
              </li>
            ))}
            {actionRequiredUpdates.length === 0 && (
              <li className="text-center py-4 text-muted-foreground">
                No action required updates available
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageCenterSection;
