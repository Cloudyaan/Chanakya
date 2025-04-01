
from flask import request, jsonify
import sqlite3
import json
from datetime import datetime
import uuid
from backend.app.routes.notification import notification_bp
from app.database import get_db_connection

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

@notification_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """Send a notification immediately"""
    from backend.app.routes.notification.process import process_and_send_notification
    
    data = request.json or {}
    setting_id = data.get('id')
    use_existing_databases = data.get('useExistingDatabases', False)
    check_period = data.get('checkPeriod', False)
    force_exact_date = data.get('forceExactDateFilter', False)
    
    if not setting_id:
        return jsonify({"error": "No notification setting ID provided"}), 400
    
    # Print the notification settings
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM notification_settings WHERE id = ?', (setting_id,))
    setting = cursor.fetchone()
    conn.close()
    
    if setting:
        print(f"Processing notification: {dict(setting)}")
    
    result = process_and_send_notification(setting_id, use_existing_databases, check_period, force_exact_date)
    return jsonify(result)
