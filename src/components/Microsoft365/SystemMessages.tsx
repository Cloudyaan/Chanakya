
import React from 'react';
import { TenantUpdate } from '@/utils/types';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SystemMessagesProps {
  messages: TenantUpdate[];
  onFetchUpdates: () => void;
  isFetching: boolean;
}

const SystemMessages = ({ messages, onFetchUpdates, isFetching }: SystemMessagesProps) => {
  if (!messages.length) return null;

  return (
    <div className="mb-8">
      {messages.map((message) => (
        <div key={message.id} className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
            <div>
              <p className="font-semibold text-amber-700">{message.title}</p>
              <p className="text-amber-600 mt-1">{message.description}</p>
              <div className="mt-3 flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onFetchUpdates}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw size={14} className="mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Download size={14} className="mr-2" />
                      Fetch Updates Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SystemMessages;
