from flask import request, jsonify
import sqlite3
import os
import subprocess

from app.database import get_db_connection, find_tenant_database, get_all_tenant_databases
from app.dependencies import check_dependencies
from app.routes.update import update_bp

@update_bp.route('/windows-updates', methods=['GET'])
def get_windows_updates():
    tenant_id = request.args.get('tenantId')
    
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
    
    try:
        # Get all databases for this tenant
        tenant_databases = get_all_tenant_databases(tenant['tenantId'])
        
        # Determine which database to use - prefer the tenant database for Windows updates
        if 'tenant' in tenant_databases:
            tenant_db_path = tenant_databases['tenant']
            print(f"Using tenant database for Windows updates: {tenant_db_path}")
        else:
            # Fall back to any database found
            tenant_db_path = find_tenant_database(tenant['tenantId'])
        
        # If the database doesn't exist yet, return a helpful message
        if not tenant_db_path:
            return jsonify({
                'error': 'Database not found',
                'message': f'No Windows updates database found for this tenant. Run the fetch_windows_updates.py script with the tenant ID: python fetch_windows_updates.py {tenant_id}'
            }), 404
        
        # If the database exists, read from it
        try:
            conn = sqlite3.connect(tenant_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check if the windows_known_issues table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='windows_known_issues'")
            if not cursor.fetchone():
                return jsonify([])  # Return empty array if table doesn't exist
            
            # First check the table structure to get column names
            cursor.execute("PRAGMA table_info(windows_known_issues)")
            columns = cursor.fetchall()
            column_names = [col['name'] for col in columns]
            print(f"Available columns in windows_known_issues: {column_names}")
            
            # Dynamically build query based on available columns
            select_fields = [
                "wi.id", 
                "wi.product_id as productId"
            ]
            
            # Add optional fields if they exist
            if 'title' in column_names:
                select_fields.append("wi.title")
            else:
                select_fields.append("'No title available' as title")
                
            if 'description' in column_names:
                select_fields.append("wi.description")
            else:
                select_fields.append("'No description available' as description")
                
            if 'webViewUrl' in column_names:
                select_fields.append("wi.webViewUrl")
            elif 'web_view_url' in column_names:
                select_fields.append("wi.web_view_url as webViewUrl")
                
            if 'status' in column_names:
                select_fields.append("LOWER(wi.status) as status")
            else:
                select_fields.append("'Unknown' as status")
                
            if 'start_date' in column_names:
                select_fields.append("wi.start_date as startDate")
            elif 'startDateTime' in column_names:
                select_fields.append("wi.startDateTime as startDate")
            elif 'first_occurred_date' in column_names:
                select_fields.append("wi.first_occurred_date as startDate")
            else:
                select_fields.append("NULL as startDate")
                
            if 'resolved_date' in column_names:
                select_fields.append("wi.resolved_date as resolvedDate")
            elif 'resolvedDateTime' in column_names:
                select_fields.append("wi.resolvedDateTime as resolvedDate")
            else:
                select_fields.append("NULL as resolvedDate")
                
            # Check if windows_products table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='windows_products'")
            has_products_table = cursor.fetchone() is not None
            
            # Build the query
            if has_products_table:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        wp.name as productName
                    FROM windows_known_issues wi
                    LEFT JOIN windows_products wp ON wi.product_id = wp.id
                    ORDER BY wi.id DESC
                """
            else:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        'Unknown Product' as productName
                    FROM windows_known_issues wi
                    ORDER BY wi.id DESC
                """
            
            print(f"Executing query: {query}")
            cursor.execute(query)
            
            updates = []
            for row in cursor.fetchall():
                # Convert SQLite row to dictionary
                update = dict(row)
                
                # Add tenant information
                update['tenantId'] = tenant['tenantId']
                
                # Make sure status is normalized to lowercase for easier filtering
                if 'status' in update and update['status']:
                    update['status'] = update['status'].lower()
                
                updates.append(update)
            
            conn.close()
            return jsonify(updates)
            
        except sqlite3.Error as e:
            print(f"Database error in get_windows_updates: {e}")
            return jsonify({
                'error': 'Database error',
                'message': str(e)
            }), 500
            
    except Exception as e:
        print(f"Server error in get_windows_updates: {e}")
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

@update_bp.route('/fetch-windows-updates', methods=['POST'])
def trigger_fetch_windows_updates():
    tenant_id = request.json.get('tenantId')
    fix_compatibility = request.json.get('fixCompatibility', False)
    
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
    
    try:
        print(f"Attempting to fetch Windows updates for tenant ID: {tenant_id}")
        
        # Prepare command arguments
        cmd_args = [tenant_id]
        if fix_compatibility:
            cmd_args.append("--fix-compatibility")
        
        # On Windows, run the batch file
        if os.name == 'nt':
            print(f"Running command: fetch_windows_updates.bat {' '.join(cmd_args)}")
            subprocess.run(['fetch_windows_updates.bat'] + cmd_args, check=True)
        else:
            # On non-Windows, run the Python script directly
            print(f"Running command: python fetch_windows_updates.py {' '.join(cmd_args)}")
            subprocess.run(['python', 'fetch_windows_updates.py'] + cmd_args, check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched Windows updates for tenant {tenant["name"]}'
        })
    except subprocess.CalledProcessError as e:
        print(f"Error running fetch_windows_updates script: {str(e)}")
        return jsonify({
            'error': 'Fetch Windows updates failed',
            'message': f'Error running fetch_windows_updates script: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Unexpected error when fetching Windows updates: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
