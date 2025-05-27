
from flask import Blueprint, request, jsonify
import sqlite3
import uuid
from datetime import datetime
import os
import subprocess

from app.database import get_db_connection, get_table_manager
from app.dependencies import check_dependencies

tenant_bp = Blueprint('tenant', __name__, url_prefix='/api')

@tenant_bp.route('/tenants', methods=['GET'])
def get_tenants():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants')
    tenants = cursor.fetchall()
    conn.close()
    
    # Convert pyodbc rows to dictionaries using column positions
    result = []
    for tenant in tenants:
        result.append({
            'id': tenant[0],
            'name': tenant[1],
            'tenantId': tenant[2],
            'applicationId': tenant[3],
            'applicationSecret': tenant[4],
            'isActive': bool(tenant[5]),
            'dateAdded': tenant[6]
        })
    
    return jsonify(result)

@tenant_bp.route('/tenants', methods=['POST'])
def add_tenant():
    data = request.json
    
    # Generate a new ID and add current timestamp
    tenant_id = str(uuid.uuid4())
    date_added = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO tenants (id, name, tenantId, applicationId, applicationSecret, isActive, dateAdded)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        tenant_id,
        data['name'],
        data['tenantId'],
        data['applicationId'],
        data['applicationSecret'],
        1 if data['isActive'] else 0,
        date_added
    ))
    
    conn.commit()
    conn.close()
    
    # Automatically run the fetch scripts for the new tenant
    if data['isActive']:
        # Ensure dependencies are installed
        if check_dependencies():
            try:
                print(f"Automatically fetching updates for new tenant {data['name']} (ID: {tenant_id})")
                
                # Run fetch_updates.py for the new tenant
                if os.name == 'nt':
                    subprocess.run(['fetch_updates.bat', tenant_id], check=False)
                else:
                    subprocess.run(['python', 'fetch_updates.py', tenant_id], check=False)
                
                # Run fetch_licenses.py for the new tenant
                print(f"Automatically fetching licenses for new tenant {data['name']} (ID: {tenant_id})")
                if os.name == 'nt':
                    subprocess.run(['fetch_licenses.bat', tenant_id], check=False)
                else:
                    subprocess.run(['python', 'fetch_licenses.py', tenant_id], check=False)
            except Exception as e:
                print(f"Error initiating automatic data fetch: {e}")
    
    # Return the newly created tenant with its ID
    return jsonify({
        'id': tenant_id,
        'name': data['name'],
        'tenantId': data['tenantId'],
        'applicationId': data['applicationId'],
        'applicationSecret': data['applicationSecret'],
        'isActive': data['isActive'],
        'dateAdded': date_added
    })

@tenant_bp.route('/tenants/<string:id>', methods=['PUT'])
def update_tenant(id):
    data = request.json
    
    # Get current tenant state to check if isActive changed
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (id,))
    current_tenant = cursor.fetchone()
    
    cursor.execute('''
    UPDATE tenants
    SET name = ?, tenantId = ?, applicationId = ?, applicationSecret = ?, isActive = ?
    WHERE id = ?
    ''', (
        data['name'],
        data['tenantId'],
        data['applicationId'],
        data['applicationSecret'],
        1 if data['isActive'] else 0,
        id
    ))
    
    conn.commit()
    conn.close()
    
    # If tenant was not active before but is active now, fetch data
    if current_tenant and not current_tenant[5] and data['isActive']:  # isActive is at index 5
        # Ensure dependencies are installed
        if check_dependencies():
            try:
                print(f"Automatically fetching updates for newly activated tenant {data['name']} (ID: {id})")
                
                # Run fetch_updates.py for the newly activated tenant
                if os.name == 'nt':
                    subprocess.run(['fetch_updates.bat', id], check=False)
                else:
                    subprocess.run(['python', 'fetch_updates.py', id], check=False)
                
                # Run fetch_licenses.py for the newly activated tenant
                print(f"Automatically fetching licenses for newly activated tenant {data['name']} (ID: {id})")
                if os.name == 'nt':
                    subprocess.run(['fetch_licenses.bat', id], check=False)
                else:
                    subprocess.run(['python', 'fetch_licenses.py', id], check=False)
            except Exception as e:
                print(f"Error initiating automatic data fetch: {e}")
    
    return jsonify({'success': True})

@tenant_bp.route('/tenants/<string:id>', methods=['DELETE'])
def delete_tenant(id):
    # First, get the tenant information we need before deletion
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, tenantId, applicationId, applicationSecret, isActive, dateAdded FROM tenants WHERE id = ?', (id,))
    tenant = cursor.fetchone()
    
    if not tenant:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'error': 'Tenant not found'}), 404
    
    try:
        # Extract tenant information
        tenant_name = tenant[1]  # name is at index 1
        tenant_azure_id = tenant[2]  # tenantId is at index 2
        
        print(f"Deleting tenant: {tenant_name} (ID: {id}, Azure ID: {tenant_azure_id})")
        
        # Delete tenant-specific tables using the table manager
        table_manager = get_table_manager()
        try:
            table_manager.drop_tenant_tables(tenant_name, 'm365')
            print(f"Successfully deleted tenant tables for: {tenant_name}")
        except Exception as e:
            print(f"Error deleting tenant tables for {tenant_name}: {e}")
            # Continue with tenant deletion even if table deletion fails
        
        # Try to delete any legacy tenant-specific databases (for backwards compatibility)
        import glob
        patterns = [
            f"service_announcements_{tenant_azure_id}.db",
            f"*_{tenant_azure_id}.db",
            f"*{tenant_azure_id}*.db"
        ]
        
        for pattern in patterns:
            for db_file in glob.glob(pattern):
                try:
                    os.remove(db_file)
                    print(f"Deleted legacy tenant database: {db_file}")
                except Exception as e:
                    print(f"Error deleting legacy tenant database: {e}")
        
        # Finally, delete the tenant record from the main tenants table
        cursor.execute('DELETE FROM tenants WHERE id = ?', (id,))
        conn.commit()
        
        print(f"Successfully deleted tenant configuration for: {tenant_name}")
        
    except Exception as e:
        print(f"Error during tenant deletion: {e}")
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
    
    return jsonify({'success': True})
