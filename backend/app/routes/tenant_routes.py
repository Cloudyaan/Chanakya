
from flask import Blueprint, request, jsonify
import sqlite3
import uuid
from datetime import datetime
import os
import subprocess

from app.database import get_db_connection
from app.dependencies import check_dependencies

tenant_bp = Blueprint('tenant', __name__, url_prefix='/api')

@tenant_bp.route('/tenants', methods=['GET'])
def get_tenants():
    conn = get_db_connection()
    tenants = conn.execute('SELECT * FROM tenants').fetchall()
    conn.close()
    
    # Convert rows to dictionaries
    result = []
    for tenant in tenants:
        result.append({
            'id': tenant['id'],
            'name': tenant['name'],
            'tenantId': tenant['tenantId'],
            'applicationId': tenant['applicationId'],
            'applicationSecret': tenant['applicationSecret'],
            'isActive': bool(tenant['isActive']),
            'dateAdded': tenant['dateAdded']
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
    current_tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (id,)).fetchone()
    
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
    if current_tenant and not current_tenant['isActive'] and data['isActive']:
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
    # First, check if there's a tenant-specific database we need to delete
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT tenantId FROM tenants WHERE id = ?', (id,)).fetchone()
    
    if tenant:
        # Try to delete the tenant-specific databases if they exist
        tenant_id = tenant['tenantId']
        import glob
        patterns = [
            f"service_announcements_{tenant_id}.db",
            f"*_{tenant_id}.db",
            f"*{tenant_id}*.db"
        ]
        
        for pattern in patterns:
            for db_file in glob.glob(pattern):
                try:
                    os.remove(db_file)
                    print(f"Deleted tenant database: {db_file}")
                except Exception as e:
                    print(f"Error deleting tenant database: {e}")
    
    # Now delete the tenant record
    cursor.execute('DELETE FROM tenants WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})
