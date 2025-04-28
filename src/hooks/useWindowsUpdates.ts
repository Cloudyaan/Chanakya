
import { useState, useEffect } from 'react';
import { WindowsUpdate } from '@/utils/types';
import { getWindowsUpdates, fetchWindowsUpdates } from '@/utils/updatesOperations';
import { useToast } from '@/hooks/use-toast';

export const useWindowsUpdates = (tenantId: string | null, autoFetch: boolean = true) => {
  const [windowsUpdates, setWindowsUpdates] = useState<WindowsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (tenantId && autoFetch) {
      loadWindowsUpdates(tenantId);
    } else if (tenantId) {
      // Just set loading to false if we're not auto-fetching
      setIsLoading(false);
    }
  }, [tenantId, autoFetch]);

  const loadWindowsUpdates = async (tenantId: string) => {
    if (!tenantId) return;
    
    setIsLoading(true);
    try {
      console.log('Loading Windows updates for tenant ID:', tenantId);
      const data = await getWindowsUpdates(tenantId);
      console.log('Windows updates loaded:', data);
      setWindowsUpdates(data);
    } catch (error) {
      console.error('Error loading Windows updates:', error);
      toast({
        title: "Error loading Windows updates",
        description: "Could not load Windows update information",
        variant: "destructive",
      });
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
