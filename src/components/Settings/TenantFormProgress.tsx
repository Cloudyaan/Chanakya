
import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type TenantFormProgressProps = {
  isVisible: boolean;
  progress: number;
  message: string;
  isComplete: boolean;
};

const TenantFormProgress: React.FC<TenantFormProgressProps> = ({
  isVisible,
  progress,
  message,
  isComplete,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          {isComplete ? (
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          ) : (
            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isComplete ? 'Configuration Saved!' : 'Saving Configuration...'}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          
          <Progress value={progress} className="mb-4" />
          
          <p className="text-xs text-gray-500">{progress}% complete</p>
        </div>
      </div>
    </div>
  );
};

export default TenantFormProgress;
