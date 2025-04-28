
import React from 'react';
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
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-border mb-8">
      <div className="grid grid-cols-1 gap-6">
        {/* Message Center Updates Section */}
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <MessageSquare className="h-5 w-5" />
            Message Center Updates
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {messageCenterUpdates.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No message center updates available
              </div>
            ) : (
              <>
                {/* Latest Informational Updates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Latest Informational
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {messageCenterUpdates
                        .filter(u => u.actionType === 'Informational' || (!u.actionType && u.severity === 'Normal'))
                        .slice(0, 3)
                        .map(update => (
                          <li key={update.id} className="text-sm border-l-2 border-blue-500 pl-2">
                            {update.title.length > 60 ? update.title.substring(0, 60) + '...' : update.title}
                          </li>
                        ))}
                      {messageCenterUpdates.filter(u => u.actionType === 'Informational' || (!u.actionType && u.severity === 'Normal')).length === 0 && (
                        <li className="text-sm text-gray-500">No informational updates</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Latest Plan for Change Updates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-amber-600" />
                      Latest Plan for Change
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {messageCenterUpdates
                        .filter(u => u.actionType === 'Plan for Change' || u.actionType === 'planForChange' || (!u.actionType && u.severity === 'Medium'))
                        .slice(0, 3)
                        .map(update => (
                          <li key={update.id} className="text-sm border-l-2 border-amber-500 pl-2">
                            {update.title.length > 60 ? update.title.substring(0, 60) + '...' : update.title}
                          </li>
                        ))}
                      {messageCenterUpdates.filter(u => u.actionType === 'Plan for Change' || u.actionType === 'planForChange' || (!u.actionType && u.severity === 'Medium')).length === 0 && (
                        <li className="text-sm text-gray-500">No plan for change updates</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Latest Action Required Updates */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Latest Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {messageCenterUpdates
                        .filter(u => u.actionType === 'Action Required' || (!u.actionType && u.severity === 'High'))
                        .slice(0, 3)
                        .map(update => (
                          <li key={update.id} className="text-sm border-l-2 border-red-500 pl-2">
                            {update.title.length > 60 ? update.title.substring(0, 60) + '...' : update.title}
                          </li>
                        ))}
                      {messageCenterUpdates.filter(u => u.actionType === 'Action Required' || (!u.actionType && u.severity === 'High')).length === 0 && (
                        <li className="text-sm text-gray-500">No action required updates</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
        
        {/* Windows Updates Section */}
        <div className="mt-4">
          <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5" />
            Windows Updates
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {windowsUpdates.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-gray-500">
                No Windows updates available
              </div>
            ) : (
              <>
                {/* Active Windows Issues */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Active Windows Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {windowsUpdates
                        .filter(u => u.status?.toLowerCase() === 'active' || u.status?.toLowerCase() === 'investigating' || u.status?.toLowerCase() === 'confirmed')
                        .slice(0, 3)
                        .map(update => (
                          <li key={update.id} className="text-sm border-l-2 border-amber-500 pl-2">
                            {update.title && update.title.length > 60 ? update.title.substring(0, 60) + '...' : (update.title || 'Unnamed update')}
                          </li>
                        ))}
                      {windowsUpdates.filter(u => u.status?.toLowerCase() === 'active' || u.status?.toLowerCase() === 'investigating' || u.status?.toLowerCase() === 'confirmed').length === 0 && (
                        <li className="text-sm text-gray-500">No active Windows issues</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Resolved Windows Issues */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Resolved Windows Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {windowsUpdates
                        .filter(u => u.status?.toLowerCase() === 'resolved' || u.status?.toLowerCase() === 'completed')
                        .slice(0, 3)
                        .map(update => (
                          <li key={update.id} className="text-sm border-l-2 border-green-500 pl-2">
                            {update.title && update.title.length > 60 ? update.title.substring(0, 60) + '...' : (update.title || 'Unnamed update')}
                          </li>
                        ))}
                      {windowsUpdates.filter(u => u.status?.toLowerCase() === 'resolved' || u.status?.toLowerCase() === 'completed').length === 0 && (
                        <li className="text-sm text-gray-500">No resolved Windows issues</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatesOverview;
