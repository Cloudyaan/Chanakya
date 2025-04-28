import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TenantUpdate, WindowsUpdate } from '@/utils/types';
import { MessageSquare, Monitor, AlertCircle, BellRing, Clock, CheckCircle } from 'lucide-react';

interface UpdatesOverviewProps {
  messageCenterUpdates: TenantUpdate[];
  windowsUpdates: WindowsUpdate[];
}

const UpdatesOverview: React.FC<UpdatesOverviewProps> = ({ 
  messageCenterUpdates, 
  windowsUpdates 
}) => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleMessageCenterClick = () => {
    navigate('/microsoft-365/updates', { state: { defaultTab: 'message-center' } });
  };

  const handleWindowsUpdatesClick = () => {
    navigate('/microsoft-365/updates', { state: { defaultTab: 'windows-updates' } });
  };

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
  );
  
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
    .sort((a, b) => {
      // Use startDate instead of lastUpdatedTime
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  // Get the latest action required updates
  const latestActionRequired = actionRequiredUpdates
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Message Center Updates Section */}
      <div 
        onClick={handleMessageCenterClick}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl"
      >
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4 text-gray-800">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Message Center Updates ({messageCenterUpdates.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Informational
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-blue-100">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{informationalUpdates}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Plan for Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-100">
                  <BellRing className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{planForChangeUpdates}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-white hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-red-100">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{actionRequiredUpdates.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Action Required Updates */}
        {latestActionRequired.length > 0 && (
          <Card className="mt-6 border-l-4 border-l-red-500 bg-gradient-to-br from-white to-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                Latest Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {latestActionRequired.map((update) => (
                  <div key={update.id} className="flex gap-3 hover:bg-red-50/50 p-2 rounded-md transition-all duration-300">
                    <div className="w-1 bg-red-500 rounded-full" />
                    <div>
                      <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                        {update.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Windows Updates Section */}
      <div 
        onClick={handleWindowsUpdatesClick}
        className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl"
      >
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4 text-gray-800">
          <Monitor className="h-5 w-5 text-purple-600" />
          Windows Updates ({windowsUpdates.length})
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-white hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{activeWindowsIssues}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-white hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Resolved Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{resolvedWindowsIssues}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Active Windows Issues */}
        {activeIssues.length > 0 && (
          <Card className="mt-6 border-l-4 border-l-amber-500 bg-gradient-to-br from-white to-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-800">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Latest Active Windows Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeIssues.map((update) => (
                  <div key={update.id} className="flex gap-3 hover:bg-amber-50/50 p-2 rounded-md transition-all duration-300">
                    <div className="w-1 bg-amber-500 rounded-full" />
                    <div>
                      <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                        {update.title || 'No title available'}
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
