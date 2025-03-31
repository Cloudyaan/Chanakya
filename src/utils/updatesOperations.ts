
// Re-export all operations for backward compatibility
import { getTenantUpdates, fetchTenantUpdates } from './messageCenterOperations';
import { getWindowsUpdates, fetchWindowsUpdates } from './windowsUpdatesOperations';
import { getM365News, fetchM365News } from './m365NewsOperations';

// Export the functions from all files to maintain compatibility
export {
  getTenantUpdates,
  fetchTenantUpdates,
  getWindowsUpdates,
  fetchWindowsUpdates,
  getM365News,
  fetchM365News
};
