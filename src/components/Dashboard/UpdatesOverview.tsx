
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import { MessageSquare, Monitor, AlertCircle, BellRing, CheckCircle, Clock } from 'lucide-react';

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
    (!u.actionType && u.severity === 'Medium')
  ).length;
  
  const actionRequiredUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Action Required' ||
    (!u.actionType && u.severity === 'High')
  ).length;
  
  // Count Windows updates by status
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating'
  ).length;
  
  const resolvedWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'resolved' || 
    u.status?.toLowerCase() === 'completed'
  ).length;
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-border mb-8">
      <h2 className="text-xl font-semibold mb-6">Updates Overview</h2>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Message Center Updates Section */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            Message Center Updates
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
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
            
            <Card>
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
            
            <Card>
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
            
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Message Center Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-green-100">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">{messageCenterUpdates.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Windows Updates Section */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5" />
            Windows Updates
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
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
            
            <Card>
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
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Windows Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-full bg-blue-100">
                    <Monitor className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{windowsUpdates.length}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatesOverview;
