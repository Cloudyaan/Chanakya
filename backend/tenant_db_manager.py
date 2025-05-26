
import os
import sys
import json
from datetime import datetime
import pandas as pd
import requests
import io
from app.database import get_db_connection, get_table_manager, get_tenant_table_connection, ensure_tenant_tables_exist

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
    """Get a connection to the main Azure SQL database."""
    return get_db_connection()

def fetch_tenants():
    """Fetch all tenants from the tenant configuration database."""
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tenants")
    tenants = []
    
    for row in cursor.fetchall():
        tenant_dict = {
            'id': row[0],
            'name': row[1],
            'tenantId': row[2],
            'applicationId': row[3],
            'applicationSecret': row[4],
            'isActive': bool(row[5]),
            'dateAdded': row[6]
        }
        tenants.append(tenant_dict)
    
    cursor.close()
    conn.close()
    return tenants

def find_tenant_databases(tenant_id):
    """Find tenant information for table operations.
    
    Returns a dictionary with tenant info.
    """
    conn = get_tenant_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
        tenant = cursor.fetchone()
        
        if tenant:
            tenant_dict = {
                'id': tenant[0],
                'name': tenant[1],
                'tenantId': tenant[2],
                'applicationId': tenant[3],
                'applicationSecret': tenant[4],
                'isActive': bool(tenant[5]),
                'dateAdded': tenant[6]
            }
            
            return {
                'tenant': tenant_dict,
                'service_announcements': tenant_dict
            }
        
        return {}
        
    except Exception as e:
        print(f"Error finding tenant databases: {e}")
        return {}
    finally:
        cursor.close()
        conn.close()

def initialize_tenant_database(tenant, skip_service_announcements=False):
    """Create tenant-specific tables in the Azure SQL database."""
    tenant_name = tenant["name"]
    tenant_id = tenant["tenantId"]
    
    print(f"Initializing tenant tables for: {tenant_name} (ID: {tenant_id})")
    
    try:
        # Ensure tables exist for this tenant
        success = ensure_tenant_tables_exist(tenant['id'], 'm365')
        
        if success:
            print(f"Successfully initialized tables for tenant: {tenant_name}")
            return f"Tables created for {tenant_name}"
        else:
            print(f"Failed to initialize tables for tenant: {tenant_name}")
            return None
            
    except Exception as e:
        print(f"Error initializing tenant database: {e}")
        return None

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
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if tenant:
        return {
            'id': tenant[0],
            'name': tenant[1],
            'tenantId': tenant[2],
            'applicationId': tenant[3],
            'applicationSecret': tenant[4],
            'isActive': bool(tenant[5]),
            'dateAdded': tenant[6]
        }
    return None
