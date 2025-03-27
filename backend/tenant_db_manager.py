
import sqlite3
import os
import sys
import json
from datetime import datetime
import pandas as pd
import requests
import io

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

def initialize_tenant_database(tenant):
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
