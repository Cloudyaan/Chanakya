
from flask import Blueprint, request, jsonify
import sqlite3
import json
from datetime import datetime, timedelta
import os
import time
import threading
import msal
import requests
import uuid

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

# Helper function to ensure arrays are properly handled
def ensureArray(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    return []

# Helper to normalize legacy 'Monthly' frequency to 'Weekly'
def normalizeFrequency(frequency):
    return 'Weekly' if frequency == 'Monthly' else frequency

def get_tenant_name(tenant_id):
    """Get tenant name from its ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT name FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    
    conn.close()
    return tenant['name'] if tenant else "Unknown Tenant"

def ensure_tenant_database(tenant_id):
    """Create a database for a tenant if it doesn't exist"""
    tenant_conn = get_db_connection()
    tenant_data = tenant_conn.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,)).fetchone()
    tenant_conn.close()
    
    if not tenant_data:
        print(f"No tenant found with ID: {tenant_id}")
        return None
    
    tenant_name = tenant_data['name']
    db_path = f"service_announcements_{tenant_data['tenantId']}.db"
    print(f"Ensuring database exists for tenant {tenant_name}: {db_path}")
    
    # Create database with required tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS updates (
            id TEXT PRIMARY KEY,
            title TEXT,
            category TEXT,
            severity TEXT,
            startDateTime TEXT,
            lastModifiedDateTime TEXT,
            isMajorChange TEXT,
            actionRequiredByDateTime TEXT,
            services TEXT,
            hasAttachments BOOLEAN,
            roadmapId TEXT,
            platform TEXT, 
            status TEXT,
            lastUpdateTime TEXT,
            bodyContent TEXT,
            tags TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS m365_news (
            id TEXT PRIMARY KEY,
            title TEXT,
            published_date TEXT,
            link TEXT,
            summary TEXT,
            categories TEXT,
            fetch_date TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS windows_known_issues (
            id TEXT PRIMARY KEY,
            product_id TEXT,
            title TEXT,
            description TEXT,
            webViewUrl TEXT,
            status TEXT,
            start_date TEXT,
            resolved_date TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS windows_products (
            id TEXT PRIMARY KEY,
            name TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Add test data for all types
    add_test_data_to_tenant_db(db_path)
    
    return db_path

def add_test_data_to_tenant_db(db_path):
    """Add test data to the tenant database for demo purposes"""
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Check if we already have test data
        cursor.execute('SELECT COUNT(*) as count FROM m365_news')
        if cursor.fetchone()['count'] == 0:
            print(f"Adding test data to {db_path}")
            
            # Add test news entries
            for i in range(1, 15):
                days_ago = i
                test_entry = {
                    'id': f'test-news-entry-{i}',
                    'title': f'Test Microsoft 365 News Entry {i} ({days_ago} days ago)',
                    'published_date': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    'link': f'https://www.microsoft.com/en-us/microsoft-365/features/{i}',
                    'summary': f'This is test news entry {i} created {days_ago} days ago to verify that filtering is working correctly.',
                    'categories': json.dumps(['Test', 'Debug', f'Day-{days_ago}']),
                    'fetch_date': datetime.now().isoformat()
                }
                
                cursor.execute('''
                    INSERT INTO m365_news (
                        id, title, published_date, link, summary, categories, fetch_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    test_entry['id'],
                    test_entry['title'],
                    test_entry['published_date'],
                    test_entry['link'],
                    test_entry['summary'],
                    test_entry['categories'],
                    test_entry['fetch_date']
                ))
            
            # Add test message center updates
            for i in range(1, 10):
                days_ago = i
                update_entry = {
                    'id': f'test-update-{i}',
                    'title': f'Test Message Center Update {i}',
                    'category': 'Feature update',
                    'severity': 'Medium',
                    'lastModifiedDateTime': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    'isMajorChange': 'False',
                    'bodyContent': f'This is a test message center update {i} created {days_ago} days ago.',
                }
                
                cursor.execute('''
                    INSERT INTO updates (
                        id, title, category, severity, lastModifiedDateTime, isMajorChange, bodyContent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    update_entry['id'],
                    update_entry['title'],
                    update_entry['category'],
                    update_entry['severity'],
                    update_entry['lastModifiedDateTime'],
                    update_entry['isMajorChange'],
                    update_entry['bodyContent']
                ))
            
            # Add test Windows updates
            cursor.execute('''
                INSERT INTO windows_products (id, name) VALUES (?, ?)
            ''', ('win11-22h2', 'Windows 11 22H2'))
            
            for i in range(1, 8):
                days_ago = i
                win_update = {
                    'id': f'test-windows-issue-{i}',
                    'product_id': 'win11-22h2',
                    'title': f'Test Windows Known Issue {i}',
                    'description': f'This is a test Windows known issue {i} created {days_ago} days ago.',
                    'webViewUrl': 'https://learn.microsoft.com/windows/release-health',
                    'status': 'Investigation',
                    'start_date': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    'resolved_date': None
                }
                
                cursor.execute('''
                    INSERT INTO windows_known_issues (
                        id, product_id, title, description, webViewUrl, status, start_date, resolved_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    win_update['id'],
                    win_update['product_id'],
                    win_update['title'],
                    win_update['description'],
                    win_update['webViewUrl'],
                    win_update['status'],
                    win_update['start_date'],
                    win_update['resolved_date']
                ))
            
            conn.commit()
            print(f"Test data added to {db_path}")
        
        conn.close()
    except Exception as e:
        print(f"Error adding test data: {e}")

def get_time_period_for_frequency(frequency, check_period=True):
    """Get the appropriate time period based on notification frequency"""
    if not check_period:
        # Default to 7 days if not checking period (backward compatibility)
        return 7
    
    # Return days based on frequency
    if frequency == "Daily":
        return 1  # Last 24 hours for daily
    elif frequency in ["Weekly", "Monthly"]:
        return 7  # Last 7 days for weekly and monthly
    else:
        return 7  # Default to 7 days for any other frequency

def get_exact_date_for_filter(frequency):
    """Get the exact date to filter from based on frequency"""
    from datetime import datetime, timedelta
    
    now = datetime.now()
    
    if frequency == "Daily":
        # Use beginning of yesterday (00:00:00)
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()
    elif frequency in ["Weekly", "Monthly"]:
        # Use beginning of 7 days ago (00:00:00)
        week_ago_start = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
        return week_ago_start.isoformat()
    else:
        # Default to beginning of yesterday
        yesterday_start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        return yesterday_start.isoformat()

def fetch_message_center_updates(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch message center updates for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching message center updates for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
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
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date = get_exact_date_for_filter(frequency)
            print(f"Filtering updates using exact date filter since: {cutoff_date}")
        else:
            # Use relative time from now (for backward compatibility)
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            print(f"Filtering updates since: {cutoff_date}")
        
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
        print(f"Found {len(updates)} message center updates since {cutoff_date}")
        return updates
    except Exception as e:
        print(f"Error fetching message center updates: {e}")
        return []

def fetch_windows_updates(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch Windows updates for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching Windows updates for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
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
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date = get_exact_date_for_filter(frequency)
            print(f"Filtering Windows updates using exact date filter since: {cutoff_date}")
        else:
            # Use relative time from now (for backward compatibility)
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            print(f"Filtering Windows updates since: {cutoff_date}")
        
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
        print(f"Found {len(updates)} Windows updates since {cutoff_date}")
        return updates
    except Exception as e:
        print(f"Error fetching Windows updates: {e}")
        return []

def fetch_m365_news(tenant_id, frequency="Daily", check_period=True, force_exact_date=False):
    """Fetch M365 news for a tenant for the appropriate time period"""
    # Get days based on frequency
    days = get_time_period_for_frequency(frequency, check_period)
    print(f"Fetching M365 news for last {days} days based on {frequency} frequency")
    
    # Ensure the tenant database exists
    db_path = find_tenant_database(tenant_id)
    if not db_path:
        db_path = ensure_tenant_database(tenant_id)
        if not db_path:
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
        if force_exact_date:
            # Use exact date (beginning of yesterday for daily)
            cutoff_date = get_exact_date_for_filter(frequency)
            print(f"Filtering M365 news using exact date filter since: {cutoff_date}")
        else:
            # Use relative time from now (for backward compatibility)
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            print(f"Filtering M365 news since: {cutoff_date}")
        
        cursor.execute("""
            SELECT * FROM m365_news
            WHERE published_date > ?
            ORDER BY published_date DESC
        """, (cutoff_date,))
        
        news = [dict(row) for row in cursor.fetchall()]
        conn.close()
        print(f"Found {len(news)} M365 news items since {cutoff_date}")
        return news
    except Exception as e:
        print(f"Error fetching M365 news: {e}")
        return []

def create_email_html(setting, updates_data):
    """Create HTML email content for the notification"""
    # Get frequency for the email header
    frequency = setting.get('frequency', 'Regular')
    
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
                background-color: #6E59A5;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 6px 6px 0 0;
            }}
            .section {{
                margin-bottom: 30px;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
            }}
            .section h2 {{
                color: #6E59A5;
                border-bottom: 2px solid #6E59A5;
                padding-bottom: 8px;
                margin-top: 30px;
            }}
            .update-item {{
                padding: 15px;
                margin-bottom: 15px;
                background-color: #f5f5f5;
                border-left: 4px solid #6E59A5;
                border-radius: 4px;
            }}
            .update-title {{
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 16px;
            }}
            .update-meta {{
                font-size: 0.9em;
                color: #666;
                margin-bottom: 10px;
            }}
            .update-id {{
                font-family: monospace;
                color: #666;
                font-size: 0.85em;
            }}
            .update-desc {{
                margin-top: 10px;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                font-size: 0.8em;
                color: #666;
                background-color: #f5f5f5;
                border-radius: 0 0 6px 6px;
            }}
            .badge {{
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 0.75em;
                font-weight: 500;
                text-transform: uppercase;
                margin-right: 5px;
            }}
            .badge-action-required {{
                background-color: #FDE1D3;
                color: #F97316;
            }}
            .badge-plan-change {{
                background-color: #E5DEFF;
                color: #8B5CF6;
            }}
            .badge-info {{
                background-color: #D3E4FD;
                color: #0EA5E9;
            }}
            .badge-status {{
                background-color: #F2FCE2;
                color: #2E7D32;
            }}
            .badge-product {{
                background-color: #FFDEE2;
                color: #D946EF;
            }}
            .date-info {{
                font-size: 0.85em;
                color: #666;
                text-align: right;
                float: right;
            }}
            .no-updates {{
                padding: 15px;
                text-align: center;
                background-color: #f9f9f9;
                border-radius: 4px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Microsoft 365 Updates</h1>
                <p>{frequency} Update Summary</p>
            </div>
    """
    
    # Message Center Updates
    if 'message-center' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Message Center Announcements</h2>
        """
        
        has_updates = False
        
        for tenant_id, updates in updates_data['message_center'].items():
            if updates:
                has_updates = True
                
                for update in updates:
                    action_type = update.get('actionType', 'Informational')
                    badge_class = "badge-info"
                    
                    if action_type == 'Action Required':
                        badge_class = "badge-action-required"
                    elif action_type == 'Plan for Change':
                        badge_class = "badge-plan-change"
                    
                    category = update.get('category', 'General')
                    formatted_category = category
                    if category == 'stayInformed':
                        formatted_category = 'Stay Informed'
                    elif category == 'planForChange':
                        formatted_category = 'Plan For Change'
                    elif category == 'preventOrFixIssue':
                        formatted_category = 'Prevent Or Fix Issue'
                    
                    # Try to format date nicely
                    try:
                        published_date = datetime.fromisoformat(update.get('publishedDate', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        published_date = update.get('publishedDate', 'Unknown Date')
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-id">ID: {update.get('messageId', update.get('id', 'Unknown'))}</div>
                        <div class="update-meta">
                            <span class="badge {badge_class}">{action_type}</span>
                            <span class="badge badge-info">{formatted_category}</span>
                            <span class="date-info">Last Updated: {published_date}</span>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No message center announcements found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
    # Windows Updates
    if 'windows-updates' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Windows Updates</h2>
        """
        
        has_updates = False
        
        for tenant_id, updates in updates_data['windows_updates'].items():
            if updates:
                has_updates = True
                
                for update in updates:
                    # Try to format date nicely
                    try:
                        start_date = datetime.fromisoformat(update.get('startDate', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        start_date = update.get('startDate', 'Unknown Date')
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{update.get('title', 'Untitled Update')}</div>
                        <div class="update-meta">
                            <span class="badge badge-product">{update.get('productName', 'Unknown Product')}</span>
                            <span class="badge badge-status">{update.get('status', 'Unknown Status')}</span>
                            <span class="date-info">Date: {start_date}</span>
                        </div>
                        <div class="update-desc">{update.get('description', 'No description available.')[:200]}...</div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Windows updates found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
    # M365 News
    if 'news' in setting['update_types']:
        html += """
            <div class="section">
                <h2>Microsoft 365 News</h2>
        """
        
        has_updates = False
        
        for tenant_id, news_items in updates_data['m365_news'].items():
            if news_items:
                has_updates = True
                
                for item in news_items:
                    # Try to format date nicely
                    try:
                        published_date = datetime.fromisoformat(item.get('published_date', '')).strftime('%Y-%m-%d')
                    except (ValueError, TypeError):
                        published_date = item.get('published_date', 'Unknown Date')
                    
                    # Get categories if available
                    categories = item.get('categories', [])
                    if isinstance(categories, str):
                        try:
                            categories = json.loads(categories)
                        except:
                            categories = []
                    
                    category_badges = ""
                    if categories and len(categories) > 0:
                        for category in categories[:3]:  # Limit to first 3 categories
                            category_badges += f'<span class="badge badge-info">{category}</span> '
                    
                    html += f"""
                    <div class="update-item">
                        <div class="update-title">{item.get('title', 'Untitled News')}</div>
                        <div class="update-meta">
                            {category_badges}
                            <span class="date-info">Published: {published_date}</span>
                        </div>
                        <div class="update-desc">{item.get('summary', 'No summary available.')[:200]}...</div>
                        <div><a href="{item.get('link', '#')}">Read more</a></div>
                    </div>
                    """
        
        if not has_updates:
            html += """
                <div class="no-updates">
                    No Microsoft 365 news found for the selected time period.
                </div>
            """
        
        html += """
            </div>
        """
    
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

def get_ms_graph_token():
    """Get a Microsoft Graph API access token using MSAL"""
    # Get settings from environment variables
    client_id = os.environ.get('MS_CLIENT_ID')
    client_secret = os.environ.get('MS_CLIENT_SECRET')
    tenant_id = os.environ.get('MS_TENANT_ID')
    authority = f"https://login.microsoftonline.com/{tenant_id}"
    scope = ["https://graph.microsoft.com/.default"]
    
    # Create MSAL app
    app = msal.ConfidentialClientApplication(
        client_id,
        authority=authority,
        client_credential=client_secret
    )
    
    # Get token
    result = app.acquire_token_for_client(scopes=scope)
    
    if "access_token" in result:
        return result["access_token"]
    else:
        print(f"Error getting token: {result.get('error')}")
        print(f"Error description: {result.get('error_description')}")
        return None

def send_email_with_ms_graph(recipient, subject, html_content):
    """Send an email using Microsoft Graph API"""
    token = get_ms_graph_token()
    if not token:
        print("Failed to get Microsoft Graph access token")
        return False
    
    # Get sender email from environment variable
    sender_email = os.environ.get('MS_FROM_EMAIL')
    
    # Prepare the email message
    email_message = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_content
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": recipient
                    }
                }
            ],
            "from": {
                "emailAddress": {
                    "address": sender_email
                }
            }
        }
    }
    
    # Send the email using Microsoft Graph API
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            'https://graph.microsoft.com/v1.0/users/' + sender_email + '/sendMail',
            headers=headers,
            json=email_message
        )
        
        if response.status_code >= 200 and response.status_code < 300:
            print(f"Email sent successfully to {recipient}")
            return True
        else:
            print(f"Failed to send email. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error sending email with Microsoft Graph: {e}")
        return False

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
    """Run the notification scheduler thread"""
    print("Starting notification scheduler...")
    
    while True:
        try:
            # Check for notifications that need to be sent
            now = datetime.now()
            print(f"Running scheduled notifications at {now.isoformat()}")
            
            conn = get_db_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get all notification settings
            cursor.execute('SELECT * FROM notification_settings')
            settings = cursor.fetchall()
            
            conn.close()
            
            # Process each setting
            for setting in settings:
                frequency = setting['frequency']
                
                # Send notifications based on frequency
                if frequency == 'Daily' and now.hour == 9:  # 9 AM daily
                    process_and_send_notification(setting['id'], check_period=True)
                
                elif frequency == 'Weekly' and now.weekday() == 0 and now.hour == 9:  # Monday at 9 AM
                    process_and_send_notification(setting['id'], check_period=True)
                
                elif frequency == 'Monthly' and now.day == 1 and now.hour == 9:  # 1st day of month at 9 AM
                    process_and_send_notification(setting['id'], check_period=True)
            
        except Exception as e:
            print(f"Error in notification scheduler: {e}")
        
        # Sleep for an hour before checking again
        time.sleep(3600)

# Start the scheduler in a background thread
scheduler_thread = threading.Thread(target=run_notification_scheduler)
scheduler_thread.daemon = True
scheduler_thread.start()
