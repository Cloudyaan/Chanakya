
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import uuid
import json
from datetime import datetime

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
    conn = get_db_connection()
    cursor = conn.cursor()
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
