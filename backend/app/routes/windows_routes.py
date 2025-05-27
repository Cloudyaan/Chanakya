
from flask import Blueprint, request, jsonify
import os
import subprocess

from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist, get_table_manager
from app.dependencies import check_dependencies

windows_bp = Blueprint('windows', __name__, url_prefix='/api')

@windows_bp.route('/windows-updates', methods=['GET'])
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
    cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
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
            return jsonify([])
        
        # Get connection and table names for Windows data
        conn, issues_table = get_tenant_table_connection(tenant_dict['id'], 'windows_known_issues', 'm365')
        if not conn or not issues_table:
            print(f"Failed to get table connection for tenant: {tenant_dict['name']} (ID: {tenant_id})")
            return jsonify([])
        
        # Generate products table name
        table_manager = get_table_manager()
        products_table = table_manager.get_table_name(tenant_dict['name'], 'windows_products')
        
        try:
            cursor = conn.cursor()
            
            # Check if the issues table exists
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{issues_table}'
            """)
            issues_table_exists = cursor.fetchone()[0] > 0
            
            if not issues_table_exists:
                print(f"Windows issues table {issues_table} does not exist for tenant: {tenant_dict['name']}")
                conn.close()
                return jsonify([])
            
            print(f"Found Windows issues table: {issues_table} for tenant: {tenant_dict['name']}")
            
            # Check if products table exists
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{products_table}'
            """)
            products_table_exists = cursor.fetchone()[0] > 0
            print(f"Checking for products table: {products_table}, exists: {products_table_exists}")
            
            # First check the issues table structure to get column names
            cursor.execute(f"SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{issues_table}'")
            columns = cursor.fetchall()
            column_names = [col[3] for col in columns]  # Column name is at index 3
            print(f"Available columns in {issues_table}: {column_names}")
            
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
                
            if 'web_view_url' in column_names:
                select_fields.append("wi.web_view_url as webViewUrl")
            else:
                select_fields.append("NULL as webViewUrl")
                
            if 'status' in column_names:
                select_fields.append("LOWER(wi.status) as status")
            else:
                select_fields.append("'unknown' as status")
                
            if 'start_date' in column_names:
                select_fields.append("wi.start_date as startDate")
            else:
                select_fields.append("NULL as startDate")
                
            if 'resolved_date' in column_names:
                select_fields.append("wi.resolved_date as resolvedDate")
            else:
                select_fields.append("NULL as resolvedDate")
            
            # Build the query based on whether products table exists
            if products_table_exists:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        wp.name as productName
                    FROM {issues_table} wi
                    LEFT JOIN {products_table} wp ON wi.product_id = wp.id
                    ORDER BY wi.id DESC
                """
            else:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        'Unknown Product' as productName
                    FROM {issues_table} wi
                    ORDER BY wi.id DESC
                """
            
            print(f"Executing query: {query}")
            cursor.execute(query)
            
            updates = []
            for row in cursor.fetchall():
                # Convert to dictionary
                update = {
                    'id': row[0],
                    'productId': row[1],
                    'title': row[2],
                    'description': row[3],
                    'webViewUrl': row[4],
                    'status': row[5],
                    'startDate': row[6],
                    'resolvedDate': row[7],
                    'productName': row[8]
                }
                
                # Add tenant information
                update['tenantId'] = tenant_dict['id']
                update['tenantName'] = tenant_dict['name']
                
                updates.append(update)
            
            conn.close()
            print(f"Returning {len(updates)} Windows updates for tenant: {tenant_dict['name']}")
            return jsonify(updates)
            
        except Exception as e:
            error_msg = f"Database error reading from {issues_table}: {str(e)}"
            print(error_msg)
            if conn:
                conn.close()
            return jsonify([])
            
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        print(error_msg)
        return jsonify([])

@windows_bp.route('/fetch-windows-updates', methods=['POST'])
def trigger_fetch_windows_updates():
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
    
    try:
        print(f"Attempting to fetch Windows updates for tenant ID: {tenant_id}")
        
        # On Windows, run the batch file
        if os.name == 'nt':
            # Print the current directory for debugging
            print(f"Current directory: {os.getcwd()}")
            print(f"Running command: fetch_windows_updates.bat {tenant_id}")
            
            # Use absolute paths or ensure the batch file is in the right directory
            fetch_script = os.path.join(os.getcwd(), 'fetch_windows_updates.bat')
            if not os.path.exists(fetch_script):
                print(f"Warning: fetch_windows_updates.bat not found at {fetch_script}")
                
            # Try different ways to run the batch file
            try:
                subprocess.run(['fetch_windows_updates.bat', tenant_id], check=True)
            except Exception as batch_error:
                print(f"Error running batch file directly: {str(batch_error)}")
                try:
                    # Try with cmd /c
                    subprocess.run(['cmd', '/c', 'fetch_windows_updates.bat', tenant_id], check=True)
                except Exception as cmd_error:
                    print(f"Error running with cmd /c: {str(cmd_error)}")
                    # As a last resort, try with python
                    subprocess.run(['python', 'fetch_windows_updates.py', tenant_id, '--fix-compatibility'], check=True)
        else:
            # On non-Windows, run the Python script directly
            print(f"Running command: python fetch_windows_updates.py {tenant_id} --fix-compatibility")
            subprocess.run(['python', 'fetch_windows_updates.py', tenant_id, '--fix-compatibility'], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched Windows updates for tenant {tenant[1]}'
        })
    except subprocess.CalledProcessError as e:
        print(f"Error running fetch_windows_updates script: {str(e)}")
        return jsonify({
            'error': 'Fetch Windows updates failed',
            'message': f'Error running fetch_windows_updates script: {str(e)}'
        }), 500
    except Exception as e:
        print(f"Server error when fetching Windows updates: {str(e)}")
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
