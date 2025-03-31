
// Re-export all operations for backward compatibility
import { getTenantUpdates, fetchTenantUpdates } from './messageCenterOperations';
import { getWindowsUpdates, fetchWindowsUpdates } from './windowsUpdatesOperations';

// Export the functions from both files to maintain compatibility
export {
  getTenantUpdates,
  fetchTenantUpdates,
  getWindowsUpdates,
  fetchWindowsUpdates
};
