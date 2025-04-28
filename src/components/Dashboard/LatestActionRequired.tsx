
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface LatestActionRequiredProps {
  updates: TenantUpdate[];
}

const LatestActionRequired: React.FC<LatestActionRequiredProps> = ({ updates }) => {
  // Filter and get only action required updates, sorted by date
  const actionRequiredUpdates = updates
    .filter(update => 
      update.actionType === 'Action Required' || 
      (!update.actionType && update.severity === 'High')
    )
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 3); // Get only the latest 3 updates

  if (actionRequiredUpdates.length === 0) {
    return null;
  }

  return (
    <Card className="mt-6 border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Latest Action Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actionRequiredUpdates.map((update) => (
            <div key={update.id} className="flex gap-3 hover:bg-gray-50 p-2 rounded-md transition-colors">
              <div className="w-1 bg-red-500 rounded-full" />
              <div>
                <p className="text-sm text-gray-700 line-clamp-2 font-medium">{update.title}</p>
                <p className="text-xs text-gray-500">
                  {new Date(update.publishedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LatestActionRequired;
