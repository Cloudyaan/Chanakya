
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
    
    This function searches for database files in the following order (unless prefer_service_announcements is True):
    1. *_{tenant_id}.db (standard tenant DB)
    2. service_announcements_{tenant_id}.db (only if it already exists)
    3. *{tenant_id}*.db (any DB containing the tenant ID)
    
    Returns the path to the first matching database file, or None if not found.
    """
    import glob
    
    # Log the current directory for debugging
    print(f"Current directory when searching for tenant database: {os.getcwd()}")
    print(f"Searching for tenant database with ID: {tenant_id}")
    
    # Look for database files matching different naming patterns
    if prefer_service_announcements:
        # When service announcements are preferred (for message-center source)
        patterns = [
            f"service_announcements_{tenant_id}.db",  # Preferred for service announcements
            f"*_{tenant_id}.db",                      # Standard tenant DB format (name_id.db)
            f"*{tenant_id}*.db"                       # Any DB containing the tenant ID
        ]
    else:
        # Default priority - regular tenant DB first
        patterns = [
            f"*_{tenant_id}.db",                      # Standard tenant DB format (name_id.db)
            f"service_announcements_{tenant_id}.db",  # Service announcements DB (only if exists)
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
