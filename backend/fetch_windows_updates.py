
import requests
import json
import sys
import os
import argparse
from datetime import datetime

try:
    import msal
except ImportError:
    print("Error: MSAL package is not installed.")
    print("Please install it using: pip install msal")
    sys.exit(1)

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist

def get_tenant_connection_and_tables(tenant_id):
    """Get tenant database connection and table names for Windows updates."""
    # Get main database connection to find tenant
    main_conn = get_db_connection()
    cursor = main_conn.cursor()
    
    # Find the tenant
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    main_conn.close()
    
    if not tenant:
        print(f"Error: No tenant found with ID {tenant_id}")
        return None, None, None, None
    
    # Convert pyodbc.Row to dictionary for easier access
    tenant_dict = {
        'id': tenant[0],
        'name': tenant[1],
        'tenantId': tenant[2],
        'applicationId': tenant[3],
        'applicationSecret': tenant[4],
        'isActive': bool(tenant[5]),
        'dateAdded': tenant[6]
    }
    
    # Ensure tenant tables exist
    table_exists = ensure_tenant_tables_exist(tenant_dict['id'], 'm365')
    if not table_exists:
        print(f"Failed to ensure tables exist for tenant: {tenant_dict['name']} (ID: {tenant_id})")
        return None, None, None, None
    
    # Get connections for both products and issues tables
    conn, issues_table = get_tenant_table_connection(tenant_dict['id'], 'windows_known_issues', 'm365')
    
    # Generate products table name manually since it's not in the standard list
    from app.database import get_table_manager
    table_manager = get_table_manager()
    products_table = table_manager.get_table_name(tenant_dict['name'], 'windows_products')
    
    return conn, issues_table, products_table, tenant_dict

def create_windows_products_table(conn, table_name):
    """Create Windows products table if it doesn't exist."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '{table_name}')
            BEGIN
                CREATE TABLE {table_name} (
                    id NVARCHAR(255) PRIMARY KEY,
                    name NVARCHAR(MAX),
                    group_name NVARCHAR(MAX),
                    friendly_names NVARCHAR(MAX)
                )
            END
        """)
        conn.commit()
        print(f"Ensured Windows products table {table_name} exists")
    except Exception as e:
        print(f"Error creating Windows products table: {str(e)}")
        raise

def fetch_windows_products(token):
    """Fetch all Windows products from the Microsoft Graph API."""
    endpoint = "https://graph.microsoft.com/beta/admin/windows/updates/products"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        return response.json().get("value", [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching Windows products: {e}")
        return None

def fetch_known_issues_for_product(token, product_id):
    """Fetch known issues for a specific Windows product."""
    endpoint = f"https://graph.microsoft.com/beta/admin/windows/updates/products/{product_id}/knownIssues"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(endpoint, headers=headers)
        response.raise_for_status()
        return response.json().get("value", [])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching known issues for product {product_id}: {e}")
        return None

def store_windows_products(conn, table_name, products):
    """Store Windows products in the Azure SQL database."""
    cursor = conn.cursor()
    
    for product in products:
        try:
            cursor.execute(f"""
                IF EXISTS (SELECT 1 FROM {table_name} WHERE id = ?)
                    UPDATE {table_name} SET name = ?, group_name = ?, friendly_names = ? WHERE id = ?
                ELSE
                    INSERT INTO {table_name} (id, name, group_name, friendly_names) VALUES (?, ?, ?, ?)
            """, (
                product.get("id"),
                product.get("name"),
                product.get("groupName"),
                ", ".join(product.get("friendlyNames", [])),
                product.get("id"),
                product.get("id"),
                product.get("name"),
                product.get("groupName"),
                ", ".join(product.get("friendlyNames", []))
            ))
        except Exception as e:
            print(f"Error storing product {product.get('id')}: {e}")
    
    conn.commit()

def store_known_issues(conn, table_name, product_id, known_issues):
    """Store known issues for a product in the Azure SQL database."""
    cursor = conn.cursor()
    
    for issue in known_issues:
        try:
            cursor.execute(f"""
                IF EXISTS (SELECT 1 FROM {table_name} WHERE id = ?)
                    UPDATE {table_name} SET 
                        product_id = ?, title = ?, description = ?, status = ?,
                        start_date = ?, resolved_date = ?, web_view_url = ?
                    WHERE id = ?
                ELSE
                    INSERT INTO {table_name} 
                    (id, product_id, title, description, status, start_date, resolved_date, web_view_url) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                issue.get("id"),
                product_id,
                issue.get("title"),
                issue.get("description"),
                issue.get("status"),
                issue.get("startDateTime"),
                issue.get("resolvedDateTime"),
                issue.get("webViewUrl"),
                issue.get("id"),
                issue.get("id"),
                product_id,
                issue.get("title"),
                issue.get("description"),
                issue.get("status"),
                issue.get("startDateTime"),
                issue.get("resolvedDateTime"),
                issue.get("webViewUrl")
            ))
        except Exception as e:
            print(f"Error storing issue {issue.get('id')}: {e}")
    
    conn.commit()

def get_access_token(tenant):
    """Get an access token for a specific tenant using MSAL."""
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

def fix_numpy_pandas_compatibility():
    """Fix numpy/pandas compatibility issues by reinstalling packages."""
    try:
        print("Attempting to fix numpy/pandas compatibility issues...")
        try:
            import pandas
            print("Pandas imported successfully, no fix needed.")
            return True
        except ValueError as e:
            if "numpy.dtype size changed" in str(e):
                print("NumPy and pandas version incompatibility detected.")
                print("Reinstalling numpy and pandas...")
                
                import subprocess
                import sys
                
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "numpy"])
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--force-reinstall", "pandas"])
                print("Successfully reinstalled numpy and pandas")
                return True
            else:
                print(f"Unexpected pandas import error: {e}")
                return False
        except Exception as e:
            print(f"Error importing pandas: {e}")
            return False
    except Exception as e:
        print(f"Error fixing numpy/pandas compatibility: {e}")
        return False

def fetch_data_for_tenant(tenant_id, fix_compatibility=False):
    """Fetch Windows update data for a specific tenant."""
    # Fix numpy/pandas compatibility if requested
    if fix_compatibility:
        fix_numpy_pandas_compatibility()
    
    # Get tenant connection and table names
    conn, issues_table, products_table, tenant = get_tenant_connection_and_tables(tenant_id)
    if not conn or not tenant:
        print(f"Failed to get database connection for tenant: {tenant_id}")
        return False
    
    tenant_name = tenant["name"]
    print(f"Processing tenant: {tenant_name} (ID: {tenant['tenantId']})")
    
    try:
        # Create products table if it doesn't exist
        create_windows_products_table(conn, products_table)
        
        # Get access token
        token = get_access_token(tenant)
        if not token:
            print(f"Failed to get access token for tenant: {tenant_name}")
            return False
        
        # Step 1: Fetch all Windows products
        products = fetch_windows_products(token)
        if products is None:
            print("No products retrieved or error occurred.")
            return False
        
        print(f"Retrieved {len(products)} Windows products")
        store_windows_products(conn, products_table, products)
        
        # Step 2: Fetch known issues for each product
        for product in products:
            product_id = product.get("id")
            known_issues = fetch_known_issues_for_product(token, product_id)
            
            if known_issues is not None:
                print(f"Retrieved {len(known_issues)} known issues for product {product_id}")
                store_known_issues(conn, issues_table, product_id, known_issues)
            else:
                print(f"No known issues retrieved for product {product_id}")
        
        conn.close()
        print(f"Completed processing for tenant: {tenant_name}")
        return True
        
    except Exception as e:
        print(f"Error processing tenant {tenant_name}: {e}")
        if conn:
            conn.close()
        return False

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Fetch Windows updates data")
    parser.add_argument("tenant_id", nargs="?", help="Process only this tenant ID")
    parser.add_argument("--fix-compatibility", action="store_true", help="Fix numpy/pandas compatibility issues")
    args = parser.parse_args()
    
    # Apply compatibility fix if requested
    if args.fix_compatibility:
        fix_numpy_pandas_compatibility()
    
    # Process specific tenant if provided as argument
    if args.tenant_id:
        tenant_id = args.tenant_id
        print(f"Processing single tenant with ID: {tenant_id}")
        fetch_data_for_tenant(tenant_id, args.fix_compatibility)
    else:
        print("Error: Please provide a tenant ID")
        print("Usage: python fetch_windows_updates.py <tenant_id>")
        sys.exit(1)

if __name__ == "__main__":
    main()
