
import requests
import sqlite3
import sys
import os
import json
from datetime import datetime
import pandas as pd

try:
    import msal
except ImportError:
    print("Error: MSAL package is not installed.")
    print("Please install it using: pip install msal")
    sys.exit(1)

from tenant_db_manager import (
    fetch_tenants, initialize_tenant_database, 
    get_access_token, get_translation_table,
    get_tenant_database_path, TRIAL_SKUS
)

def get_subscribed_skus(token):
    """Get subscribed SKUs for a specific tenant."""
    url = 'https://graph.microsoft.com/v1.0/subscribedSkus'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching subscribed SKUs: {e}")
        return []

def get_all_users(token):
    """Get all users for a specific tenant."""
    url = 'https://graph.microsoft.com/v1.0/users'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    params = {
        '$select': 'id,accountEnabled,displayName,userPrincipalName,signInActivity,assignedLicenses'
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching users: {e}")
        return []

def get_directory_roles(token):
    """Get directory roles for a specific tenant."""
    url = 'https://graph.microsoft.com/v1.0/directoryRoles'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching directory roles: {e}")
        return []

def get_role_members(token, role_id):
    """Get members of a specific directory role."""
    url = f'https://graph.microsoft.com/v1.0/directoryRoles/{role_id}/members'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get('value', [])
    except Exception as e:
        print(f"Error fetching role members: {e}")
        return []

def fetch_license_data_for_tenant(tenant):
    """Fetch and store license data for a specific tenant."""
    tenant_name = tenant["name"]
    tenant_id = tenant["tenantId"]
    print(f"Processing tenant: {tenant_name} (ID: {tenant_id})")
    
    # Get access token
    token = get_access_token(tenant)
    if not token:
        print(f"Failed to get access token for tenant: {tenant_name}")
        return False
    
    # Initialize the tenant database
    db_path = initialize_tenant_database(tenant)
    now = datetime.now().isoformat()
    
    # Connect to the tenant database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Fetch license data
    licenses = get_subscribed_skus(token)
    print(f"Retrieved {len(licenses)} licenses")
    
    # Get translation table for license names
    translation_table = get_translation_table()
    
    # Process and store licenses
    for license in licenses:
        sku_id = license.get('skuId', '')
        sku_part_number = license.get('skuPartNumber', '')
        
        # Look up display name in translation table
        display_name = sku_part_number
        if not translation_table.empty:
            matches = translation_table[translation_table['GUID'] == sku_id]['Product_Display_Name'].values
            if len(matches) > 0:
                display_name = matches[0]
        
        # Determine if the license is a trial
        is_trial = sku_part_number in TRIAL_SKUS
        license_type = 'Trial' if is_trial else 'Paid'
        
        # Get license counts
        total_licenses = license.get('prepaidUnits', {}).get('enabled', 0)
        consumed_units = license.get('consumedUnits', 0)
        unused_licenses = total_licenses - consumed_units
        
        # Get expiration date if available
        renewal_date = license.get('appliesTo', '')
        
        cursor.execute("""
            INSERT INTO licenses 
            (license_sku, display_name, type, total_licenses, used_licenses, unused_licenses, 
             renewal_expiration_date, captured_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sku_part_number,
            display_name,
            license_type,
            total_licenses,
            consumed_units,
            unused_licenses,
            renewal_date,
            now
        ))
    
    # Fetch and store inactive users
    users = get_all_users(token)
    print(f"Retrieved {len(users)} users")
    
    for user in users:
        sign_in_activity = user.get('signInActivity', {})
        if sign_in_activity:
            last_sign_in = sign_in_activity.get('lastSignInDateTime', '')
            last_successful = sign_in_activity.get('lastSuccessfulSignInDateTime', '')
            
            # Only store users who haven't signed in for 90 days
            # This check would be more complex in production
            if last_sign_in:
                cursor.execute("""
                    INSERT INTO inactive_users 
                    (user_principal_name, display_name, account_enabled, 
                     last_sign_in_attempt, last_successful_sign_in, captured_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    user.get('userPrincipalName', ''),
                    user.get('displayName', ''),
                    user.get('accountEnabled', False),
                    last_sign_in,
                    last_successful,
                    now
                ))
    
    # Fetch directory roles and their members
    roles = get_directory_roles(token)
    print(f"Retrieved {len(roles)} directory roles")
    
    for role in roles:
        role_id = role.get('id', '')
        if role_id:
            members = get_role_members(token, role_id)
            for member in members:
                cursor.execute("""
                    INSERT INTO over_licensed_users 
                    (display_name, user_principal_name, licenses, captured_date)
                    VALUES (?, ?, ?, ?)
                """, (
                    member.get('displayName', ''),
                    member.get('userPrincipalName', ''),
                    role.get('displayName', 'Unknown Role'),
                    now
                ))
    
    conn.commit()
    conn.close()
    print(f"Completed license data processing for tenant: {tenant_name}")
    return True

def main():
    # Process specific tenant if provided as argument
    if len(sys.argv) > 1:
        tenant_id = sys.argv[1]
        tenants = fetch_tenants()
        matching_tenant = next((t for t in tenants if t['id'] == tenant_id), None)
        
        if matching_tenant:
            print(f"Processing single tenant: {matching_tenant['name']}")
            fetch_license_data_for_tenant(matching_tenant)
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
            fetch_license_data_for_tenant(tenant)

if __name__ == "__main__":
    main()
