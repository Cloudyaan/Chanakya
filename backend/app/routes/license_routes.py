
from flask import Blueprint, request, jsonify
import sqlite3
import os
import subprocess
import sys

from app.database import get_db_connection, find_tenant_database
from app.dependencies import check_dependencies, check_numpy_pandas_compatibility

license_bp = Blueprint('license', __name__, url_prefix='/api')

@license_bp.route('/licenses', methods=['GET'])
def get_licenses():
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
        # Find the tenant database for licenses - look for multiple patterns
        tenant_db_path = find_tenant_database(tenant['tenantId'])
        
        # If the database doesn't exist yet, return an error
        if not tenant_db_path:
            return jsonify({
                'error': 'Database not found',
                'message': f'No license database found for this tenant. Run the fetch_licenses.py script with the tenant ID: python fetch_licenses.py {tenant_id}'
            }), 404
        
        # If the database exists, read from it
        try:
            conn = sqlite3.connect(tenant_db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check if the licenses table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='licenses'")
            if not cursor.fetchone():
                return jsonify([])  # Return empty array if table doesn't exist
            
            # Get the licenses
            cursor.execute("""
                SELECT 
                    id,
                    license_sku as sku,
                    license_sku as name,
                    license_sku as displayName,
                    type,
                    total_licenses as totalCount,
                    used_licenses as usedCount,
                    unused_licenses as availableCount,
                    renewal_expiration_date as renewalDate,
                    captured_date
                FROM licenses
                ORDER BY total_licenses DESC
            """)
            
            licenses = []
            for row in cursor.fetchall():
                # Convert SQLite row to dictionary
                license_data = dict(row)
                
                # Add tenant information and format data
                license_record = {
                    'id': str(license_data['id']),
                    'name': license_data['name'],
                    'sku': license_data['sku'],
                    'displayName': license_data['displayName'],
                    'totalCount': license_data['totalCount'],
                    'usedCount': license_data['usedCount'],
                    'availableCount': license_data['availableCount'],
                    'renewalDate': license_data['renewalDate'],
                    'tenantId': tenant['id'],
                    'tenantName': tenant['name']
                }
                
                licenses.append(license_record)
            
            conn.close()
            return jsonify(licenses)
            
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

@license_bp.route('/fetch-licenses', methods=['POST'])
def trigger_fetch_licenses():
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
        # On Windows, run the batch file
        if os.name == 'nt':
            subprocess.run(['fetch_licenses.bat', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly with the same Python interpreter
            python_executable = sys.executable
            print(f"Using Python interpreter: {python_executable}")
            subprocess.run([python_executable, 'fetch_licenses.py', tenant_id], check=True)
        
        return jsonify({
            'success': True,
            'message': f'Successfully fetched licenses for tenant {tenant["name"]}'
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            'error': 'Fetch licenses failed',
            'message': f'Error running fetch_licenses script: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': f'Unexpected error: {str(e)}'
        }), 500
