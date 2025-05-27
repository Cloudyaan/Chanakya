from flask import request, jsonify
import sqlite3
import os
import subprocess
import importlib.util

from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist
from app.dependencies import check_dependencies, check_numpy_pandas_compatibility
from app.routes.update import update_bp

@update_bp.route('/updates', methods=['GET'])
def get_updates():
    tenant_id = request.args.get('tenantId')
    source = request.args.get('source', 'message-center')  # Default to message-center
    
    # If no tenant ID is specified, return an error
    if not tenant_id:
        return jsonify({
            'error': 'Tenant ID is required',
            'message': 'Please specify a tenantId parameter'
        }), 400
    
    # Try to find the tenant
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    # Check if MSAL is installed
    msal_spec = importlib.util.find_spec('msal')
    if msal_spec is None:
        # Return system message about MSAL not being installed
        return jsonify([{
            'id': 'msal-error',
            'title': 'MSAL package not installed',
            'description': 'The MSAL package is required to fetch updates from Microsoft Graph. Please install it using "pip install msal".',
            'tenantId': tenant_id,
            'tenantName': 'System Message',
            'publishedDate': '2023-01-01T00:00:00Z',
            'actionType': 'Action Required',
            'category': 'preventOrFixIssue'
        }]), 200
    
    try:
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
            return jsonify([{
                'id': 'db-init',
                'title': 'No updates database found',
                'description': f'No updates database found for this tenant. Click "Fetch Updates" to retrieve data from Microsoft Graph API.',
                'tenantId': tenant_id,
                'tenantName': 'System Message',
                'publishedDate': '2023-01-01T00:00:00Z',
                'actionType': 'Action Required',
                'category': 'preventOrFixIssue'
            }]), 200
        
        # Get connection and table name for tenant-specific operations
        conn, table_name = get_tenant_table_connection(tenant_dict['id'], 'updates', 'm365')
        if not conn or not table_name:
            print(f"Failed to get table connection for tenant: {tenant_dict['name']} (ID: {tenant_id})")
            return jsonify([{
                'id': 'db-init',
                'title': 'No updates database found',
                'description': f'No updates database found for this tenant. Click "Fetch Updates" to retrieve data from Microsoft Graph API.',
                'tenantId': tenant_id,
                'tenantName': 'System Message',
                'publishedDate': '2023-01-01T00:00:00Z',
                'actionType': 'Action Required',
                'category': 'preventOrFixIssue'
            }]), 200
        
        # Connect to the Azure SQL database and fetch updates
        try:
            cursor = conn.cursor()
            
            # Check if the updates table exists
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{table_name}'
            """)
            table_exists = cursor.fetchone()[0] > 0
            
            if not table_exists:
                print(f"Updates table {table_name} does not exist for tenant: {tenant_dict['name']}")
                conn.close()
                return jsonify([{
                    'id': 'db-init',
                    'title': 'No updates database found',
                    'description': f'No updates database found for this tenant. Click "Fetch Updates" to retrieve data from Microsoft Graph API.',
                    'tenantId': tenant_id,
                    'tenantName': 'System Message',
                    'publishedDate': '2023-01-01T00:00:00Z',
                    'actionType': 'Action Required',
                    'category': 'preventOrFixIssue'
                }]), 200
            
            print(f"Found updates table: {table_name} for tenant: {tenant_dict['name']}")
            
            # Query the updates table
            cursor.execute(f"""
                SELECT 
                    id,
                    title,
                    category,
                    severity,
                    lastModifiedDateTime as publishedDate,
                    isMajorChange as actionType,
                    bodyContent as description
                FROM {table_name}
                ORDER BY lastModifiedDateTime DESC
            """)
            
            updates = []
            rows = cursor.fetchall()
            print(f"Found {len(rows)} updates in table {table_name}")
            
            for row in rows:
                # Convert to dictionary
                update = {
                    'id': row[0],
                    'title': row[1],
                    'category': row[2],
                    'severity': row[3],
                    'publishedDate': row[4],
                    'actionType': row[5],
                    'description': row[6]
                }
                
                # Map action type
                action_type = update.get('actionType')
                if action_type == 'MajorChange':
                    update['actionType'] = 'Action Required'
                elif action_type == 'planForChange' or (update.get('severity') == 'Medium'):
                    update['actionType'] = 'Plan for Change'
                else:
                    update['actionType'] = 'Informational'
                
                # Add tenant information
                update['tenantId'] = tenant_dict['id']
                update['tenantName'] = tenant_dict['name']
                
                # Add a message ID if not present
                if 'messageId' not in update:
                    update['messageId'] = f"MC{str(update['id'])[-6:]}"
                
                updates.append(update)
            
            conn.close()
            print(f"Returning {len(updates)} updates for tenant: {tenant_dict['name']}")
            return jsonify(updates)
            
        except Exception as e:
            error_msg = f"Database error reading from {table_name}: {str(e)}"
            print(error_msg)
            if conn:
                conn.close()
            return jsonify([{
                'id': 'db-error',
                'title': 'Database error',
                'description': error_msg,
                'tenantId': tenant_id,
                'tenantName': 'System Message',
                'publishedDate': '2023-01-01T00:00:00Z',
                'actionType': 'Action Required',
                'category': 'preventOrFixIssue'
            }]), 200
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg)
        return jsonify([{
            'id': 'server-error',
            'title': 'Server error',
            'description': error_msg,
            'tenantId': tenant_id,
            'tenantName': 'System Message',
            'publishedDate': '2023-01-01T00:00:00Z',
            'actionType': 'Action Required',
            'category': 'preventOrFixIssue'
        }]), 200

@update_bp.route('/fetch-updates', methods=['POST'])
def trigger_fetch_updates():
    tenant_id = request.json.get('tenantId')
    
    if not tenant_id:
        return jsonify({
            'error': 'Tenant ID is required',
            'message': 'Please specify a tenantId in the request body'
        }), 400
    
    # Check if the tenant exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    # Ensure dependencies are installed
    if not check_dependencies():
        return jsonify({
            'error': 'Missing dependencies',
            'message': 'Required packages are not installed. Please install them manually.'
        }), 503
        
    # Check numpy/pandas compatibility
    if not check_numpy_pandas_compatibility():
        return jsonify({
            'error': 'Compatibility issue',
            'message': 'NumPy and pandas compatibility issue. Please reinstall these packages manually.'
        }), 503
    
    try:
        print(f"Attempting to fetch updates for tenant ID: {tenant_id}")
        
        # On Windows, run the batch file
        if os.name == 'nt':
            # Print the current directory for debugging
            print(f"Current directory: {os.getcwd()}")
            print(f"Running command: fetch_updates.bat {tenant_id}")
            
            # Use absolute paths or ensure the batch file is in the right directory
            fetch_script = os.path.join(os.getcwd(), 'fetch_updates.bat')
            if not os.path.exists(fetch_script):
                print(f"Warning: fetch_updates.bat not found at {fetch_script}")
                
            # Try different ways to run the batch file
            try:
                subprocess.run(['fetch_updates.bat', tenant_id], check=True)
            except Exception as batch_error:
                print(f"Error running batch file directly: {str(batch_error)}")
                try:
                    # Try with cmd /c
                    subprocess.run(['cmd', '/c', 'fetch_updates.bat', tenant_id], check=True)
                except Exception as cmd_error:
                    print(f"Error running with cmd /c: {str(cmd_error)}")
                    # As a last resort, try with python
                    subprocess.run(['python', 'fetch_updates.py', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            print(f"Running command: python fetch_updates.py {tenant_id}")
            
            # Use sys.executable to ensure we use the same Python interpreter
            subprocess.run(['python', 'fetch_updates.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched updates for tenant {tenant[1]}'  # Access by index
        })
    except subprocess.CalledProcessError as e:
        print(f"Error running fetch_updates script: {str(e)}")
        return jsonify({
            'error': 'Fetch updates failed',
            'message': f'Error running fetch_updates script: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Unexpected error when fetching updates: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
