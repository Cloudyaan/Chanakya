
from flask import Blueprint, request, jsonify
import sqlite3
import os
import subprocess
import importlib.util

from app.database import get_db_connection, find_tenant_database
from app.dependencies import check_dependencies

update_bp = Blueprint('update', __name__, url_prefix='/api')

@update_bp.route('/updates', methods=['GET'])
def get_updates():
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
    
    # Check if MSAL is installed
    msal_spec = importlib.util.find_spec('msal')
    if msal_spec is None:
        return jsonify({
            'error': 'MSAL package not installed',
            'message': 'The MSAL package is required to fetch updates from Microsoft Graph. Please install it using "pip install msal".'
        }), 503  # 503 Service Unavailable
    
    try:
        # Find the tenant database - look for multiple patterns
        tenant_db_path = find_tenant_database(tenant['tenantId'])
        
        # If the database doesn't exist yet, return a helpful message with instructions
        if not tenant_db_path:
            return jsonify({
                'error': 'Database not found',
                'message': f'No updates database found for this tenant. Run the fetch_updates.py script with the tenant ID: python fetch_updates.py {tenant_id}'
            }), 404
        
        # If the database exists, read from it
        try:
            conn = sqlite3.connect(tenant_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check if the updates table exists - try both table names
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name='updates' OR name='announcements')")
            table_result = cursor.fetchone()
            
            if not table_result:
                return jsonify([])  # Return empty array if table doesn't exist
                
            table_name = table_result['name']
            print(f"Found table: {table_name} in database: {tenant_db_path}")
            
            # Adapt query based on which table exists
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
                    LIMIT 100
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
                    LIMIT 100
                """)
            
            updates = []
            for row in cursor.fetchall():
                # Convert SQLite row to dictionary
                update = dict(row)
                
                # Map action type
                action_type = update.get('actionType')
                if action_type == 'MajorChange':
                    update['actionType'] = 'Action Required'
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
            return jsonify({
                'error': 'Database error',
                'message': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

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
    
    try:
        # On Windows, run the batch file
        if os.name == 'nt':
            subprocess.run(['fetch_updates.bat', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            subprocess.run(['python', 'fetch_updates.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched updates for tenant {tenant["name"]}'
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            'error': 'Fetch updates failed',
            'message': f'Error running fetch_updates script: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
