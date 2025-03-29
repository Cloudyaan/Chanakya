from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import json
from datetime import datetime
import os
import importlib.util
import subprocess
import glob
import sys

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

# Check if required packages are installed
def check_dependencies():
    required_packages = ['msal', 'pandas', 'requests']
    missing_packages = []
    
    for package in required_packages:
        spec = importlib.util.find_spec(package)
        if spec is None:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Warning: Missing required packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
            print("Successfully installed missing packages")
            return True
        except subprocess.CalledProcessError:
            print("Error installing packages. Please install them manually:")
            for package in missing_packages:
                print(f"  pip install {package}")
            return False
    
    return True

# Initialize the database when the app starts
init_db()
check_dependencies()

# Helper function to find tenant-specific database
def find_tenant_database(tenant_id):
    # Look for database files matching different naming patterns
    patterns = [
        f"service_announcements_{tenant_id}.db",
        f"*_{tenant_id}.db",
        f"*{tenant_id}*.db"
    ]
    
    for pattern in patterns:
        matching_files = glob.glob(pattern)
        if matching_files:
            return matching_files[0]
    
    return None

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

@app.route('/api/tenants/<string:id>', methods=['PUT'])
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

@app.route('/api/tenants/<string:id>', methods=['DELETE'])
def delete_tenant(id):
    # First, check if there's a tenant-specific database we need to delete
    conn = get_db_connection()
    cursor = conn.cursor()
    tenant = cursor.execute('SELECT tenantId FROM tenants WHERE id = ?', (id,)).fetchone()
    
    if tenant:
        # Try to delete the tenant-specific databases if they exist
        tenant_id = tenant['tenantId']
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

# Create batch file for fetch_licenses if not exists
def create_fetch_licenses_batch():
    batch_file = 'fetch_licenses.bat'
    if not os.path.exists(batch_file):
        with open(batch_file, 'w') as f:
            f.write('@echo off\n')
            f.write('python fetch_licenses.py %*\n')
        print(f"Created {batch_file}")

# Create batch file for fetch_windows_updates if not exists
def create_fetch_windows_updates_batch():
    batch_file = 'fetch_windows_updates.bat'
    if not os.path.exists(batch_file):
        with open(batch_file, 'w') as f:
            f.write('@echo off\n')
            f.write('echo Running Windows Updates Fetcher\n')
            f.write('echo ====================================================\n')
            f.write('echo.\n\n')
            f.write('REM Check if pandas is installed\n')
            f.write('python -c "import pandas" 2>NUL\n')
            f.write('if %ERRORLEVEL% NEQ 0 (\n')
            f.write('    echo Error: pandas package is not installed.\n')
            f.write('    echo Installing pandas...\n')
            f.write('    pip install pandas\n')
            f.write('    if %ERRORLEVEL% NEQ 0 (\n')
            f.write('        echo Failed to install pandas. Please install it manually: pip install pandas\n')
            f.write('        exit /b 1\n')
            f.write('    )\n')
            f.write(')\n\n')
            f.write('python fetch_windows_updates.py %*\n\n')
            f.write('echo.\n')
            f.write('echo Done!\n')
        print(f"Created {batch_file}")

# Ensure batch files exist
create_fetch_licenses_batch()
create_fetch_windows_updates_batch()

# Routes for Azure accounts
@app.route('/api/azure-accounts', methods=['GET'])
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

@app.route('/api/azure-accounts', methods=['POST'])
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

@app.route('/api/azure-accounts/<string:id>', methods=['PUT'])
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

@app.route('/api/azure-accounts/<string:id>', methods=['DELETE'])
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

# Add a new endpoint for licenses
@app.route('/api/licenses', methods=['GET'])
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

# New endpoint to trigger the fetch_licenses.py script
@app.route('/api/fetch-licenses', methods=['POST'])
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
    
    try:
        # On Windows, run the batch file
        if os.name == 'nt':
            subprocess.run(['fetch_licenses.bat', tenant_id], check=True)
        else:
            # On non-Windows, run the Python script directly
            subprocess.run(['python', 'fetch_licenses.py', tenant_id], check=True)
        
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

# Add a new endpoint for Windows updates
@app.route('/api/windows-updates', methods=['GET'])
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
            
            # Join windows_known_issues with windows_products to get product names
            cursor.execute("""
                SELECT 
                    wi.id,
                    wi.product_id as productId,
                    wp.name as productName,
                    wi.title,
                    wi.description,
                    wi.severity,
                    wi.status,
                    wi.first_occurred_date as firstOccurredDate,
                    wi.resolved_date as resolvedDate
                FROM windows_known_issues wi
                LEFT JOIN windows_products wp ON wi.product_id = wp.id
                ORDER BY wi.first_occurred_date DESC
            """)
            
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
            return jsonify({
                'error': 'Database error',
                'message': str(e)
            }), 500
            
    except Exception as e:
        return jsonify({
            'error': 'Server error',
            'message': str(e)
        }), 500

# New endpoint to trigger the fetch_windows_updates.py script
@app.route('/api/fetch-windows-updates', methods=['POST'])
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
