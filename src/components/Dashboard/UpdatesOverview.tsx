
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import { MessageSquare, Monitor, AlertCircle, BellRing, Clock, CheckCircle } from 'lucide-react';
import LatestActionRequired from './LatestActionRequired';

interface UpdatesOverviewProps {
  messageCenterUpdates: TenantUpdate[];
  windowsUpdates: WindowsUpdate[];
}

const UpdatesOverview: React.FC<UpdatesOverviewProps> = ({ 
  messageCenterUpdates, 
  windowsUpdates 
}) => {
  // Count Message Center updates by type
  const informationalUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Informational' || 
    (!u.actionType && u.severity === 'Normal')
  ).length;
  
  const planForChangeUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Plan for Change' ||
    u.actionType === 'planForChange' ||
    (!u.actionType && u.severity === 'Medium')
  ).length;
  
  const actionRequiredUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Action Required' ||
    (!u.actionType && u.severity === 'High')
  ).length;
  
  // Count Windows updates by status
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating' ||
    u.status?.toLowerCase() === 'confirmed'
  ).length;
  
  const resolvedWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'resolved' || 
    u.status?.toLowerCase() === 'completed'
  ).length;

  // Get active windows issues for display
  const activeIssues = windowsUpdates
    .filter(update => 
      update.status?.toLowerCase() === 'active' || 
      update.status?.toLowerCase() === 'investigating' ||
      update.status?.toLowerCase() === 'confirmed'
    )
    .sort((a, b) => new Date(b.lastUpdatedTime || '').getTime() - new Date(a.lastUpdatedTime || '').getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Message Center Updates Section */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          Message Center Updates ({messageCenterUpdates.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Informational
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold">{informationalUpdates}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Plan for Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-amber-100">
                  <BellRing className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold">{planForChangeUpdates}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold">{actionRequiredUpdates}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Action Required Updates */}
        <LatestActionRequired updates={messageCenterUpdates} />
      </div>
      
      {/* Windows Updates Section */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Monitor className="h-5 w-5" />
          Windows Updates ({windowsUpdates.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold">{activeWindowsIssues}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold">{resolvedWindowsIssues}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Active Windows Issues */}
        {activeIssues.length > 0 && (
          <Card className="mt-6 border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Latest Active Windows Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeIssues.map((update) => (
                  <div key={update.id} className="flex gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors">
                    <div className="w-1 bg-amber-500 rounded-full" />
                    <div>
                      <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                        {update.title || 'No title available'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {update.lastUpdatedTime ? new Date(update.lastUpdatedTime).toLocaleDateString() : 'No date available'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UpdatesOverview;
