
from flask import Blueprint, request, jsonify
import sqlite3
import uuid
from datetime import datetime
from app.database import get_db_connection

azure_bp = Blueprint('azure', __name__, url_prefix='/api')

@azure_bp.route('/azure-accounts', methods=['GET'])
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

@azure_bp.route('/azure-accounts', methods=['POST'])
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

@azure_bp.route('/azure-accounts/<string:id>', methods=['PUT'])
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

@azure_bp.route('/azure-accounts/<string:id>', methods=['DELETE'])
def delete_azure_account(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM azure_accounts WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})
