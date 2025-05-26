
import os
import json
from typing import Optional, Dict, Any, List
from .azure_db_config import AzureSQLConfig, TenantTableManager

# Global instances
azure_config = None
table_manager = None

def get_azure_config():
    """Get Azure SQL configuration instance."""
    global azure_config
    if azure_config is None:
        azure_config = AzureSQLConfig()
    return azure_config

def get_table_manager():
    """Get tenant table manager instance."""
    global table_manager
    if table_manager is None:
        table_manager = TenantTableManager(get_azure_config())
    return table_manager

def get_db_connection():
    """Get a connection to the Azure SQL database."""
    return get_azure_config().get_connection()

def init_db():
    """Initialize main database tables (tenants and azure_accounts)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create main tenants table
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tenants' AND xtype='U')
            CREATE TABLE tenants (
                id NVARCHAR(255) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                tenantId NVARCHAR(255) NOT NULL,
                applicationId NVARCHAR(255) NOT NULL,
                applicationSecret NVARCHAR(255) NOT NULL,
                isActive BIT NOT NULL,
                dateAdded NVARCHAR(100) NOT NULL
            )
        ''')
        
        # Create main Azure accounts table
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='azure_accounts' AND xtype='U')
            CREATE TABLE azure_accounts (
                id NVARCHAR(255) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                subscriptionId NVARCHAR(255) NOT NULL,
                tenantId NVARCHAR(255) NOT NULL,
                clientId NVARCHAR(255) NOT NULL,
                clientSecret NVARCHAR(255) NOT NULL,
                isActive BIT NOT NULL,
                dateAdded NVARCHAR(100) NOT NULL
            )
        ''')
        
        # Create notification_settings table
        cursor.execute('''
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_settings' AND xtype='U')
            CREATE TABLE notification_settings (
                id NVARCHAR(255) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                email NVARCHAR(255) NOT NULL,
                tenants NVARCHAR(MAX) NOT NULL,
                update_types NVARCHAR(MAX) NOT NULL,
                frequency NVARCHAR(50) NOT NULL,
                created_at NVARCHAR(100) NOT NULL,
                updated_at NVARCHAR(100) NOT NULL
            )
        ''')
        
        conn.commit()
        print("Main database tables initialized successfully")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

def find_tenant_database(tenant_id, prefer_service_announcements=False):
    """Find tenant information and return table prefix.
    
    Since we're using a single database with table prefixes,
    this function now returns the tenant info for table name generation.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
        tenant = cursor.fetchone()
        
        if tenant:
            # Convert pyodbc.Row to dictionary
            tenant_dict = {
                'id': tenant[0],
                'name': tenant[1],
                'tenantId': tenant[2],
                'applicationId': tenant[3],
                'applicationSecret': tenant[4],
                'isActive': bool(tenant[5]),
                'dateAdded': tenant[6]
            }
            return tenant_dict
        
        return None
        
    except Exception as e:
        print(f"Error finding tenant: {e}")
        return None
    finally:
        cursor.close()
        conn.close()

def get_all_tenant_databases(tenant_id):
    """Get tenant information for table name generation.
    
    Returns a dictionary with tenant info and available table types.
    """
    tenant_info = find_tenant_database(tenant_id)
    if tenant_info:
        return {
            'tenant': tenant_info,
            'service_announcements': tenant_info  # Same tenant, different table prefix
        }
    return {}

def get_tenant_table_connection(tenant_id: str, table_name: str, service_type: str = "m365"):
    """Get connection and table name for tenant-specific operations."""
    tenant_info = find_tenant_database(tenant_id)
    if not tenant_info:
        return None, None
    
    table_manager = get_table_manager()
    full_table_name = table_manager.get_tenant_table_name(tenant_info['name'], table_name, service_type)
    conn = get_db_connection()
    
    return conn, full_table_name

def ensure_tenant_tables_exist(tenant_id: str, service_type: str = "m365"):
    """Ensure that tables exist for a tenant."""
    tenant_info = find_tenant_database(tenant_id)
    if not tenant_info:
        print(f"Tenant not found: {tenant_id}")
        return False
    
    try:
        table_manager = get_table_manager()
        table_manager.create_tenant_tables(tenant_info['name'], tenant_info['tenantId'], service_type)
        return True
    except Exception as e:
        print(f"Error ensuring tenant tables exist: {e}")
        return False
