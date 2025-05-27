
from flask import request, jsonify
import os
import subprocess

from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist
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
        # Convert row to dictionary for easier access
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
        ensure_tenant_tables_exist(tenant_id, 'm365')
        
        # Get connection and table name for Windows issues
        table_conn, windows_issues_table = get_tenant_table_connection(tenant_id, 'windows_known_issues', 'm365')
        
        if not table_conn or not windows_issues_table:
            return jsonify({
                'error': 'Database connection failed',
                'message': 'Could not connect to tenant database'
            }), 500
        
        try:
            cursor = table_conn.cursor()
            
            # Check if the table exists
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{windows_issues_table}'
            """)
            table_exists = cursor.fetchone()[0] > 0
            
            if not table_exists:
                cursor.close()
                table_conn.close()
                return jsonify([])  # Return empty array if table doesn't exist
            
            # Get table structure to build dynamic query
            cursor.execute(f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{windows_issues_table}'")
            columns_result = cursor.fetchall()
            column_names = [row[0] for row in columns_result]
            print(f"Available columns in {windows_issues_table}: {column_names}")
            
            # Build dynamic query based on available columns
            select_fields = ["wi.id"]
            
            # Add optional fields if they exist
            if 'product_id' in column_names:
                select_fields.append("wi.product_id as productId")
            else:
                select_fields.append("NULL as productId")
                
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
            else:
                select_fields.append("NULL as webViewUrl")
                
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
            products_table = windows_issues_table.replace('_known_issues', '_products')
            cursor.execute(f"""
                SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_NAME = '{products_table}'
            """)
            has_products_table = cursor.fetchone()[0] > 0
            
            # Build and execute the query
            if has_products_table:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        wp.name as productName
                    FROM {windows_issues_table} wi
                    LEFT JOIN {products_table} wp ON wi.product_id = wp.id
                    ORDER BY wi.id DESC
                """
            else:
                query = f"""
                    SELECT 
                        {', '.join(select_fields)},
                        'Unknown Product' as productName
                    FROM {windows_issues_table} wi
                    ORDER BY wi.id DESC
                """
            
            print(f"Executing query: {query}")
            cursor.execute(query)
            
            updates = []
            for row in cursor.fetchall():
                # Create dictionary from row data
                update = {}
                field_names = [desc[0] for desc in cursor.description]
                for i, field_name in enumerate(field_names):
                    update[field_name] = row[i]
                
                # Add tenant information
                update['tenantId'] = tenant_dict['tenantId']
                
                # Make sure status is normalized to lowercase for easier filtering
                if 'status' in update and update['status']:
                    update['status'] = update['status'].lower()
                
                updates.append(update)
            
            cursor.close()
            table_conn.close()
            return jsonify(updates)
            
        except Exception as e:
            print(f"Database error in get_windows_updates: {e}")
            if table_conn:
                table_conn.close()
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
        # Convert row to dictionary for easier access
        tenant_dict = {
            'id': tenant[0],
            'name': tenant[1],
            'tenantId': tenant[2],
            'applicationId': tenant[3],
            'applicationSecret': tenant[4],
            'isActive': bool(tenant[5]),
            'dateAdded': tenant[6]
        }
        
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
            'message': f'Successfully fetched Windows updates for tenant {tenant_dict["name"]}'
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
