
import { TenantConfig, AzureConfig } from './types';
import Database from 'better-sqlite3';
import { app } from '@tauri-apps/api';
import * as path from 'path';
import * as fs from 'fs';

// Ensure the database directory exists
let dbPath = './data';
let tenantsDb: Database.Database;
let azureDb: Database.Database;

// Initialize databases
export const initDatabases = async () => {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    // Initialize M365 tenants database
    tenantsDb = new Database(path.join(dbPath, 'tenants.db'));
    tenantsDb.exec(`
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        applicationId TEXT NOT NULL,
        applicationSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        dateAdded TEXT NOT NULL
      )
    `);

    // Initialize Azure accounts database
    azureDb = new Database(path.join(dbPath, 'azure.db'));
    azureDb.exec(`
      CREATE TABLE IF NOT EXISTS azure_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subscriptionId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        clientSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        dateAdded TEXT NOT NULL
      )
    `);

    console.log('Databases initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing databases:', error);
    return false;
  }
};

// M365 Tenant Operations
export const getTenants = (): TenantConfig[] => {
  try {
    const stmt = tenantsDb.prepare('SELECT * FROM tenants');
    const tenants = stmt.all() as TenantConfig[];
    return tenants.map(tenant => ({
      ...tenant,
      isActive: Boolean(tenant.isActive)
    }));
  } catch (error) {
    console.error('Error fetching tenants:', error);
    return [];
  }
};

export const addTenant = (tenant: TenantConfig): boolean => {
  try {
    const stmt = tenantsDb.prepare(`
      INSERT INTO tenants (id, name, tenantId, applicationId, applicationSecret, isActive, dateAdded)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      tenant.id,
      tenant.name,
      tenant.tenantId,
      tenant.applicationId,
      tenant.applicationSecret,
      tenant.isActive ? 1 : 0,
      tenant.dateAdded
    );
    
    return true;
  } catch (error) {
    console.error('Error adding tenant:', error);
    return false;
  }
};

export const updateTenant = (tenant: TenantConfig): boolean => {
  try {
    const stmt = tenantsDb.prepare(`
      UPDATE tenants 
      SET name = ?, tenantId = ?, applicationId = ?, applicationSecret = ?, isActive = ?
      WHERE id = ?
    `);
    
    stmt.run(
      tenant.name,
      tenant.tenantId,
      tenant.applicationId,
      tenant.applicationSecret,
      tenant.isActive ? 1 : 0,
      tenant.id
    );
    
    return true;
  } catch (error) {
    console.error('Error updating tenant:', error);
    return false;
  }
};

export const deleteTenant = (id: string): boolean => {
  try {
    const stmt = tenantsDb.prepare('DELETE FROM tenants WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    console.error('Error deleting tenant:', error);
    return false;
  }
};

// Azure Account Operations
export const getAzureAccounts = (): AzureConfig[] => {
  try {
    const stmt = azureDb.prepare('SELECT * FROM azure_accounts');
    const accounts = stmt.all() as AzureConfig[];
    return accounts.map(account => ({
      ...account,
      isActive: Boolean(account.isActive)
    }));
  } catch (error) {
    console.error('Error fetching Azure accounts:', error);
    return [];
  }
};

export const addAzureAccount = (account: AzureConfig): boolean => {
  try {
    const stmt = azureDb.prepare(`
      INSERT INTO azure_accounts (id, name, subscriptionId, tenantId, clientId, clientSecret, isActive, dateAdded)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      account.id,
      account.name,
      account.subscriptionId,
      account.tenantId,
      account.clientId,
      account.clientSecret,
      account.isActive ? 1 : 0,
      account.dateAdded
    );
    
    return true;
  } catch (error) {
    console.error('Error adding Azure account:', error);
    return false;
  }
};

export const updateAzureAccount = (account: AzureConfig): boolean => {
  try {
    const stmt = azureDb.prepare(`
      UPDATE azure_accounts 
      SET name = ?, subscriptionId = ?, tenantId = ?, clientId = ?, clientSecret = ?, isActive = ?
      WHERE id = ?
    `);
    
    stmt.run(
      account.name,
      account.subscriptionId,
      account.tenantId,
      account.clientId,
      account.clientSecret,
      account.isActive ? 1 : 0,
      account.id
    );
    
    return true;
  } catch (error) {
    console.error('Error updating Azure account:', error);
    return false;
  }
};

export const deleteAzureAccount = (id: string): boolean => {
  try {
    const stmt = azureDb.prepare('DELETE FROM azure_accounts WHERE id = ?');
    stmt.run(id);
    return true;
  } catch (error) {
    console.error('Error deleting Azure account:', error);
    return false;
  }
};
