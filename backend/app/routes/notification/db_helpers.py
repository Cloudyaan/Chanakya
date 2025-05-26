
import json
from datetime import datetime, timedelta
from app.database import get_db_connection, get_tenant_table_connection, ensure_tenant_tables_exist

def init_notification_table():
    """Initialize the notification_settings table if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_settings' AND xtype='U')
        CREATE TABLE notification_settings (
            id NVARCHAR(255) PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            email NVARCHAR(255) NOT NULL,
            tenants NVARCHAR(MAX) NOT NULL,
            update_types NVARCHAR(MAX) NOT NULL,
            frequency NVARCHAR(50) NOT NULL,
            created_at NVARCHAR(100) NOT NULL,
            updated_at NVARCHAR(100) NOT NULL
        )
    ''')
    
    conn.commit()
    cursor.close()
    conn.close()

def get_tenant_name(tenant_id):
    """Get tenant name from its ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT name FROM tenants WHERE id = ?', (tenant_id,))
    tenant = cursor.fetchone()
    
    cursor.close()
    conn.close()
    return tenant[0] if tenant else "Unknown Tenant"

def ensure_tenant_database(tenant_id):
    """Ensure tenant tables exist in Azure SQL Database"""
    # Ensure tables exist for this tenant
    success = ensure_tenant_tables_exist(tenant_id, 'm365')
    
    if success:
        # Add test data if tables are newly created
        add_test_data_to_tenant_tables(tenant_id)
        return True
    
    return None

def add_test_data_to_tenant_tables(tenant_id):
    """Add test data to the tenant tables for demo purposes"""
    try:
        # Check if we already have test data for m365_news
        conn, news_table = get_tenant_table_connection(tenant_id, 'm365_news', 'm365')
        if not conn or not news_table:
            return
        
        cursor = conn.cursor()
        
        # Check if we already have test data
        cursor.execute(f'SELECT COUNT(*) FROM {news_table}')
        count = cursor.fetchone()[0]
        
        if count == 0:
            print(f"Adding test data to tenant tables for {tenant_id}")
            
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
                
                cursor.execute(f'''
                    INSERT INTO {news_table} (
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
            _, updates_table = get_tenant_table_connection(tenant_id, 'updates', 'm365')
            
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
                
                cursor.execute(f'''
                    INSERT INTO {updates_table} (
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
            _, products_table = get_tenant_table_connection(tenant_id, 'windows_products', 'm365')
            _, issues_table = get_tenant_table_connection(tenant_id, 'windows_known_issues', 'm365')
            
            cursor.execute(f'''
                INSERT INTO {products_table} (id, name, group_name, friendly_names) VALUES (?, ?, ?, ?)
            ''', ('win11-22h2', 'Windows 11 22H2', 'Windows 11', 'Windows 11 Version 22H2'))
            
            for i in range(1, 8):
                days_ago = i
                win_update = {
                    'id': f'test-windows-issue-{i}',
                    'product_id': 'win11-22h2',
                    'title': f'Test Windows Known Issue {i}',
                    'description': f'This is a test Windows known issue {i} created {days_ago} days ago.',
                    'web_view_url': 'https://learn.microsoft.com/windows/release-health',
                    'status': 'Investigation',
                    'start_date': (datetime.now() - timedelta(days=days_ago)).isoformat(),
                    'resolved_date': None
                }
                
                cursor.execute(f'''
                    INSERT INTO {issues_table} (
                        id, product_id, title, description, web_view_url, status, start_date, resolved_date
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    win_update['id'],
                    win_update['product_id'],
                    win_update['title'],
                    win_update['description'],
                    win_update['web_view_url'],
                    win_update['status'],
                    win_update['start_date'],
                    win_update['resolved_date']
                ))
            
            conn.commit()
            print(f"Test data added to tenant tables for {tenant_id}")
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error adding test data: {e}")
