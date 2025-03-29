
from flask import Blueprint, request, jsonify
import sqlite3
import os
import subprocess

from app.database import get_db_connection, find_tenant_database
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
    tenant = cursor.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    conn.close()
    
    if not tenant:
        return jsonify({
            'error': 'Tenant not found',
            'message': f'No tenant found with ID {tenant_id}'
        }), 404
    
    try:
        # Find the tenant database
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
                select_fields.append("wi.status")
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
                
            # Build the query
            query = f"""
                SELECT 
                    {', '.join(select_fields)},
                    wp.name as productName
                FROM windows_known_issues wi
                LEFT JOIN windows_products wp ON wi.product_id = wp.id
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
    
    try:
        # On Windows, run the batch file
        if os.name == 'nt':
            subprocess.run(['fetch_windows_updates.bat', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            subprocess.run(['python', 'fetch_windows_updates.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched Windows updates for tenant {tenant["name"]}'
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            'error': 'Fetch Windows updates failed',
            'message': f'Error running fetch_windows_updates script: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
