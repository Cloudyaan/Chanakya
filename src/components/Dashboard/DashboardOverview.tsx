
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Monitor, Database, Info } from 'lucide-react';
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
    <div className="grid gap-6">
      {/* Tenant Overview Section */}
      <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h2 className="text-xl font-semibold">{tenant.name} Dashboard Overview</h2>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md inline-flex items-center">
                <Database className="h-3.5 w-3.5 mr-1" />
                Tenant ID: {tenant.tenantId}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Updates Dashboard Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Message Center Updates Section */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
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
              <div className="text-sm text-gray-600 mb-2">Message Center Updates</div>
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md inline-flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Stored in "updates" table
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Windows Updates Section */}
        <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
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
              <div className="text-sm text-gray-600 mb-2">Windows Updates</div>
              <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-md inline-flex items-center">
                <Info className="h-3 w-3 mr-1" />
                Stored in "windows_known_issues" table
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
