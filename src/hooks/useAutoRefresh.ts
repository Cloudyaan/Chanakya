import { useEffect, useRef } from 'react';

type RefreshFunction = () => void | Promise<void>;

/**
 * Hook to automatically refresh data at specified intervals
 * @param refreshFunction The function to call for refreshing data
 * @param intervalMinutes The interval in minutes between refreshes
 * @param enabled Whether the auto-refresh is enabled
 * @param delay Optional delay in minutes before the first scheduled refresh
 */
export const useAutoRefresh = (
  refreshFunction: RefreshFunction,
  intervalMinutes: number = 5,
  enabled: boolean = true,
  delay: number = 0
): void => {
  // Use ref to keep track of the interval ID
  const intervalRef = useRef<number | null>(null);
  
  // Use ref to store the refresh function to avoid dependency issues
  const refreshFunctionRef = useRef<RefreshFunction>(refreshFunction);
  
  // Update the ref if the function changes
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

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
          refreshFunctionRef.current();
        }, initialDelayMs);
        
        // Clean up timeout if component unmounts during delay
        return () => clearTimeout(initialTimeoutId);
      }
      
      // Set up the interval
      const intervalMs = intervalMinutes * 60 * 1000;
      intervalRef.current = window.setInterval(() => {
        console.log(`Auto-refreshing data every ${intervalMinutes} minutes`);
        refreshFunctionRef.current();
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
};
