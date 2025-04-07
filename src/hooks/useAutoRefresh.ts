import { useEffect, useRef, useState } from 'react';

// Make the RefreshFunction type more flexible to accept different return types
type RefreshFunction = (...args: any[]) => any;

/**
 * Hook to automatically refresh data at specified intervals
 * @param refreshFunction The function to call for refreshing data
 * @param intervalMinutes The interval in minutes between refreshes
 * @param enabled Whether the auto-refresh is enabled
 * @param delay Optional delay in minutes before the first scheduled refresh
 * @returns Last refresh timestamp
 */
export const useAutoRefresh = (
  refreshFunction: RefreshFunction,
  intervalMinutes: number = 5,
  enabled: boolean = true,
  delay: number = 0
): Date | null => {
  // Use ref to keep track of the interval ID
  const intervalRef = useRef<number | null>(null);
  
  // Track last refresh time
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Use ref to store the refresh function to avoid dependency issues
  const refreshFunctionRef = useRef<RefreshFunction>(refreshFunction);
  
  // Update the ref if the function changes
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

  // Function to execute refresh and update timestamp
  const executeRefresh = async () => {
    await refreshFunctionRef.current();
    setLastRefreshTime(new Date());
  };

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Only set up interval if enabled
    if (enabled) {
      console.log(`Setting up auto-refresh every ${intervalMinutes} minutes with ${delay} minutes initial delay`);
      
      // Initial delay before first scheduled refresh
      if (delay > 0) {
        const initialDelayMs = delay * 60 * 1000;
        const initialTimeoutId = setTimeout(() => {
          console.log(`Executing first scheduled refresh after ${delay} minutes delay`);
          executeRefresh();
        }, initialDelayMs);
        
        // Clean up timeout if component unmounts during delay
        return () => clearTimeout(initialTimeoutId);
      }
      
      // Set up the interval
      const intervalMs = intervalMinutes * 60 * 1000;
      intervalRef.current = window.setInterval(() => {
        console.log(`Auto-refreshing data every ${intervalMinutes} minutes`);
        executeRefresh();
      }, intervalMs);
      
      // Clean up the interval on unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [intervalMinutes, enabled, delay]);

  return lastRefreshTime;
};
