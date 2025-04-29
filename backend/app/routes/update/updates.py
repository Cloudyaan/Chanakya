from flask import request, jsonify
import sqlite3
import os
import subprocess
import importlib.util

from app.database import get_db_connection, find_tenant_database, get_all_tenant_databases
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
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
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
        # Get all databases for this tenant
        tenant_databases = get_all_tenant_databases(tenant['tenantId'])
        
        # Determine which database to use based on the source parameter
        if source == 'message-center' and 'service_announcements' in tenant_databases:
            tenant_db_path = tenant_databases['service_announcements']
            print(f"Using service_announcements database: {tenant_db_path}")
        else:
            # Fall back to the regular tenant database or any found database
            tenant_db_path = find_tenant_database(tenant['tenantId'])
        
        # If no database found, return a system message
        if not tenant_db_path:
            print(f"No database found for tenant: {tenant['name']} (ID: {tenant_id})")
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
        
        # Connect to the database and fetch updates
        try:
            conn = sqlite3.connect(tenant_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check which table to use
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name='updates' OR name='announcements')")
            table_result = cursor.fetchone()
            
            if not table_result:
                print(f"No updates or announcements table found in database: {tenant_db_path}")
                return jsonify([])  # Return empty array if table doesn't exist
                
            table_name = table_result['name']
            print(f"Found table: {table_name} in database: {tenant_db_path}")
            
            # Adapt query based on which table exists - without any LIMIT
            if table_name == 'updates':
                cursor.execute("""
                    SELECT 
                        id,
                        title,
                        category,
                        severity,
                        lastModifiedDateTime as publishedDate,
                        isMajorChange as actionType,
                        bodyContent as description
                    FROM updates
                    ORDER BY lastModifiedDateTime DESC
                """)
            else:  # announcements
                cursor.execute("""
                    SELECT 
                        id,
                        title,
                        category,
                        severity,
                        lastModifiedDateTime as publishedDate,
                        isMajorChange as actionType,
                        bodyContent as description
                    FROM announcements
                    ORDER BY lastModifiedDateTime DESC
                """)
            
            updates = []
            for row in cursor.fetchall():
                # Convert SQLite row to dictionary
                update = dict(row)
                
                # Map action type
                action_type = update.get('actionType')
                if action_type == 'MajorChange':
                    update['actionType'] = 'Action Required'
                elif action_type == 'planForChange' or (update.get('severity') == 'Medium'):
                    update['actionType'] = 'Plan for Change'
                else:
                    update['actionType'] = 'Informational'
                
                # Add tenant information
                update['tenantId'] = tenant['tenantId']
                update['tenantName'] = tenant['name']
                
                # Add a message ID if not present
                if 'messageId' not in update:
                    update['messageId'] = f"MC{update['id'][-6:]}"
                
                updates.append(update)
            
            conn.close()
            return jsonify(updates)
            
        except sqlite3.Error as e:
            error_msg = f"Database error reading from {tenant_db_path}: {str(e)}"
            print(error_msg)
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
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
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
            'message': f'Successfully fetched updates for tenant {tenant["name"]}'
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
