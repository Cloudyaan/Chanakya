
from flask import request, jsonify
import json
import uuid
from datetime import datetime

from app.database import get_db_connection
from . import notification_bp
from .db_helpers import init_notification_table
from .processor import process_and_send_notification

# Initialize the notification table
init_notification_table()

@notification_bp.route('/notification-settings', methods=['GET'])
def get_notification_settings():
    """Get all notification settings or filter by tenant ID"""
    tenant_id = request.args.get('tenantId')
    
    conn = get_db_connection()
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
                    # Convert pyodbc.Row to dictionary
                    setting_dict = {
                        'id': setting[0],
                        'name': setting[1],
                        'email': setting[2],
                        'tenants': setting[3],
                        'update_types': setting[4],
                        'frequency': setting[5],
                        'created_at': setting[6],
                        'updated_at': setting[7]
                    }
                    
                    tenants = json.loads(setting_dict['tenants'])
                    if tenant_id in tenants:
                        # Parse JSON fields for the response
                        setting_dict['tenants'] = tenants
                        setting_dict['update_types'] = json.loads(setting_dict['update_types'])
                        settings.append(setting_dict)
                except (json.JSONDecodeError, TypeError):
                    continue
        else:
            # Get all settings
            cursor.execute('SELECT * FROM notification_settings')
            all_settings = cursor.fetchall()
            
            settings = []
            for setting in all_settings:
                setting_dict = {
                    'id': setting[0],
                    'name': setting[1],
                    'email': setting[2],
                    'tenants': setting[3],
                    'update_types': setting[4],
                    'frequency': setting[5],
                    'created_at': setting[6],
                    'updated_at': setting[7]
                }
                
                # Parse JSON fields for the response
                try:
                    setting_dict['tenants'] = json.loads(setting_dict['tenants'])
                    setting_dict['update_types'] = json.loads(setting_dict['update_types'])
                    settings.append(setting_dict)
                except (json.JSONDecodeError, TypeError):
                    # Skip invalid entries
                    continue
        
        return jsonify(settings)
    except Exception as e:
        print(f"Error retrieving notification settings: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
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
        cursor.close()
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
        cursor.close()
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
        cursor.close()
        conn.close()

@notification_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """Send a notification immediately with proper settings verification"""
    data = request.json
    setting_id = data.get('id')
    
    if not setting_id:
        return jsonify({"error": "Missing notification setting ID"}), 400
    
    try:
        print(f"Processing notification for setting ID: {setting_id}")
        
        # Get the additional parameters from the request
        use_existing_databases = data.get('useExistingDatabases', True)
        verify_settings = data.get('verifySettings', True)
        check_period = data.get('checkPeriod', True)
        force_exact_date = data.get('forceExactDateFilter', True)
        
        # Call the notification processor with proper parameters
        result = process_and_send_notification(
            setting_id=setting_id,
            use_existing_databases=use_existing_databases,
            check_period=check_period,
            force_exact_date=force_exact_date
        )
        
        if result.get('success', False):
            # Get the specific result for this setting
            setting_results = result.get('results', [])
            if setting_results:
                setting_result = setting_results[0]  # Should be only one result for specific setting ID
                if setting_result.get('success', False):
                    return jsonify({"message": "Notification sent successfully"})
                else:
                    return jsonify({"error": setting_result.get('message', 'Failed to send notification')}), 500
            else:
                return jsonify({"error": "No results returned from notification processor"}), 500
        else:
            return jsonify({"error": result.get('message', 'Failed to process notification')}), 500
            
    except Exception as e:
        print(f"Error sending notification: {e}")
        return jsonify({"error": str(e)}), 500
