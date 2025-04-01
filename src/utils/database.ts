
// Re-export all database operations from their respective files
// This maintains backwards compatibility for any existing code using the database.ts file

export { initDatabases } from './api';

export {
  getTenants,
  addTenant,
  updateTenant,
  deleteTenant
} from './tenantOperations';

export {
  getAzureAccounts,
  addAzureAccount,
  updateAzureAccount,
  deleteAzureAccount
} from './azureOperations';

export {
  getTenantUpdates,
  fetchTenantUpdates
} from './messageCenterOperations';

export {
  getWindowsUpdates,
  fetchWindowsUpdates
} from './windowsUpdatesOperations';

export {
  getLicenseData,
  fetchTenantLicenses
} from './licenseOperations';

export {
  getM365News,
  fetchM365News
} from './m365NewsOperations';

export {
  getNotificationSettings,
  addNotificationSetting,
  updateNotificationSetting,
  deleteNotificationSetting,
  sendNotification
} from './notificationOperations';

