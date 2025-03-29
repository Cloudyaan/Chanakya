
import sqlite3

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
    """Find tenant-specific database file based on ID."""
    import glob
    
    # Look for database files matching different naming patterns
    patterns = [
        f"service_announcements_{tenant_id}.db",
        f"*_{tenant_id}.db",
        f"*{tenant_id}*.db"
    ]
    
    for pattern in patterns:
        matching_files = glob.glob(pattern)
        if matching_files:
            return matching_files[0]
    
    return None
