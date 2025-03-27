
import { TenantConfig, AzureConfig } from './types';

// IndexedDB database names and stores
const DB_NAME = 'chanakya-db';
const DB_VERSION = 1;
const TENANTS_STORE = 'tenants';
const AZURE_STORE = 'azure-accounts';

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error("Error opening database:", request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Create M365 tenants object store if it doesn't exist
      if (!db.objectStoreNames.contains(TENANTS_STORE)) {
        const tenantStore = db.createObjectStore(TENANTS_STORE, { keyPath: 'id' });
        tenantStore.createIndex('name', 'name', { unique: false });
        tenantStore.createIndex('isActive', 'isActive', { unique: false });
      }
      
      // Create Azure accounts object store if it doesn't exist
      if (!db.objectStoreNames.contains(AZURE_STORE)) {
        const azureStore = db.createObjectStore(AZURE_STORE, { keyPath: 'id' });
        azureStore.createIndex('name', 'name', { unique: false });
        azureStore.createIndex('isActive', 'isActive', { unique: false });
      }
    };
  });
};

// Initialize databases
export const initDatabases = async (): Promise<boolean> => {
  try {
    await openDB();
    console.log('Databases initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing databases:', error);
    return false;
  }
};

// Generic function to get all items from a store
const getAllItems = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result as T[]);
      };
      
      request.onerror = () => {
        console.error(`Error fetching items from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error accessing ${storeName} store:`, error);
    return [];
  }
};

// Generic function to add an item to a store
const addItem = async <T>(storeName: string, item: T): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        console.error(`Error adding item to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error accessing ${storeName} store:`, error);
    return false;
  }
};

// Generic function to update an item in a store
const updateItem = async <T>(storeName: string, item: T): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        console.error(`Error updating item in ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error accessing ${storeName} store:`, error);
    return false;
  }
};

// Generic function to delete an item from a store
const deleteItem = async (storeName: string, id: string): Promise<boolean> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        console.error(`Error deleting item from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error accessing ${storeName} store:`, error);
    return false;
  }
};

// M365 Tenant Operations
export const getTenants = async (): Promise<TenantConfig[]> => {
  return await getAllItems<TenantConfig>(TENANTS_STORE);
};

export const addTenant = async (tenant: TenantConfig): Promise<boolean> => {
  return await addItem<TenantConfig>(TENANTS_STORE, tenant);
};

export const updateTenant = async (tenant: TenantConfig): Promise<boolean> => {
  return await updateItem<TenantConfig>(TENANTS_STORE, tenant);
};

export const deleteTenant = async (id: string): Promise<boolean> => {
  return await deleteItem(TENANTS_STORE, id);
};

// Azure Account Operations
export const getAzureAccounts = async (): Promise<AzureConfig[]> => {
  return await getAllItems<AzureConfig>(AZURE_STORE);
};

export const addAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  return await addItem<AzureConfig>(AZURE_STORE, account);
};

export const updateAzureAccount = async (account: AzureConfig): Promise<boolean> => {
  return await updateItem<AzureConfig>(AZURE_STORE, account);
};

export const deleteAzureAccount = async (id: string): Promise<boolean> => {
  return await deleteItem(AZURE_STORE, id);
};
