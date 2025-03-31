
from flask import Blueprint, request, jsonify
import sqlite3
import json
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import time
import threading
import schedule

from app.database import get_db_connection, init_db, find_tenant_database

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

def get_tenant_name(tenant_id):
    """Get tenant name from its ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT name FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    
    conn.close()
    return tenant['name'] if tenant else "Unknown Tenant"

def fetch_message_center_updates(tenant_id, days=1):
    """Fetch message center updates for a tenant for the specified number of days"""
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        print(f"No database found for tenant ID: {tenant_id}")
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check which table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name='updates' OR name='announcements')")
        table_result = cursor.fetchone()
        
        if not table_result:
            return []
            
        table_name = table_result['name']
        
        # Calculate the date range
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Query based on which table exists
        if table_name == 'updates':
            cursor.execute(f"""
                SELECT 
                    id, title, category, severity, lastModifiedDateTime as publishedDate,
                    isMajorChange as actionType, bodyContent as description
                FROM updates
                WHERE lastModifiedDateTime > ?
                ORDER BY lastModifiedDateTime DESC
            """, (cutoff_date,))
        else:  # announcements
            cursor.execute(f"""
                SELECT 
                    id, title, category, severity, lastModifiedDateTime as publishedDate,
                    isMajorChange as actionType, bodyContent as description
                FROM announcements
                WHERE lastModifiedDateTime > ?
                ORDER BY lastModifiedDateTime DESC
            """, (cutoff_date,))
        
        updates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return updates
    except Exception as e:
        print(f"Error fetching message center updates: {e}")
        return []

def fetch_windows_updates(tenant_id, days=1):
    """Fetch Windows updates for a tenant for the specified number of days"""
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        print(f"No database found for tenant ID: {tenant_id}")
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the windows_known_issues table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='windows_known_issues'")
        if not cursor.fetchone():
            return []
        
        # Calculate the date range
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("""
            SELECT 
                wi.id, wi.product_id as productId, wi.title, wi.description, 
                wi.webViewUrl, wi.status, wi.start_date as startDate, 
                wi.resolved_date as resolvedDate, wp.name as productName
            FROM windows_known_issues wi
            LEFT JOIN windows_products wp ON wi.product_id = wp.id
            WHERE wi.start_date > ?
            ORDER BY wi.start_date DESC
        """, (cutoff_date,))
        
        updates = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return updates
    except Exception as e:
        print(f"Error fetching Windows updates: {e}")
        return []

def fetch_m365_news(tenant_id, days=1):
    """Fetch M365 news for a tenant for the specified number of days"""
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        print(f"No database found for tenant ID: {tenant_id}")
        return []
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if the m365_news table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='m365_news'")
        if not cursor.fetchone():
            return []
        
        # Calculate the date range
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        cursor.execute("""
            SELECT * FROM m365_news
            WHERE published_date > ?
            ORDER BY published_date DESC
        """, (cutoff_date,))
        
        news = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return news
    except Exception as e:
        print(f"Error fetching M365 news: {e}")
        return []

def create_email_html(setting, updates_data):
    """Create HTML email content for the notification"""
    tenant_names = {tenant_id: get_tenant_name(tenant_id) for tenant_id in setting['tenants']}
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Microsoft 365 Updates</title>
        <style>
            body {{
                font-family: 'Segoe UI', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f9f9f9;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            }}
            .header {{
                background-color: #0078d4;
                color: white;
                padding: 20px;
                text-align: center;
            }}
            .section {{
                margin-bottom: 30px;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
            }}
            .section h2 {{
                color: #0078d4;
                border-bottom: 2px solid #0078d4;
                padding-bottom: 8px;
            }}
            .update-item {{
                padding: 15px;
                margin-bottom: 15px;
                background-color: #f5f5f5;
                border-left: 4px solid #0078d4;
            }}
            .update-title {{
                font-weight: bold;
                margin-bottom: 5px;
            }}
            .update-meta {{
                font-size: 0.9em;
                color: #666;
                margin-bottom: 10px;
            }}
            .update-desc {{
                margin-top: 10px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 0.8em;
                color: #666;
            }}
            .high {{
                border-left-color: #d13438;
            }}
            .medium {{
                border-left-color: #ff8c00;
            }}
            .low {{
                border-left-color: #107c10;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Microsoft 365 Update Notification</h1>
                <p>{setting['frequency']} Update for {setting['name']}</p>
            </div>
    """
    
    # Add tenant information
    html += """
            <div class="section">
                <h2>Tenant Information</h2>
    """
    for tenant_id, tenant_name in tenant_names.items():
        html += f"<p><strong>{tenant_name}</strong> - {tenant_id}</p>"
    html += "</div>"
    
    # Message Center Updates
    if 'message-center' in setting['update_types'] and any(updates_data['message_center']):
        html += """
            <div class="section">
                <h2>Message Center Updates</h2>
        """
        
        for tenant_id, updates in updates_data['message_center'].items():
            tenant_name = tenant_names.get(tenant_id, "Unknown Tenant")
            if updates:
                html += f"<h3>{tenant_name}</h3>"
                
                for update in updates:
                    severity_class = "medium"
                    if update.get('severity') == 'High':
                        severity_class = "high"
                    elif update.get('severity') == 'Low':
                        severity_class = "low"
                    
                    html += f"""
                    <div class="update-item {severity_class}">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-meta">
                            Category: {update.get('category', 'Uncategorized')} | 
                            Severity: {update.get('severity', 'Normal')} | 
                            Published: {update.get('publishedDate', 'Unknown Date')}
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:300]}...</div>
                    </div>
                    """
        html += "</div>"
    
    # Windows Updates
    if 'windows-updates' in setting['update_types'] and any(updates_data['windows_updates']):
        html += """
            <div class="section">
                <h2>Windows Updates</h2>
        """
        
        for tenant_id, updates in updates_data['windows_updates'].items():
            tenant_name = tenant_names.get(tenant_id, "Unknown Tenant")
            if updates:
                html += f"<h3>{tenant_name}</h3>"
                
                for update in updates:
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-meta">
                            Product: {update.get('productName', 'Unknown Product')} | 
                            Status: {update.get('status', 'Unknown Status')} | 
                            Start Date: {update.get('startDate', 'Unknown Date')}
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:300]}...</div>
                    </div>
                    """
        html += "</div>"
    
    # M365 News
    if 'news' in setting['update_types'] and any(updates_data['m365_news']):
        html += """
            <div class="section">
                <h2>Microsoft 365 News</h2>
        """
        
        for tenant_id, news_items in updates_data['m365_news'].items():
            tenant_name = tenant_names.get(tenant_id, "Unknown Tenant")
            if news_items:
                html += f"<h3>{tenant_name}</h3>"
                
                for item in news_items:
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{item.get('title', 'Untitled News')}</div>
                        <div class="update-meta">
                            Published: {item.get('published_date', 'Unknown Date')}
                        </div>
                        <div class="update-desc">{item.get('summary', 'No summary available.')[:300]}...</div>
                        <div><a href="{item.get('link', '#')}">Read more</a></div>
                    </div>
                    """
        html += "</div>"
    
    # Footer
    html += f"""
            <div class="footer">
                <p>This email was sent as part of your Microsoft 365 notification settings.</p>
                <p>Update frequency: {setting['frequency']} | Date sent: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html

def send_email(recipient, subject, html_content):
    """Send an email using SMTP"""
    # Use environment variables for email settings
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_password = os.environ.get('SMTP_PASSWORD', '')
    sender_email = os.environ.get('SENDER_EMAIL', 'noreply@example.com')
    
    # Check if SMTP credentials are available
    if not all([smtp_server, smtp_port, smtp_user, smtp_password]):
        print("SMTP settings are not configured properly. Email not sent.")
        return False
    
    # Create email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_email
    msg['To'] = recipient
    
    # Attach HTML content
    msg.attach(MIMEText(html_content, 'html'))
    
    try:
        # Connect to SMTP server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        
        # Send email
        server.sendmail(sender_email, recipient, msg.as_string())
        server.quit()
        print(f"Email sent successfully to {recipient}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def process_and_send_notification(setting_id=None):
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
        except json.JSONDecodeError:
            print(f"Invalid JSON in notification setting {setting_dict['id']}")
            results.append({"id": setting_dict['id'], "success": False, "message": "Invalid configuration"})
            continue
        
        # Determine time range based on frequency
        days = 1  # Default to daily (yesterday)
        if setting_dict['frequency'] == 'Weekly':
            days = 7
        elif setting_dict['frequency'] == 'Monthly':
            days = 30
        
        # Collect updates for each tenant and type
        updates_data = {
            'message_center': {},
            'windows_updates': {},
            'm365_news': {}
        }
        
        has_updates = False
        
        for tenant_id in tenants:
            # Fetch message center updates if selected
            if 'message-center' in update_types:
                mc_updates = fetch_message_center_updates(tenant_id, days)
                updates_data['message_center'][tenant_id] = mc_updates
                has_updates |= bool(mc_updates)
            
            # Fetch Windows updates if selected
            if 'windows-updates' in update_types:
                win_updates = fetch_windows_updates(tenant_id, days)
                updates_data['windows_updates'][tenant_id] = win_updates
                has_updates |= bool(win_updates)
            
            # Fetch M365 news if selected
            if 'news' in update_types:
                news = fetch_m365_news(tenant_id, days)
                updates_data['m365_news'][tenant_id] = news
                has_updates |= bool(news)
        
        if not has_updates:
            print(f"No updates found for notification {setting_dict['id']}")
            results.append({"id": setting_dict['id'], "success": False, "message": "No updates found"})
            continue
        
        # Create email content
        email_html = create_email_html(setting_dict, updates_data)
        
        # Send email
        subject = f"Microsoft 365 {setting_dict['frequency']} Update"
        success = send_email(setting_dict['email'], subject, email_html)
        
        if success:
            results.append({
                "id": setting_dict['id'], 
                "success": True, 
                "message": f"Email sent to {setting_dict['email']}"
            })
        else:
            results.append({
                "id": setting_dict['id'], 
                "success": False, 
                "message": "Failed to send email"
            })
    
    return {"success": True, "results": results}

@notification_bp.route('/send-notification', methods=['POST'])
def send_notification():
    """API endpoint to manually trigger sending a notification"""
    setting_id = request.json.get('id')
    
    if not setting_id:
        return jsonify({
            'error': 'Missing setting ID',
            'message': 'Please provide a notification setting ID'
        }), 400
    
    # Process and send the notification
    results = process_and_send_notification(setting_id)
    
    if not results.get('success'):
        return jsonify({
            'success': False,
            'message': results.get('message', 'Failed to process notification')
        }), 500
    
    return jsonify({
        'success': True,
        'message': 'Notification processed successfully',
        'results': results.get('results', [])
    })

# Schedule runner
def run_scheduled_notifications():
    """Run notifications based on their schedule"""
    now = datetime.now()
    print(f"Running scheduled notifications at {now.isoformat()}")
    
    # Daily at 8:00 AM
    if now.hour == 8 and now.minute < 5:
        print("Running daily notifications")
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM notification_settings WHERE frequency = 'Daily'")
        daily_settings = cursor.fetchall()
        conn.close()
        
        if daily_settings:
            for setting in daily_settings:
                process_and_send_notification(setting['id'])
    
    # Weekly on Monday at 8:00 AM
    if now.weekday() == 0 and now.hour == 8 and now.minute < 5:
        print("Running weekly notifications")
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM notification_settings WHERE frequency = 'Weekly'")
        weekly_settings = cursor.fetchall()
        conn.close()
        
        if weekly_settings:
            for setting in weekly_settings:
                process_and_send_notification(setting['id'])
    
    # Monthly on 1st of month at 8:00 AM
    if now.day == 1 and now.hour == 8 and now.minute < 5:
        print("Running monthly notifications")
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM notification_settings WHERE frequency = 'Monthly'")
        monthly_settings = cursor.fetchall()
        conn.close()
        
        if monthly_settings:
            for setting in monthly_settings:
                process_and_send_notification(setting['id'])

# Thread for running the scheduler
scheduler_thread = None

def start_scheduler():
    """Start the scheduler in a separate thread"""
    def run_scheduler():
        while True:
            run_scheduled_notifications()
            time.sleep(60)  # Check every minute
    
    global scheduler_thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    print("Notification scheduler started")

# Start the scheduler when the app starts
start_scheduler()
