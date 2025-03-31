
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

def find_tenant_database(tenant_id):
    """Find tenant-specific database file based on ID.
    
    This function searches for database files in the following order:
    1. service_announcements_{tenant_id}.db
    2. *_{tenant_id}.db
    3. *{tenant_id}*.db
    
    Returns the path to the first matching database file, or None if not found.
    """
    import glob
    
    # Log the current directory for debugging
    print(f"Current directory when searching for tenant database: {os.getcwd()}")
    print(f"Searching for tenant database with ID: {tenant_id}")
    
    # Look for database files matching different naming patterns
    patterns = [
        f"service_announcements_{tenant_id}.db",  # New service announcements DB format
        f"*_{tenant_id}.db",                      # Standard tenant DB format (name_id.db)
        f"*{tenant_id}*.db"                       # Any DB containing the tenant ID
    ]
    
    for pattern in patterns:
        matching_files = glob.glob(pattern)
        if matching_files:
            print(f"Found database: {matching_files[0]} using pattern: {pattern}")
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
    
    # Check for service announcements database
    service_db = f"service_announcements_{tenant_id}.db"
    if os.path.exists(service_db):
        databases['service_announcements'] = service_db
    
    # Check for regular tenant database (using the established pattern)
    tenant_dbs = glob.glob(f"*_{tenant_id}.db")
    for db in tenant_dbs:
        if 'service_announcements' not in db:
            databases['tenant'] = db
            break
    
    print(f"Found databases for tenant {tenant_id}: {databases}")
    return databases
