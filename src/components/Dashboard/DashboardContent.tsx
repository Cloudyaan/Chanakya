
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import TenantInfo from './TenantInfo';
import UpdatesOverview from './UpdatesOverview';
import { Tenant } from '@/utils/types';
import { useMessageCenterUpdates } from '@/hooks/useMessageCenterUpdates';
import { useWindowsUpdates } from '@/hooks/useWindowsUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Monitor, AlertCircle } from 'lucide-react';

interface DashboardContentProps {
  tenant: Tenant;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ tenant }) => {
  const { 
    messageCenterUpdates,
    actionRequiredUpdates,
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

  // Debug logging to check if data is being received
  useEffect(() => {
    console.log("Dashboard receiving message center updates:", messageCenterUpdates?.length || 0);
    console.log("Dashboard receiving action required updates:", actionRequiredUpdates?.length || 0);
    console.log("Dashboard receiving windows updates:", windowsUpdates?.length || 0);
    console.log("Dashboard receiving active windows issues:", activeWindowsIssues?.length || 0);
  }, [messageCenterUpdates, actionRequiredUpdates, windowsUpdates, activeWindowsIssues]);

  return (
    <div className="space-y-8">
      {/* Enhanced Tenant Info Card with all update information */}
      <TenantInfo 
        tenant={tenant}
        messageCenterUpdates={messageCenterUpdates}
        windowsUpdates={windowsUpdates}
      />
      
      {/* Message Center Updates Section */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Message Center Updates
        </h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-muted-foreground mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            Latest Action Required Updates
          </h3>
          
          {actionRequiredUpdates?.length > 0 ? (
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
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-md">
              No action required updates available
            </div>
          )}
        </div>
      </div>
      
      {/* Windows Updates Section */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Windows Updates
        </h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium text-muted-foreground mb-3 flex items-center">
            <AlertCircle className="h-4 w-4 text-amber-600 mr-2" />
            Active Windows Issues
          </h3>
          
          {activeWindowsIssues?.length > 0 ? (
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
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-gray-50 rounded-md">
              No active Windows issues available
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed breakdown section below */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Detailed Updates Breakdown</h2>
        <UpdatesOverview 
          messageCenterUpdates={messageCenterUpdates} 
          windowsUpdates={windowsUpdates}
        />
      </div>
    </div>
  );
};

export default DashboardContent;
