
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
  fetchTenantUpdates,
  getWindowsUpdates,
  fetchWindowsUpdates
} from './updatesOperations';

export {
  getLicenseData,
  fetchTenantLicenses
} from './licenseOperations';
