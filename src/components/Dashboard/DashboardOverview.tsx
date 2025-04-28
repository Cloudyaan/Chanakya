
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Monitor } from 'lucide-react';
import { Tenant } from '@/utils/types';

interface DashboardOverviewProps {
  tenant: Tenant;
  totalMessageCenterUpdates: number;
  totalWindowsUpdates: number;
}

const DashboardOverview = ({ 
  tenant, 
  totalMessageCenterUpdates, 
  totalWindowsUpdates 
}: DashboardOverviewProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{tenant.name} Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground">Tenant ID: {tenant.tenantId}</p>
      </div>

      {/* Message Center Updates Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-blue-600 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Message Center Updates Dashboard
        </h3>
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalMessageCenterUpdates}</div>
            <div className="text-sm text-gray-600">Message Center Updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Windows Updates Section */}
      <div>
        <h3 className="text-lg font-medium text-purple-600 mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          Windows Updates Dashboard
        </h3>
        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalWindowsUpdates}</div>
            <div className="text-sm text-gray-600">Windows Updates</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
