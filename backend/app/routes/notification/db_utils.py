
import sqlite3
import json
from datetime import datetime, timedelta
from app.database import get_db_connection, find_tenant_database

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
