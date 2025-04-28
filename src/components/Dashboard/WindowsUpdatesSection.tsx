
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, AlertCircle, CheckCircle } from 'lucide-react';
import { WindowsUpdate } from '@/utils/types';

interface WindowsUpdatesSectionProps {
  activeWindowsIssues: WindowsUpdate[];
  resolvedWindowsIssues: WindowsUpdate[];
}

const WindowsUpdatesSection = ({ 
  activeWindowsIssues,
  resolvedWindowsIssues 
}: WindowsUpdatesSectionProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-border">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Monitor className="h-5 w-5" />
        Windows Updates
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
  );
};

export default WindowsUpdatesSection;
