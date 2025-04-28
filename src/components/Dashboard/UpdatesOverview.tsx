
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import { MessageSquare, AlertCircle } from 'lucide-react';

interface UpdatesOverviewProps {
  messageCenterUpdates: TenantUpdate[];
  windowsUpdates: WindowsUpdate[];
}

const UpdatesOverview: React.FC<UpdatesOverviewProps> = ({ 
  messageCenterUpdates, 
  windowsUpdates 
}) => {
  // Filter Message Center updates by type
  const actionRequiredUpdates = messageCenterUpdates.filter(u => 
    u.actionType === 'Action Required' || 
    (!u.actionType && u.severity === 'High')
  );

  // Filter active Windows issues
  const activeWindowsIssues = windowsUpdates.filter(u => 
    u.status?.toLowerCase() === 'active' || 
    u.status?.toLowerCase() === 'investigating' ||
    u.status?.toLowerCase() === 'confirmed'
  );

  return (
    <div className="space-y-6">
      {/* Message Center Updates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Center Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Latest Action Required Updates */}
            <div>
              <h4 className="text-lg font-medium mb-3">Latest Action Required Updates</h4>
              <div className="space-y-3">
                {actionRequiredUpdates.length > 0 ? (
                  actionRequiredUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-medium text-gray-900">{update.title}</h5>
                      <p className="text-sm text-gray-500 mt-1">
                        {update.description?.length > 150
                          ? `${update.description.substring(0, 150)}...`
                          : update.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No action required updates available</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Windows Updates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Active Windows Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeWindowsIssues.length > 0 ? (
              activeWindowsIssues.map((issue) => (
                <div key={issue.id} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900">{issue.title}</h5>
                  <p className="text-sm text-gray-500 mt-1">
                    {issue.description?.length > 150
                      ? `${issue.description.substring(0, 150)}...`
                      : issue.description}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Status: {issue.status}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No active Windows issues</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatesOverview;
