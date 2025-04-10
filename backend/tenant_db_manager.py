
import sqlite3
import os
import sys
import json
from datetime import datetime
import pandas as pd
import requests
import io
import glob

# List of known trial SKUs
TRIAL_SKUS = [
    "DEVELOPERPACK_E5",
    "ENTERPRISEPREMIUM_TRIAL",
    "ENTERPRISEPACK_TRIAL",
    "FLOW_FREE",
    "POWER_BI_STANDARD",
    "TEAMS_EXPLORATORY"
]

def get_tenant_db_connection():
    """Get a connection to the tenant configuration database."""
    conn = sqlite3.connect('chanakya.db')
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def fetch_tenants():
    """Fetch all tenants from the tenant configuration database."""
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tenants")
    tenants = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tenants

def get_tenant_database_path(tenant_name, tenant_id):
    """Get the path for a tenant-specific database."""
    # Replace spaces and special characters for filename safety
    safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name)
    return f"{safe_name}_{tenant_id}.db"

def get_tenant_service_announcements_db_path(tenant_id):
    """Get the path for a tenant-specific service announcements database."""
    return f"service_announcements_{tenant_id}.db"

def find_tenant_databases(tenant_id):
    """Find all databases related to a specific tenant.
    
    Returns a dictionary mapping database types to paths.
    """
    databases = {}
    
    # Get tenant details from chanakya.db to have both IDs
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    # If tenant is found, we have both internal ID and Microsoft tenant ID
    if tenant:
        ms_tenant_id = tenant['tenantId']
        tenant_name = tenant['name']
        safe_name = ''.join(c if c.isalnum() else '_' for c in tenant_name)
        
        # Check for exact database match first
        tenant_db_exact = f"{safe_name}_{ms_tenant_id}.db"
        if os.path.exists(tenant_db_exact):
            databases['tenant'] = tenant_db_exact
            print(f"Found exact tenant database: {tenant_db_exact}")
        
        # Look for service announcements database with Microsoft tenant ID
        sa_path_ms = f"service_announcements_{ms_tenant_id}.db"
        if os.path.exists(sa_path_ms):
            databases['service_announcements'] = sa_path_ms
    
    # Look for service announcements database with internal ID
    sa_path = get_tenant_service_announcements_db_path(tenant_id)
    if os.path.exists(sa_path):
        databases['service_announcements'] = sa_path
    
    # If tenant database not found yet, look for pattern matches
    if 'tenant' not in databases:
        # Try with internal ID first
        tenant_dbs = glob.glob(f"*_{tenant_id}.db")
        for db_path in tenant_dbs:
            if 'service_announcements' not in db_path:
                databases['tenant'] = db_path
                break
        
        # If not found and we have tenant details, try with MS tenant ID
        if 'tenant' not in databases and tenant:
            tenant_dbs = glob.glob(f"*_{ms_tenant_id}.db")
            for db_path in tenant_dbs:
                if 'service_announcements' not in db_path:
                    databases['tenant'] = db_path
                    break
    
    # If still not found, try broader pattern
    if 'tenant' not in databases:
        for db_path in glob.glob(f"*{tenant_id}*.db"):
            if 'service_announcements' not in db_path and db_path not in databases.values():
                databases['tenant'] = db_path
                break
        
        # Try with MS tenant ID if available
        if 'tenant' not in databases and tenant:
            for db_path in glob.glob(f"*{ms_tenant_id}*.db"):
                if 'service_announcements' not in db_path and db_path not in databases.values():
                    databases['tenant'] = db_path
                    break
    
    print(f"Found databases for tenant {tenant_id}: {databases}")
    return databases

def initialize_tenant_database(tenant, skip_service_announcements=False):
    """Create or update the database structure for a tenant."""
    tenant_name = tenant["name"]
    tenant_id = tenant["tenantId"]
    db_path = get_tenant_database_path(tenant_name, tenant_id)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create updates table (formerly announcements)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS updates (
            id TEXT PRIMARY KEY,
            title TEXT,
            category TEXT,
            severity TEXT,
            startDateTime TEXT DEFAULT '',
            lastModifiedDateTime TEXT DEFAULT '',
            isMajorChange TEXT,
            actionRequiredByDateTime TEXT DEFAULT '',
            services TEXT DEFAULT '',
            hasAttachments BOOLEAN,
            roadmapId TEXT DEFAULT '',
            platform TEXT DEFAULT '',
            status TEXT DEFAULT '',
            lastUpdateTime TEXT DEFAULT '',
            bodyContent TEXT DEFAULT '',
            tags TEXT DEFAULT ''
        )
    """)
    
    # Create licenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS licenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_sku TEXT,
            display_name TEXT,
            type TEXT,
            total_licenses INTEGER,
            used_licenses INTEGER,
            unused_licenses INTEGER,
            renewal_expiration_date TEXT,
            captured_date TEXT
        )
    """)
    
    # Create inactive_users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inactive_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_principal_name TEXT,
            display_name TEXT,
            account_enabled BOOLEAN,
            last_sign_in_attempt TEXT,
            last_successful_sign_in TEXT,
            captured_date TEXT
        )
    """)
    
    # Create over_licensed_users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS over_licensed_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            display_name TEXT,
            user_principal_name TEXT,
            licenses TEXT,
            captured_date TEXT
        )
    """)
    
    # Create m365_news table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS m365_news (
            id TEXT PRIMARY KEY,
            title TEXT,
            published_date TEXT,
            link TEXT,
            summary TEXT,
            categories TEXT,
            fetch_date TEXT
        )
    """)
    
    # Create windows_products table with group_name and friendly_names columns
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS windows_products (
            id TEXT PRIMARY KEY,
            name TEXT,
            group_name TEXT,
            friendly_names TEXT
        )
    """)
    
    # Create windows_known_issues table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS windows_known_issues (
            id TEXT PRIMARY KEY,
            product_id TEXT,
            title TEXT,
            description TEXT,
            status TEXT,
            start_date TEXT,
            resolved_date TEXT,
            web_view_url TEXT,
            FOREIGN KEY (product_id) REFERENCES windows_products (id)
        )
    """)
    
    conn.commit()
    conn.close()
    
    print(f"Initialized database for tenant: {tenant_name} (ID: {tenant_id}) at {db_path}")
    return db_path

def get_access_token(tenant):
    """Get an access token for a specific tenant using MSAL."""
    import msal
    
    CLIENT_ID = tenant["applicationId"]
    TENANT_ID = tenant["tenantId"]
    CLIENT_SECRET = tenant["applicationSecret"]
    AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
    
    try:
        # Create MSAL client application
        app = msal.ConfidentialClientApplication(
            CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
        )

        # Acquire an access token
        result = app.acquire_token_silent(["https://graph.microsoft.com/.default"], account=None)
        if not result:
            print("Fetching new token...")
            result = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])

        if "access_token" not in result:
            print(f"Error: {result.get('error')}")
            print(f"Error description: {result.get('error_description')}")
            return None
        
        return result["access_token"]
    except Exception as e:
        print(f"Error getting access token: {e}")
        return None

def get_translation_table():
    """Get the translation table for SKU IDs to human-readable names."""
    try:
        url = "https://download.microsoft.com/download/e/3/e/e3e9faf2-f28b-490a-9ada-c6089a1fc5b0/Product%20names%20and%20service%20plan%20identifiers%20for%20licensing.csv"
        response = requests.get(url)
        response.raise_for_status()
        return pd.read_csv(io.StringIO(response.text))
    except Exception as e:
        print(f"Error fetching translation table: {e}")
        return pd.DataFrame(columns=['GUID', 'Product_Display_Name'])  # Return empty DataFrame

def get_tenant_details(tenant_id):
    """Get tenant details from the tenant configuration database."""
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    if tenant:
        return dict(tenant)
    return None
