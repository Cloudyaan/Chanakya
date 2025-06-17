
import { useState, useEffect } from 'react';
import { WindowsUpdate } from '@/utils/types';
import { getWindowsUpdates, fetchWindowsUpdates } from '@/utils/updatesOperations';
import { useToast } from '@/hooks/use-toast';

export const useWindowsUpdates = (tenantId: string | null) => {
  const [windowsUpdates, setWindowsUpdates] = useState<WindowsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Load Windows updates on initial mount or tenantId change, but don't show loading toast
  useEffect(() => {
    if (tenantId) {
      loadWindowsUpdates(tenantId, false);
    }
  }, [tenantId]);

  const loadWindowsUpdates = async (tenantId: string, showToast = true) => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      console.log('Loading Windows updates for tenant ID:', tenantId);
      const data = await getWindowsUpdates(tenantId);
      console.log('Windows updates loaded:', data);
      setWindowsUpdates(data);
    } catch (error) {
      console.error('Error loading Windows updates:', error);
      if (showToast) {
        toast({
          title: "Error loading Windows updates",
          description: "Could not load Windows update information",
          variant: "destructive",
        });
      }
      setWindowsUpdates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchWindowsUpdates = async () => {
    if (!tenantId) {
      console.error('No tenant selected');
      toast({
        title: "Error",
        description: "No tenant selected. Please select a tenant first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetching(true);
    try {
      console.log(`Triggering fetch Windows updates for tenant: ${tenantId}`);
      toast({
        title: "Fetching Windows updates...",
        description: "Requesting updates from Microsoft Graph API",
        variant: "default",
      });
      
      const success = await fetchWindowsUpdates(tenantId);
      
      if (success) {
        toast({
          title: "Fetching Windows updates succeeded",
          description: "Windows update data is being retrieved from Microsoft Graph API",
          variant: "default",
        });
        // Reload the data after fetching with a small delay
        setTimeout(() => loadWindowsUpdates(tenantId), 2000);
      } else {
        toast({
          title: "Fetching Windows updates failed",
          description: "Could not fetch Windows update data from Microsoft Graph API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching Windows updates:', error);
      toast({
        title: "Error",
        description: "Failed to trigger Windows update data fetch",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return {
    windowsUpdates,
    isLoading,
    isFetching,
    loadWindowsUpdates,
    handleFetchWindowsUpdates
  };
};
