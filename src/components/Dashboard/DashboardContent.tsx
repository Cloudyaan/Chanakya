import React from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Monitor, AlertCircle, BellRing, CheckCircle } from 'lucide-react';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { 
    messageCenterUpdates,
    actionRequiredUpdates,
    planForChangeUpdates,
    informationalUpdates,
    isLoading: messageIsLoading 
  } = useMessageCenterUpdates(tenant.tenantId);
  
  const { 
    windowsUpdates,
    isLoading: windowsIsLoading 
  } = useWindowsUpdates(tenant.tenantId);

  // Get active Windows issues
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating' || 
    u.status?.toLowerCase() === 'confirmed'
  );

  const resolvedWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'resolved' || 
    u.status?.toLowerCase() === 'completed'
  );

  // Show loading state if either data is loading
  if (messageIsLoading || windowsIsLoading) {
    return <div>Loading...</div>;
  }

  // Calculate total updates from database results
  const totalMessageCenterUpdates = messageCenterUpdates.length;
  const totalWindowsUpdates = windowsUpdates.length;

  return (
    <div className="space-y-8">
      {/* First Display Card - Tenant Overview */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">{tenant.name} Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">Tenant ID: {tenant.tenantId}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Message Center Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalMessageCenterUpdates}</div>
              <div className="text-sm text-gray-600">Total Updates</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Monitor className="h-5 w-5 text-purple-600" />
                Windows Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{totalWindowsUpdates}</div>
              <div className="text-sm text-gray-600">Total Updates</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second Display Card - Message Center Updates */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Message Center Updates ({messageCenterUpdates.length})
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

      {/* Third Display Card - Windows Updates */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Windows Updates ({windowsUpdates.length})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Active Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{activeWindowsIssues.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Resolved Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedWindowsIssues.length}</div>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-medium text-muted-foreground mb-3">Active Windows Issues</h3>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-3">
              {activeWindowsIssues.slice(0, 5).map(issue => (
                <li key={issue.id} className="border-l-2 border-amber-500 pl-3 py-1">
                  <div className="font-medium">{issue.title || 'Unnamed Issue'}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {issue.description?.substring(0, 120) || 'No description available'}
                    {issue.description?.length > 120 ? '...' : ''}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Status: {issue.status || 'Unknown'} 
                    {issue.startDate && ` • Started: ${new Date(issue.startDate).toLocaleDateString()}`}
                  </div>
                </li>
              ))}
              {activeWindowsIssues.length === 0 && (
                <li className="text-center py-4 text-muted-foreground">
                  No active Windows issues available
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardContent;
