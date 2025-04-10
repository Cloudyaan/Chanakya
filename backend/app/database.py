
import sqlite3
import glob
import os

def get_db_connection():
    """Get a connection to the tenant configuration database."""
    conn = sqlite3.connect('chanakya.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create M365 tenants table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        applicationId TEXT NOT NULL,
        applicationSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL,
        dateAdded TEXT NOT NULL
    )
    ''')
    
    # Create Azure accounts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS azure_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subscriptionId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        clientSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL,
        dateAdded TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

def find_tenant_database(tenant_id, prefer_service_announcements=False):
    """Find tenant-specific database file based on ID.
    
    Args:
        tenant_id: The ID of the tenant to find database for
        prefer_service_announcements: If True, prioritize service_announcements databases
    
    This function searches for database files in the following order:
    1. *_{tenant_id}.db (standard tenant DB)
    2. *{tenant_id}*.db (any DB containing the tenant ID)
    
    Returns the path to the first matching database file, or None if not found.
    """
    import glob
    
    # Log the current directory for debugging
    print(f"Current directory when searching for tenant database: {os.getcwd()}")
    print(f"Searching for tenant database with ID: {tenant_id}")
    
    # First, try to get the tenant information from chanakya.db
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    # If tenant is found, we can use its name to form a more precise pattern
    if tenant:
        tenant_name = tenant['name']
        # Replace spaces and special characters for filename safety
        safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name)
        tenant_specific_pattern = f"{safe_name}_{tenant['tenantId']}.db"
        print(f"Looking for tenant-specific database: {tenant_specific_pattern}")
        
        if os.path.exists(tenant_specific_pattern):
            print(f"Found exact match for tenant database: {tenant_specific_pattern}")
            return tenant_specific_pattern
    
    # Default priority - regular tenant DB first
    patterns = [
        f"*_{tenant_id}.db",                      # Standard tenant DB format (name_id.db)
        f"*{tenant_id}*.db"                       # Any DB containing the tenant ID
    ]
    
    for pattern in patterns:
        matching_files = glob.glob(pattern)
        if matching_files:
            print(f"Found database: {matching_files[0]} using pattern: {pattern}")
            return matching_files[0]
    
    # Try another approach - look for tenant's Microsoft tenant ID in the chanakya.db
    if tenant:
        ms_tenant_id = tenant['tenantId']
        print(f"Trying with Microsoft tenant ID: {ms_tenant_id}")
        
        # Try patterns with Microsoft tenant ID
        alt_patterns = [
            f"*_{ms_tenant_id}.db",                      # Standard tenant DB format with MS tenant ID
            f"*{ms_tenant_id}*.db"                       # Any DB containing the MS tenant ID
        ]
        
        for pattern in alt_patterns:
            matching_files = glob.glob(pattern)
            if matching_files:
                print(f"Found database using Microsoft tenant ID: {matching_files[0]}")
                return matching_files[0]
    
    # If no database is found, log this information
    print(f"No database found for tenant ID: {tenant_id}")
    return None

def get_all_tenant_databases(tenant_id):
    """Find all database files for a specific tenant ID.
    
    Returns a dictionary mapping database types to file paths.
    """
    import glob
    
    databases = {}
    
    # Get tenant details from chanakya.db
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    # If we have tenant details, try to find databases using both IDs
    if tenant:
        ms_tenant_id = tenant['tenantId']
        tenant_name = tenant['name']
        safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name)
        
        # Look for exact tenant database by name and ID
        tenant_db = f"{safe_name}_{ms_tenant_id}.db"
        if os.path.exists(tenant_db):
            databases['tenant'] = tenant_db
            print(f"Found exact tenant database: {tenant_db}")
    
    # Fallback: check for any databases matching the pattern
    if 'tenant' not in databases:
        tenant_dbs = glob.glob(f"*_{tenant_id}.db")
        for db in tenant_dbs:
            if 'service_announcements' not in db:
                databases['tenant'] = db
                break
        
        # If still not found, try with MS tenant ID if available
        if tenant and 'tenant' not in databases:
            ms_tenant_id = tenant['tenantId']
            tenant_dbs = glob.glob(f"*_{ms_tenant_id}.db")
            for db in tenant_dbs:
                if 'service_announcements' not in db:
                    databases['tenant'] = db
                    break
    
    print(f"Found databases for tenant {tenant_id}: {databases}")
    return databases
