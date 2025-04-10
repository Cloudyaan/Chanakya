
import requests
import json
import sqlite3
import sys
import os
import argparse

try:
    import msal
except ImportError:
    print("Error: MSAL package is not installed.")
    print("Please install it using: pip install msal")
    sys.exit(1)

from tenant_db_manager import (
    fetch_tenants, initialize_tenant_database, 
    get_access_token, get_tenant_database_path
)

def create_windows_updates_tables(db_path):
    """Create tables for Windows updates data if they don't exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create products table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS windows_products (
            id TEXT PRIMARY KEY,
            name TEXT,
            group_name TEXT,
            friendly_names TEXT
        )
    """)
    
    # Create known issues table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS windows_known_issues (
            id TEXT PRIMARY KEY,
            product_id TEXT,
            title TEXT,
            description TEXT,
            web_view_url TEXT,
            status TEXT,
            start_date TEXT,
            resolved_date TEXT,
            FOREIGN KEY (product_id) REFERENCES windows_products(id)
        )
    """)
    
    conn.commit()
    conn.close()

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

def store_windows_products(db_path, products):
    """Store Windows products in the database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for product in products:
        cursor.execute("""
            INSERT OR REPLACE INTO windows_products 
            (id, name, group_name, friendly_names) 
            VALUES (?, ?, ?, ?)
        """, (
            product.get("id"),
            product.get("name"),
            product.get("groupName"),
            ", ".join(product.get("friendlyNames", []))
        ))
    
    conn.commit()
    conn.close()

def store_known_issues(db_path, product_id, known_issues):
    """Store known issues for a product in the database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    for issue in known_issues:
        cursor.execute("""
            INSERT OR REPLACE INTO windows_known_issues 
            (id, product_id, title, description, web_view_url, status, start_date, resolved_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            issue.get("id"),
            product_id,
            issue.get("title"),
            issue.get("description"),
            issue.get("webViewUrl"),
            issue.get("status"),
            issue.get("startDateTime"),
            issue.get("resolvedDateTime"))
        )
    
    conn.commit()
    conn.close()

def fix_numpy_pandas_compatibility():
    """Fix numpy/pandas compatibility issues by reinstalling packages."""
    try:
        print("Attempting to fix numpy/pandas compatibility issues...")
        # Try importing pandas to check if there's an issue
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
                
                # Reinstall numpy first, then pandas
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

def fetch_data_for_tenant(tenant, fix_compatibility=False):
    """Fetch Windows update data for a specific tenant."""
    tenant_name = tenant["name"]
    tenant_id = tenant["tenantId"]

    print(f"Processing tenant: {tenant_name} (ID: {tenant_id})")
    
    # Fix numpy/pandas compatibility if requested
    if fix_compatibility:
        fix_numpy_pandas_compatibility()
    
    # Get access token
    token = get_access_token(tenant)
    if not token:
        print(f"Failed to get access token for tenant: {tenant_name}")
        return False
    
    # Initialize the tenant database and create tables
    db_path = initialize_tenant_database(tenant)
    create_windows_updates_tables(db_path)
    
    try:
        # Step 1: Fetch all Windows products
        products = fetch_windows_products(token)
        if products is None:
            print("No products retrieved or error occurred.")
            return False
        
        print(f"Retrieved {len(products)} Windows products")
        store_windows_products(db_path, products)
        
        # Step 2: Fetch known issues for each product
        for product in products:
            product_id = product.get("id")
            known_issues = fetch_known_issues_for_product(token, product_id)
            
            if known_issues is not None:
                print(f"Retrieved {len(known_issues)} known issues for product {product_id}")
                store_known_issues(db_path, product_id, known_issues)
            else:
                print(f"No known issues retrieved for product {product_id}")
        
        print(f"Completed processing for tenant: {tenant_name}")
        return True
        
    except Exception as e:
        print(f"Error processing tenant {tenant_name}: {e}")
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
        tenants = fetch_tenants()
        matching_tenant = next((t for t in tenants if t['id'] == tenant_id), None)
        
        if matching_tenant:
            print(f"Processing single tenant: {matching_tenant['name']}")
            fetch_data_for_tenant(matching_tenant, args.fix_compatibility)
        else:
            print(f"No tenant found with ID: {tenant_id}")
    else:
        # Process all tenants
        tenants = fetch_tenants()
        if not tenants:
            print("No tenants found in the database.")
            return
            
        print(f"Found {len(tenants)} tenants to process.")
        for tenant in tenants:
            fetch_data_for_tenant(tenant, args.fix_compatibility)

if __name__ == "__main__":
    main()
