
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
  );
};

export default DashboardOverview;
