
from flask import Blueprint, request, jsonify
import sqlite3
import json
from datetime import datetime

from app.database import get_db_connection, init_db

notification_bp = Blueprint('notification', __name__, url_prefix='/api')

def init_notification_table():
    """Initialize the notification_settings table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notification_settings (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        tenants TEXT NOT NULL,
        update_types TEXT NOT NULL,
        frequency TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()

@notification_bp.route('/notification-settings', methods=['GET'])
def get_notification_settings():
    tenant_id = request.args.get('tenantId')
    
    # Initialize the notification table if needed
    init_notification_table()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if tenant_id:
        # Fetch settings that include this tenant
        cursor.execute('''
            SELECT * FROM notification_settings
            ORDER BY created_at DESC
        ''')
        
        all_settings = cursor.fetchall()
        settings = []
        
        for row in all_settings:
            # Parse the tenants JSON array
            row_dict = dict(row)
            try:
                tenants = json.loads(row_dict['tenants'])
                # Include only if this tenant is in the tenants list
                if tenant_id in tenants:
                    # Parse other JSON fields
                    row_dict['update_types'] = json.loads(row_dict['update_types'])
                    settings.append(row_dict)
            except json.JSONDecodeError:
                continue  # Skip if tenants field is invalid JSON
    else:
        # Fetch all settings
        cursor.execute('''
            SELECT * FROM notification_settings
            ORDER BY created_at DESC
        ''')
        
        settings = []
        for row in cursor.fetchall():
            row_dict = dict(row)
            # Parse JSON fields
            try:
                row_dict['tenants'] = json.loads(row_dict['tenants'])
                row_dict['update_types'] = json.loads(row_dict['update_types'])
                settings.append(row_dict)
            except json.JSONDecodeError:
                continue  # Skip if any field is invalid JSON
    
    conn.close()
    return jsonify(settings)

@notification_bp.route('/notification-settings', methods=['POST'])
def add_notification_setting():
    data = request.json
    
    # Validate required fields
    required_fields = ['name', 'email', 'tenants', 'update_types', 'frequency']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'error': 'Missing required field',
                'message': f'The {field} field is required'
            }), 400
    
    # Initialize the notification table if needed
    init_notification_table()
    
    # Check if name/email combination already exists
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM notification_settings
        WHERE name = ? AND email = ?
    ''', (data['name'], data['email']))
    
    if cursor.fetchone():
        conn.close()
        return jsonify({
            'error': 'Duplicate entry',
            'message': 'A notification setting with this name and email already exists'
        }), 400
    
    # Generate an ID for the new setting
    import uuid
    setting_id = str(uuid.uuid4())
    
    # Convert lists to JSON strings
    tenants_json = json.dumps(data['tenants'])
    update_types_json = json.dumps(data['update_types'])
    
    # Get current timestamp
    now = datetime.now().isoformat()
    
    # Insert the new setting
    cursor.execute('''
        INSERT INTO notification_settings (
            id, name, email, tenants, update_types, frequency, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        setting_id,
        data['name'],
        data['email'],
        tenants_json,
        update_types_json,
        data['frequency'],
        now,
        now
    ))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Notification setting added successfully',
        'id': setting_id
    })

@notification_bp.route('/notification-settings/<setting_id>', methods=['PUT'])
def update_notification_setting(setting_id):
    data = request.json
    
    # Initialize the notification table if needed
    init_notification_table()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the setting exists
    cursor.execute('SELECT * FROM notification_settings WHERE id = ?', (setting_id,))
    setting = cursor.fetchone()
    
    if not setting:
        conn.close()
        return jsonify({
            'error': 'Not found',
            'message': f'No notification setting found with ID {setting_id}'
        }), 404
    
    # Update allowed fields (name and email not updatable)
    updates = {}
    
    if 'tenants' in data:
        updates['tenants'] = json.dumps(data['tenants'])
    
    if 'update_types' in data:
        updates['update_types'] = json.dumps(data['update_types'])
    
    if 'frequency' in data:
        updates['frequency'] = data['frequency']
    
    if not updates:
        conn.close()
        return jsonify({
            'error': 'No updates',
            'message': 'No fields to update were provided'
        }), 400
    
    # Add updated timestamp
    updates['updated_at'] = datetime.now().isoformat()
    
    # Build the SQL query
    sql_parts = [f"{field} = ?" for field in updates.keys()]
    sql = f"UPDATE notification_settings SET {', '.join(sql_parts)} WHERE id = ?"
    
    # Execute the update
    cursor.execute(sql, list(updates.values()) + [setting_id])
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Notification setting updated successfully'
    })

@notification_bp.route('/notification-settings/<setting_id>', methods=['DELETE'])
def delete_notification_setting(setting_id):
    # Initialize the notification table if needed
    init_notification_table()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if the setting exists
    cursor.execute('SELECT * FROM notification_settings WHERE id = ?', (setting_id,))
    setting = cursor.fetchone()
    
    if not setting:
        conn.close()
        return jsonify({
            'error': 'Not found',
            'message': f'No notification setting found with ID {setting_id}'
        }), 404
    
    # Delete the setting
    cursor.execute('DELETE FROM notification_settings WHERE id = ?', (setting_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': 'Notification setting deleted successfully'
    })
