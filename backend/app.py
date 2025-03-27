
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import json
from datetime import datetime
import os
import importlib.util
import subprocess

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database setup
def get_db_connection():
    conn = sqlite3.connect('chanakya.db')
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create M365 tenants table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        applicationId TEXT NOT NULL,
        applicationSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL,
        dateAdded TEXT NOT NULL
    )
    ''')
    
    # Create Azure accounts table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS azure_accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subscriptionId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        clientId TEXT NOT NULL,
        clientSecret TEXT NOT NULL,
        isActive INTEGER NOT NULL,
        dateAdded TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize the database when the app starts
init_db()

# Routes for M365 tenants
@app.route('/api/tenants', methods=['GET'])
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

@app.route('/api/tenants', methods=['POST'])
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

@app.route('/api/tenants/<string:id>', methods=['PUT'])
def update_tenant(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
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
    
    return jsonify({'success': True})

@app.route('/api/tenants/<string:id>', methods=['DELETE'])
def delete_tenant(id):
    # First, check if there's a tenant-specific database we need to delete
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT tenantId FROM tenants WHERE id = ?', (id,)).fetchone()
    
    if tenant:
        # Try to delete the tenant-specific updates database if it exists
        tenant_db_path = f"service_announcements_{tenant['tenantId']}.db"
        if os.path.exists(tenant_db_path):
            try:
                os.remove(tenant_db_path)
                print(f"Deleted tenant database: {tenant_db_path}")
            except Exception as e:
                print(f"Error deleting tenant database: {e}")
    
    # Now delete the tenant record
    cursor.execute('DELETE FROM tenants WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# Routes for Azure accounts
@app.route('/api/azure', methods=['GET'])
def get_azure_accounts():
    conn = get_db_connection()
    accounts = conn.execute('SELECT * FROM azure_accounts').fetchall()
    conn.close()
    
    # Convert rows to dictionaries
    result = []
    for account in accounts:
        result.append({
            'id': account['id'],
            'name': account['name'],
            'subscriptionId': account['subscriptionId'],
            'tenantId': account['tenantId'],
            'clientId': account['clientId'],
            'clientSecret': account['clientSecret'],
            'isActive': bool(account['isActive']),
            'dateAdded': account['dateAdded']
        })
    
    return jsonify(result)

@app.route('/api/azure', methods=['POST'])
def add_azure_account():
    data = request.json
    
    # Generate a new ID and add current timestamp
    account_id = str(uuid.uuid4())
    date_added = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO azure_accounts (id, name, subscriptionId, tenantId, clientId, clientSecret, isActive, dateAdded)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        account_id,
        data['name'],
        data['subscriptionId'],
        data['tenantId'],
        data['clientId'],
        data['clientSecret'],
        1 if data['isActive'] else 0,
        date_added
    ))
    
    conn.commit()
    conn.close()
    
    # Return the newly created account with its ID
    return jsonify({
        'id': account_id,
        'name': data['name'],
        'subscriptionId': data['subscriptionId'],
        'tenantId': data['tenantId'],
        'clientId': data['clientId'],
        'clientSecret': data['clientSecret'],
        'isActive': data['isActive'],
        'dateAdded': date_added
    })

@app.route('/api/azure/<string:id>', methods=['PUT'])
def update_azure_account(id):
    data = request.json
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE azure_accounts
    SET name = ?, subscriptionId = ?, tenantId = ?, clientId = ?, clientSecret = ?, isActive = ?
    WHERE id = ?
    ''', (
        data['name'],
        data['subscriptionId'],
        data['tenantId'],
        data['clientId'],
        data['clientSecret'],
        1 if data['isActive'] else 0,
        id
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/azure/<string:id>', methods=['DELETE'])
def delete_azure_account(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM azure_accounts WHERE id = ?', (id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# New endpoint for tenant updates
@app.route('/api/updates', methods=['GET'])
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
        # Check if the tenant-specific database exists
        db_path = f"service_announcements_{tenant['tenantId']}.db"
        has_database = os.path.exists(db_path)
        
        # If the database doesn't exist yet, return a helpful message with instructions
        if not has_database:
            return jsonify({
                'error': 'Database not found',
                'message': f'No updates database found for this tenant. Run the fetch_updates.py script with the tenant ID: python fetch_updates.py {tenant_id}'
            }), 404
        
        # If the database exists, read from it
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Check if the announcements table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='announcements'")
            if not cursor.fetchone():
                return jsonify([])  # Return empty array if table doesn't exist
            
            # Get the announcements
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

# New endpoint to trigger the fetch_updates.py script for a specific tenant
@app.route('/api/fetch-updates', methods=['POST'])
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
    
    # Check if MSAL is installed
    msal_spec = importlib.util.find_spec('msal')
    if msal_spec is None:
        return jsonify({
            'error': 'MSAL package not installed',
            'message': 'The MSAL package is required to fetch updates from Microsoft Graph. Please install it using "pip install msal".'
        }), 503  # 503 Service Unavailable
    
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
