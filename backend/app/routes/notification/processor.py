
import sqlite3
import json
import os
import time
import threading
from datetime import datetime
from dateutil import parser
from flask import request, jsonify

from app.database import get_db_connection
from . import notification_bp
from .data_retrieval import fetch_message_center_updates, fetch_windows_updates, fetch_m365_news
from .email_template import create_email_html
from .email_sender import send_email_with_ms_graph

def process_and_send_notification(setting_id=None, use_existing_databases=False, check_period=True, force_exact_date=False):
    """Process notifications and send emails"""
    conn = get_db_connection()
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get notification settings to process
    if setting_id:
        cursor.execute('SELECT * FROM notification_settings WHERE id = ?', (setting_id,))
        settings = cursor.fetchall()
    else:
        # For scheduled runs, get all settings
        cursor.execute('SELECT * FROM notification_settings')
        settings = cursor.fetchall()
    
    conn.close()
    
    if not settings:
        print("No notification settings found to process")
        return {"success": False, "message": "No notification settings found"}
    
    results = []
    
    for setting in settings:
        setting_dict = dict(setting)
        
        # Parse JSON fields
        try:
            tenants = json.loads(setting_dict['tenants'])
            update_types = json.loads(setting_dict['update_types'])
            
            setting_dict['tenants'] = tenants
            setting_dict['update_types'] = update_types
        except (json.JSONDecodeError, TypeError) as e:
            print(f"Error parsing JSON fields: {e}")
            results.append({
                "id": setting_dict['id'],
                "success": False,
                "message": f"Error parsing notification settings: {str(e)}"
            })
            continue
        
        # Get the frequency to determine time period
        frequency = setting_dict.get('frequency', 'Daily')
        print(f"Processing notification with frequency: {frequency}")
        
        # Get updates for each tenant
        all_updates = {
            'message_center': {},
            'windows_updates': {},
            'm365_news': {}
        }
        
        updates_found = False
        
        for tenant_id in tenants:
            # Get appropriate updates based on update types, passing frequency
            if 'message-center' in update_types:
                message_center_updates = fetch_message_center_updates(tenant_id, frequency, check_period, force_exact_date)
                if message_center_updates:
                    updates_found = True
                    all_updates['message_center'][tenant_id] = message_center_updates
                else:
                    print(f"No message center updates found for tenant {tenant_id}")
                    all_updates['message_center'][tenant_id] = []
            
            if 'windows-updates' in update_types:
                windows_updates = fetch_windows_updates(tenant_id, frequency, check_period, force_exact_date)
                if windows_updates:
                    updates_found = True
                    all_updates['windows_updates'][tenant_id] = windows_updates
                else:
                    print(f"No Windows updates found for tenant {tenant_id}")
                    all_updates['windows_updates'][tenant_id] = []
            
            if 'news' in update_types:
                m365_news = fetch_m365_news(tenant_id, frequency, check_period, force_exact_date)
                if m365_news:
                    updates_found = True
                    all_updates['m365_news'][tenant_id] = m365_news
                else:
                    print(f"No M365 news found for tenant {tenant_id}")
                    all_updates['m365_news'][tenant_id] = []
        
        if use_existing_databases and not updates_found:
            print(f"No updates found for notification {setting_dict['id']} and using existing databases only")
            results.append({
                "id": setting_dict['id'],
                "success": False,
                "message": "No updates found using existing databases only"
            })
            continue
        
        if not updates_found:
            print(f"No updates found for notification {setting_dict['id']}")
            results.append({
                "id": setting_dict['id'],
                "success": False,
                "message": "No updates found for the specified time period"
            })
            continue
        
        # Create email content
        email_html = create_email_html(setting_dict, all_updates)
        
        # Send email
        subject = f"Microsoft 365 {setting_dict['frequency']} Update Summary"
        
        email_sent = send_email_with_ms_graph(
            recipient=setting_dict['email'],
            subject=subject,
            html_content=email_html
        )
        
        results.append({
            "id": setting_dict['id'],
            "success": email_sent,
            "message": "Email sent successfully" if email_sent else "Failed to send email"
        })
    
    return {"success": True, "results": results}

@notification_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """Send a notification immediately"""
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

# Start the notification scheduler thread
def run_notification_scheduler():
    # ... keep existing code (notification scheduler thread) the same
    pass

# Start the scheduler in a background thread
scheduler_thread = threading.Thread(target=run_notification_scheduler)
scheduler_thread.daemon = True
scheduler_thread.start()
