
from flask import request, jsonify
import sqlite3
import json
import uuid
from datetime import datetime

from app.database import get_db_connection
from . import notification_bp
from .db_helpers import init_notification_table

# Initialize the notification table
init_notification_table()

@notification_bp.route('/notification-settings', methods=['GET'])
def get_notification_settings():
    """Get all notification settings or filter by tenant ID"""
    tenant_id = request.args.get('tenantId')
    
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        if tenant_id:
            # Get settings that include this tenant
            cursor.execute('SELECT * FROM notification_settings')
            all_settings = cursor.fetchall()
            
            # Filter settings that include the specified tenant
            settings = []
            for setting in all_settings:
                try:
                    tenants = json.loads(setting['tenants'])
                    if tenant_id in tenants:
                        settings.append(dict(setting))
                except (json.JSONDecodeError, TypeError):
                    continue
        else:
            # Get all settings
            cursor.execute('SELECT * FROM notification_settings')
            settings = [dict(row) for row in cursor.fetchall()]
        
        return jsonify(settings)
    except Exception as e:
        print(f"Error retrieving notification settings: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@notification_bp.route('/notification-settings', methods=['POST'])
def add_notification_setting():
    """Add a new notification setting"""
    data = request.json
    
    required_fields = ['name', 'email', 'tenants', 'update_types', 'frequency']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Create a new notification setting
    setting_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    # Ensure tenants and update_types are JSON strings
    tenants_json = json.dumps(data['tenants'])
    update_types_json = json.dumps(data['update_types'])
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
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
        return jsonify({
            "id": setting_id,
            "message": "Notification setting created successfully"
        })
    except Exception as e:
        conn.rollback()
        print(f"Error adding notification setting: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@notification_bp.route('/notification-settings/<id>', methods=['PUT'])
def update_notification_setting(id):
    """Update an existing notification setting"""
    data = request.json
    now = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Get current setting to update only provided fields
        cursor.execute('SELECT * FROM notification_settings WHERE id = ?', (id,))
        setting = cursor.fetchone()
        
        if not setting:
            return jsonify({"error": "Notification setting not found"}), 404
        
        # Prepare update values
        updates = {}
        
        if 'tenants' in data:
            updates['tenants'] = json.dumps(data['tenants'])
        
        if 'update_types' in data:
            updates['update_types'] = json.dumps(data['update_types'])
        
        if 'frequency' in data:
            updates['frequency'] = data['frequency']
        
        if 'name' in data:
            updates['name'] = data['name']
        
        if 'email' in data:
            updates['email'] = data['email']
        
        updates['updated_at'] = now
        
        # Build the SQL update statement
        sql_parts = []
        values = []
        
        for key, value in updates.items():
            sql_parts.append(f"{key} = ?")
            values.append(value)
        
        values.append(id)  # For the WHERE clause
        
        cursor.execute(
            f"UPDATE notification_settings SET {', '.join(sql_parts)} WHERE id = ?",
            values
        )
        
        conn.commit()
        return jsonify({"message": "Notification setting updated successfully"})
    except Exception as e:
        conn.rollback()
        print(f"Error updating notification setting: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@notification_bp.route('/notification-settings/<id>', methods=['DELETE'])
def delete_notification_setting(id):
    """Delete a notification setting"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM notification_settings WHERE id = ?', (id,))
        conn.commit()
        
        if cursor.rowcount > 0:
            return jsonify({"message": "Notification setting deleted successfully"})
        else:
            return jsonify({"error": "Notification setting not found"}), 404
    except Exception as e:
        conn.rollback()
        print(f"Error deleting notification setting: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
